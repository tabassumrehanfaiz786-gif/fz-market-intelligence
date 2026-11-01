/** Browser-only public trade + depth streams. Binance first; Coinbase fallback when Binance is blocked. */
export type StreamTrade = { id: number; price: number; qty: number; time: number; sellAggressor: boolean };
export type StreamDepth = { bids: [number, number][]; asks: [number, number][] };
export type StreamTicker = { price: number; change24h: number | null; high24h: number | null; low24h: number | null; volume24h: number | null };
export type StreamSource = 'Binance' | 'Coinbase';
export type StreamHandlers = {
  onTrade?: (t: StreamTrade) => void;
  onDepth?: (d: StreamDepth) => void;
  onTicker?: (t: StreamTicker) => void;
  onSource?: (s: StreamSource) => void;
  onDown?: () => void;
};

const n = (v: unknown) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

/** Coinbase Exchange public feed (matches, level2_batch, ticker) for e.g. BTC-USD. */
export function openCoinbase(product: string, h: StreamHandlers): () => void {
  let closed = false; let ws: WebSocket | undefined; let retry: ReturnType<typeof setTimeout> | undefined; let flush: ReturnType<typeof setTimeout> | undefined;
  const b = new Map<number, number>(), a = new Map<number, number>();
  const emitDepth = () => {
    if (flush) return;
    flush = setTimeout(() => {
      flush = undefined;
      h.onDepth?.({ bids: [...b].sort((x, y) => y[0] - x[0]).slice(0, 20), asks: [...a].sort((x, y) => x[0] - y[0]).slice(0, 20) });
    }, 100);
  };
  const connect = () => {
    ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    ws.onopen = () => { ws?.send(JSON.stringify({ type: 'subscribe', product_ids: [product], channels: ['matches', 'level2_batch', 'ticker'] })); h.onSource?.('Coinbase'); };
    ws.onmessage = (e) => {
      let m: any; try { m = JSON.parse(e.data); } catch { return; }
      if (m.type === 'match' || m.type === 'last_match') {
        const price = n(m.price), qty = n(m.size); if (!price || !qty) return;
        // Coinbase `side` is the maker side: maker sell → buyer aggressed.
        h.onTrade?.({ id: Number(m.trade_id), price, qty, time: Date.parse(m.time) || Date.now(), sellAggressor: m.side === 'buy' });
      } else if (m.type === 'snapshot') {
        b.clear(); a.clear();
        (m.bids ?? []).forEach((r: string[]) => b.set(+r[0]!, +r[1]!));
        (m.asks ?? []).forEach((r: string[]) => a.set(+r[0]!, +r[1]!));
        emitDepth();
      } else if (m.type === 'l2update') {
        (m.changes ?? []).forEach((c: string[]) => { const side = c[0] === 'buy' ? b : a; const p = +c[1]!, q = +c[2]!; if (q > 0) side.set(p, q); else side.delete(p); });
        emitDepth();
      } else if (m.type === 'ticker') {
        const price = n(m.price), open = n(m.open_24h); if (!price) return;
        h.onTicker?.({ price, change24h: open ? (price - open) / open * 100 : null, high24h: n(m.high_24h), low24h: n(m.low_24h), volume24h: n(m.volume_24h) });
      }
    };
    ws.onclose = () => { if (closed) return; h.onDown?.(); retry = setTimeout(connect, 3000); };
    ws.onerror = () => ws?.close();
  };
  connect();
  return () => { closed = true; clearTimeout(retry); clearTimeout(flush); ws?.close(); };
}

/** Binance spot aggTrade + depth20; switches to Coinbase <BASE>-USD if Binance sends nothing within 4s. */
export function openTradeDepth(symbol: string, h: StreamHandlers): () => void {
  const s = symbol.toLowerCase();
  let closed = false; let ws: WebSocket | undefined; let got = false; let stopFallback: (() => void) | undefined;
  const fallback = () => {
    if (closed || got || stopFallback) return;
    ws?.close(); ws = undefined;
    stopFallback = openCoinbase(`${symbol.toUpperCase().replace(/USDT$/, '')}-USD`, h);
  };
  const timer = setTimeout(fallback, 4000);
  const connect = () => {
    if (closed || stopFallback) return;
    ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${s}@aggTrade/${s}@depth20@100ms`);
    ws.onmessage = (ev) => {
      let msg: any; try { msg = JSON.parse(ev.data); } catch { return; }
      const { stream, data } = msg ?? {}; if (typeof stream !== 'string' || !data) return;
      if (!got) { got = true; h.onSource?.('Binance'); }
      if (stream.endsWith('@aggTrade')) {
        const price = +data.p, qty = +data.q; if (!(price > 0 && qty > 0)) return;
        h.onTrade?.({ id: Number(data.a), price, qty, time: Number(data.T) || Date.now(), sellAggressor: !!data.m });
      } else {
        const parse = (l: string[][] = []) => l.map((x) => [+x[0]!, +x[1]!] as [number, number]);
        h.onDepth?.({ bids: parse(data.bids), asks: parse(data.asks) });
      }
    };
    ws.onclose = () => { if (closed || stopFallback) return; h.onDown?.(); if (got) setTimeout(connect, 3000); else fallback(); };
    ws.onerror = () => ws?.close();
  };
  connect();
  return () => { closed = true; clearTimeout(timer); ws?.close(); stopFallback?.(); };
}
