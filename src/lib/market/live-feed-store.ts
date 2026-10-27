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
    if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = undefined; publish(); }, 100);
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
        const allFresh = urls.every((u) => now - (seen.get(u) ?? 0) <= 10000);
        update({ ...next, status: allFresh ? 'live' : 'connecting', lastUpdate: now });
      } catch { /* Ignore malformed exchange frames without breaking the feed. */ }
    };
    ws.onclose = () => {
      sockets.delete(ws);
      if (!active) return;
      seen.delete(url);
      update({ ...state, status: 'disconnected' });
      const retry = setTimeout(() => { retries.delete(retry); connect(url); }, 3000);
      retries.add(retry);
    };
    ws.onerror = () => ws.close();
  };
  const stop = () => {
    active = false;
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
        staleTimer = setInterval(() => {
          if (state.lastUpdate && urls.some((url) => Date.now() - (seen.get(url) ?? 0) > 10000)) update({ ...state, status: 'stale' });
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