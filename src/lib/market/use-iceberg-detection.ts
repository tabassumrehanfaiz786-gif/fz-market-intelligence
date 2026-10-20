import { useEffect, useState } from 'react';

export type IcebergClass = 'native-reload' | 'algorithmic-slicing' | 'passive-absorption';
export type IcebergCandidate = {
  id: string; side: 'bid' | 'ask'; price: number;
  peakDisplayed: number; executed: number; reloads: number;
  reloadRatio: number; firstSeen: number; lastSeen: number;
  priceMoveBps: number; classification: IcebergClass; active: boolean;
};
export type IcebergState = {
  status: 'connecting' | 'live' | 'disconnected';
  price: number | null; candidates: IcebergCandidate[];
  lastUpdate: number | null; tradesSeen: number; depthUpdates: number;
};

/** Executed volume ÷ largest displayed size at that level. ≥ threshold suggests hidden replenishment. */
export function reloadRatio(executed: number, peakDisplayed: number) {
  return peakDisplayed > 0 ? executed / peakDisplayed : 0;
}

/** Heuristic labelling only — never proof of order type, owner or intent. */
export function classifyIceberg(reloads: number, durationMs: number, priceMoveBps: number): IcebergClass {
  if (reloads >= 3 && durationMs < 60_000) return 'native-reload';
  if (reloads >= 2 && durationMs >= 60_000) return 'algorithmic-slicing';
  return priceMoveBps < 2 ? 'passive-absorption' : 'algorithmic-slicing';
}

type Track = { side: 'bid' | 'ask'; price: number; lastQty: number; peak: number; executed: number; reloads: number; firstSeen: number; lastSeen: number; startMid: number; tradedSinceDrop: boolean };

export function useIcebergDetection(symbol = 'BTCUSDT', threshold = 1.5): IcebergState {
  const [state, setState] = useState<IcebergState>({ status: 'connecting', price: null, candidates: [], lastUpdate: null, tradesSeen: 0, depthUpdates: 0 });
  useEffect(() => {
    const s = symbol.toLowerCase();
    let closed = false; let ws: WebSocket | undefined; let retry: ReturnType<typeof setTimeout> | undefined;
    const tracks = new Map<string, Track>();
    let history: IcebergCandidate[] = [];
    let price: number | null = null; let mid = 0; let tradesSeen = 0; let depthUpdates = 0;
    setState({ status: 'connecting', price: null, candidates: [], lastUpdate: null, tradesSeen: 0, depthUpdates: 0 });

    const toCandidate = (t: Track, active: boolean): IcebergCandidate => {
      const move = t.startMid ? Math.abs(mid - t.startMid) / t.startMid * 10000 : 0;
      return { id: `${t.side}-${t.price}`, side: t.side, price: t.price, peakDisplayed: t.peak, executed: t.executed, reloads: t.reloads,
        reloadRatio: reloadRatio(t.executed, t.peak), firstSeen: t.firstSeen, lastSeen: t.lastSeen, priceMoveBps: move,
        classification: classifyIceberg(t.reloads, t.lastSeen - t.firstSeen, move), active };
    };
    const qualifies = (t: Track) => t.reloads >= 1 && reloadRatio(t.executed, t.peak) >= threshold;
    const publish = (now: number) => {
      const live = [...tracks.values()].filter(qualifies).map((t) => toCandidate(t, true));
      setState({ status: 'live', price, candidates: [...live, ...history].slice(0, 80), lastUpdate: now, tradesSeen, depthUpdates });
    };

    const connect = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${s}@aggTrade/${s}@depth20@100ms`);
      ws.onmessage = (ev) => {
        let msg: { stream: string; data: any };
        try { msg = JSON.parse(ev.data); } catch { return; }
        const { stream, data } = msg; const now = Date.now();
        if (stream.endsWith('@aggTrade')) {
          const p = +data.p, q = +data.q; if (!(p > 0 && q > 0)) return;
          price = p; tradesSeen++;
          // Buyer is maker → seller aggressed into a resting bid.
          const t = tracks.get(`${data.m ? 'bid' : 'ask'}-${p}`);
          if (t) { t.executed += q; t.tradedSinceDrop = true; t.lastSeen = now; }
          return;
        }
        depthUpdates++;
        const parse = (l: string[][]) => l.map((x) => [+x[0]!, +x[1]!] as [number, number]);
        const bids = parse(data.bids ?? []), asks = parse(data.asks ?? []);
        if (bids[0] && asks[0]) mid = (bids[0][0] + asks[0][0]) / 2;
        const seen = new Set<string>();
        const scan = (levels: [number, number][], side: 'bid' | 'ask') => levels.slice(0, 10).forEach(([lp, lq]) => {
          const id = `${side}-${lp}`; seen.add(id);
          const t = tracks.get(id);
          if (!t) { tracks.set(id, { side, price: lp, lastQty: lq, peak: lq, executed: 0, reloads: 0, firstSeen: now, lastSeen: now, startMid: mid, tradedSinceDrop: false }); return; }
          // Size grew back after being hit by trades = observed replenishment.
          if (lq > t.lastQty && t.tradedSinceDrop) { t.reloads++; t.tradedSinceDrop = false; }
          t.peak = Math.max(t.peak, lq); t.lastQty = lq; t.lastSeen = now;
        });
        scan(bids, 'bid'); scan(asks, 'ask');
        for (const [id, t] of tracks) {
          if (seen.has(id)) continue;
          tracks.delete(id);
          if (qualifies(t)) history = [toCandidate(t, false), ...history].slice(0, 60);
        }
        publish(now);
      };
      ws.onclose = () => { if (closed) return; setState((st) => ({ ...st, status: 'disconnected' })); retry = setTimeout(connect, 3000); };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { closed = true; clearTimeout(retry); ws?.close(); };
  }, [symbol, threshold]);
  return state;
}
