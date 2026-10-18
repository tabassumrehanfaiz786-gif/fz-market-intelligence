import { useEffect, useState } from 'react';

export type Tier = 'retail' | 'mid' | 'large' | 'whale';
export const tiers: { key: Tier; label: string; range: string; min: number }[] = [
  { key: 'retail', label: 'Retail', range: '< $10k', min: 0 },
  { key: 'mid', label: 'Mid-tier', range: '$10k – $100k', min: 10_000 },
  { key: 'large', label: 'Large', range: '$100k – $1M', min: 100_000 },
  { key: 'whale', label: 'Whale', range: '> $1M', min: 1_000_000 },
];
export function tierOf(notional: number): Tier {
  return notional >= 1_000_000 ? 'whale' : notional >= 100_000 ? 'large' : notional >= 10_000 ? 'mid' : 'retail';
}
export type TierStats = { buy: number; sell: number; count: number };
export type WallEvent = { id: string; side: 'bid' | 'ask'; price: number; qty: number; firstSeen: number; lastSeen: number; outcome: 'resting' | 'filled' | 'cancelled'; distanceBps: number };
export type OrderFlowState = {
  status: 'connecting' | 'live' | 'disconnected';
  price: number | null;
  tierStats: Record<Tier, TierStats>;
  walls: WallEvent[];
  bids: [number, number][];
  asks: [number, number][];
  sessionStart: number;
  lastUpdate: number | null;
  lastTradeId: number | null;
};

const emptyTiers = (): Record<Tier, TierStats> => ({ retail: { buy: 0, sell: 0, count: 0 }, mid: { buy: 0, sell: 0, count: 0 }, large: { buy: 0, sell: 0, count: 0 }, whale: { buy: 0, sell: 0, count: 0 } });

/** Classifies a removed wall: filled if price traded through it, otherwise cancelled. */
export function classifyWall(side: 'bid' | 'ask', wallPrice: number, lowSeen: number, highSeen: number): 'filled' | 'cancelled' {
  return side === 'bid' ? (lowSeen <= wallPrice ? 'filled' : 'cancelled') : (highSeen >= wallPrice ? 'filled' : 'cancelled');
}

/** Live Binance spot order flow for any USDT pair: size-tiered delta and large-wall lifecycle tracking. */
export function useOrderFlow(symbol = 'BTCUSDT', wallMultiple = 5): OrderFlowState {
  const [state, setState] = useState<OrderFlowState>(() => ({ status: 'connecting', price: null, tierStats: emptyTiers(), walls: [], bids: [], asks: [], sessionStart: Date.now(), lastUpdate: null, lastTradeId: null }));
  useEffect(() => {
    const s = symbol.toLowerCase();
    let closed = false; let ws: WebSocket | undefined; let retry: ReturnType<typeof setTimeout> | undefined;
    const tierStats = emptyTiers();
    const active = new Map<string, WallEvent & { low: number; high: number }>();
    let history: WallEvent[] = [];
    let price: number | null = null; let lastTradeId: number | null = null;
    setState({ status: 'connecting', price: null, tierStats: emptyTiers(), walls: [], bids: [], asks: [], sessionStart: Date.now(), lastUpdate: null, lastTradeId: null });
    const connect = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${s}@aggTrade/${s}@depth20@100ms`);
      ws.onmessage = (ev) => {
        const { stream, data } = JSON.parse(ev.data);
        const now = Date.now();
        if (stream.endsWith('@aggTrade')) {
          const p = +data.p, q = +data.q; price = p; lastTradeId = data.a;
          const t = tierStats[tierOf(p * q)];
          if (data.m) t.sell += q; else t.buy += q; t.count++;
          for (const w of active.values()) { w.low = Math.min(w.low, p); w.high = Math.max(w.high, p); }
          setState((st) => ({ ...st, status: 'live', price, tierStats: { ...tierStats }, lastUpdate: now, lastTradeId }));
        } else {
          const bids = (data.bids as string[][]).map((l) => [+l[0]!, +l[1]!] as [number, number]);
          const asks = (data.asks as string[][]).map((l) => [+l[0]!, +l[1]!] as [number, number]);
          const all = [...bids, ...asks];
          const median = all.map((l) => l[1]).sort((a, b) => a - b)[Math.floor(all.length / 2)] ?? 0;
          const threshold = Math.max(median * wallMultiple, 0.0001);
          const seen = new Set<string>();
          const mid = bids[0] && asks[0] ? (bids[0][0] + asks[0][0]) / 2 : price ?? 0;
          const scan = (levels: [number, number][], side: 'bid' | 'ask') => levels.forEach(([lp, lq]) => {
            if (lq < threshold) return;
            const id = `${side}-${lp}`; seen.add(id);
            const w = active.get(id);
            if (w) { w.lastSeen = now; w.qty = Math.max(w.qty, lq); }
            else active.set(id, { id, side, price: lp, qty: lq, firstSeen: now, lastSeen: now, outcome: 'resting', distanceBps: mid ? Math.abs(lp - mid) / mid * 10000 : 0, low: price ?? lp, high: price ?? lp });
          });
          scan(bids, 'bid'); scan(asks, 'ask');
          const bestBid = bids[0]?.[0] ?? 0, bestAsk = asks.at(-1)?.[0] ?? Infinity, worstBid = bids.at(-1)?.[0] ?? 0;
          for (const [id, w] of active) {
            if (seen.has(id)) continue;
            // Level left the visible 20-level window because price moved away: not an observed removal.
            const outOfWindow = w.side === 'bid' ? w.price < worstBid : w.price > bestAsk;
            active.delete(id);
            if (outOfWindow) continue;
            const { low, high, ...rest } = w;
            history = [{ ...rest, outcome: classifyWall(w.side, w.price, Math.min(low, bestBid), high) }, ...history].slice(0, 60);
          }
          const resting: WallEvent[] = [...active.values()].map(({ low, high, ...r }) => r);
          setState((st) => ({ ...st, status: 'live', bids, asks, walls: [...resting, ...history], lastUpdate: now }));
        }
      };
      ws.onclose = () => { if (closed) return; setState((st) => ({ ...st, status: 'disconnected' })); retry = setTimeout(connect, 3000); };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { closed = true; clearTimeout(retry); ws?.close(); };
  }, [symbol, wallMultiple]);
  return state;
}
