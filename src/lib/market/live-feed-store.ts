import type { LiveLevel, LiveState, LiveTrade } from './use-binance-live';

export const emptyLiveState: LiveState = { status: 'connecting', price: null, change24h: null, high24h: null, low24h: null, volume24h: null, trades: [], bids: [], asks: [], lastUpdate: null };

/** Created only after hydration. One connection group per market, with bounded snapshots. */
export function createLiveFeedStore(market: string) {
  let state: LiveState = emptyLiveState;
  const listeners = new Set<(state: LiveState) => void>();
  const sockets = new Set<WebSocket>();
  const retries = new Set<ReturnType<typeof setTimeout>>();
  let active = false;
  let staleTimer: ReturnType<typeof setInterval> | undefined;
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  const seen = new Map<string, number>();
  const publish = () => { listeners.forEach((listener) => listener(state)); };
  const update = (next: LiveState) => {
    state = next;
    if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = undefined; publish(); }, 250);
  };
  const urls = market === 'Perpetual'
    ? ['wss://fstream.binance.com/market/stream?streams=btcusdt@ticker/btcusdt@aggTrade', 'wss://fstream.binance.com/public/stream?streams=btcusdt@depth20@500ms']
    : ['wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/btcusdt@aggTrade/btcusdt@depth20@1000ms'];
  const connect = (url: string) => {
    if (!active) return;
    const ws = new WebSocket(url);
    sockets.add(ws);
    ws.onmessage = (event) => {
      if (!active) return;
      try {
        const { stream, data } = JSON.parse(event.data);
        if (typeof stream !== 'string' || !data) return;
        const now = Date.now();
        const levels = (rows: unknown): LiveLevel[] => Array.isArray(rows) ? rows.flatMap((row) => {
          if (!Array.isArray(row)) return [];
          const p = Number(row[0]), q = Number(row[1]);
          return Number.isFinite(p) && p > 0 && Number.isFinite(q) && q >= 0 ? [[p, q] as LiveLevel] : [];
        }) : [];
        let next = state;
        if (stream.endsWith('@ticker') && Number.isFinite(Number(data.c))) {
          const num = (value: unknown) => value != null && Number.isFinite(Number(value)) ? Number(value) : null;
          next = { ...state, price: Number(data.c), change24h: num(data.P), high24h: num(data.h), low24h: num(data.l), volume24h: num(data.v) };
        } else if (stream.endsWith('@aggTrade')) {
          const trade: LiveTrade = { id: Number(data.a), price: Number(data.p), qty: Number(data.q), time: Number(data.T), side: data.m ? 'sell' : 'buy' };
          if (![trade.id, trade.price, trade.qty, trade.time].every(Number.isFinite) || trade.price <= 0 || trade.qty <= 0) return;
          next = { ...state, price: trade.price, trades: [trade, ...state.trades.filter((t) => t.id !== trade.id)].slice(0, 40) };
        } else if (stream.includes('@depth')) {
          next = { ...state, bids: levels(data.bids ?? data.b), asks: levels(data.asks ?? data.a) };
        } else return;
        seen.set(url, now);
        if (fallback) return;
        const allFresh = urls.every((u) => now - (seen.get(u) ?? 0) <= 10000);
        update({ ...next, status: allFresh ? 'live' : 'connecting', lastUpdate: now, source: 'Binance' });
      } catch { /* Ignore malformed exchange frames without breaking the feed. */ }
    };
    ws.onclose = () => {
      sockets.delete(ws);
      if (!active) return;
      seen.delete(url);
      if (!fallback) update({ ...state, status: 'disconnected' });
      const retry = setTimeout(() => { retries.delete(retry); connect(url); }, 3000);
      retries.add(retry);
    };
    ws.onerror = () => ws.close();
  };
  // Bybit public fallback for networks that block Binance; same BTC/USDT pair, labelled by source.
  let fallback: WebSocket | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  const book = { b: new Map<number, number>(), a: new Map<number, number>() };
  const startFallback = () => {
    if (!active || fallback || urls.some((u) => seen.has(u))) return;
    const ws = new WebSocket(market === 'Perpetual' ? 'wss://stream.bybit.com/v5/public/linear' : 'wss://stream.bybit.com/v5/public/spot');
    fallback = ws;
    ws.onopen = () => ws.send(JSON.stringify({ op: 'subscribe', args: ['tickers.BTCUSDT', 'publicTrade.BTCUSDT', 'orderbook.50.BTCUSDT'] }));
    ws.onmessage = (event) => {
      if (!active) return;
      try {
        const m = JSON.parse(event.data);
        const topic: string = m.topic ?? '';
        const d = m.data;
        if (!d) return;
        const num = (v: unknown) => v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
        let next = state;
        if (topic.startsWith('tickers')) {
          const pct = num(d.price24hPcnt);
          next = { ...state, price: num(d.lastPrice) ?? state.price, change24h: pct != null ? pct * 100 : state.change24h, high24h: num(d.highPrice24h) ?? state.high24h, low24h: num(d.lowPrice24h) ?? state.low24h, volume24h: num(d.volume24h) ?? state.volume24h };
        } else if (topic.startsWith('publicTrade') && Array.isArray(d)) {
          const fresh: LiveTrade[] = d.map((t: { i: string; p: string; v: string; T: number; S: string }, k: number) => ({ id: Number(t.T) * 100 + k, price: Number(t.p), qty: Number(t.v), time: Number(t.T), side: (t.S === 'Sell' ? 'sell' : 'buy') as LiveTrade['side'] })).filter((t) => t.price > 0 && t.qty > 0).reverse();
          if (!fresh.length) return;
          next = { ...state, price: fresh[0]!.price, trades: [...fresh, ...state.trades].slice(0, 40) };
        } else if (topic.startsWith('orderbook')) {
          if (m.type === 'snapshot') { book.b.clear(); book.a.clear(); }
          const apply = (side: Map<number, number>, rows: unknown) => Array.isArray(rows) && rows.forEach((r) => { const p = Number(r[0]), q = Number(r[1]); if (!Number.isFinite(p)) return; if (q > 0) side.set(p, q); else side.delete(p); });
          apply(book.b, d.b); apply(book.a, d.a);
          next = { ...state, bids: [...book.b].sort((x, y) => y[0] - x[0]).slice(0, 20) as LiveLevel[], asks: [...book.a].sort((x, y) => x[0] - y[0]).slice(0, 20) as LiveLevel[] };
        } else return;
        seen.set('bybit', Date.now());
        update({ ...next, status: 'live', lastUpdate: Date.now(), source: 'Bybit' });
      } catch { /* ignore malformed frames */ }
    };
    ws.onclose = () => {
      if (fallback === ws) fallback = null;
      seen.delete('bybit');
      if (!active) return;
      update({ ...state, status: 'disconnected' });
      fallbackTimer = setTimeout(startFallback, 3000);
    };
    ws.onerror = () => ws.close();
  };
  const stop = () => {
    active = false;
    clearTimeout(fallbackTimer); fallback?.close(); fallback = null; seen.delete('bybit');
    clearInterval(staleTimer); clearTimeout(flushTimer);
    flushTimer = undefined;
    retries.forEach(clearTimeout); retries.clear(); seen.clear();
    sockets.forEach((socket) => socket.close()); sockets.clear();
    state = { ...state, status: state.lastUpdate ? 'stale' : 'disconnected', trades: [] };
  };
  return {
    subscribe(listener: (state: LiveState) => void) {
      clearTimeout(stopTimer);
      listeners.add(listener);
      if (!active) {
        active = true;
        state = { ...state, status: state.lastUpdate ? 'stale' : 'connecting', trades: [] };
        urls.forEach(connect);
        fallbackTimer = setTimeout(startFallback, 4000);
        staleTimer = setInterval(() => {
          const keys = fallback ? ['bybit'] : urls;
          if (state.lastUpdate && keys.some((k) => Date.now() - (seen.get(k) ?? 0) > 10000)) update({ ...state, status: 'stale' });
        }, 2000);
      }
      listener(state);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) stopTimer = setTimeout(stop, 500);
      };
    },
  };
}