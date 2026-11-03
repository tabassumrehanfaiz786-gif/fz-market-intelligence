import { useEffect, useState } from 'react';
import { getMarketCandles } from './candles.functions';
import { candleRequestSchema, fetchCandleSources, type Kline, type CandleSource, type CandleResult } from './candle-data';
export type { Kline } from './candle-data';
type CandleState = CandleResult & { status: 'loading' | 'fresh' | 'cached' | 'unavailable' };
const initial: CandleState = { klines: [], error: false, status: 'loading', updatedAt: null, source: null, pair: null };
const stores = new Map<string, { state: CandleState; listeners: Set<(state: CandleState) => void>; pending?: Promise<void> | undefined; timer?: ReturnType<typeof setInterval> | undefined }>();

/** Real historical candles from the public Binance REST API (no key). Polls for fresh candles. */
export function useKlines(market: string, timeframe: string, source?: CandleSource) {
  const key = `${market}:${timeframe}:${source ?? 'auto'}`;
  const [snapshot, setSnapshot] = useState({ key, state: initial });
  useEffect(() => {
    const input = candleRequestSchema.safeParse({ market, timeframe, source });
    if (!input.success) { setSnapshot({ key, state: { ...initial, error: true, status: 'unavailable' } }); return; }
    let found = stores.get(key);
    if (!found) { found = { state: initial, listeners: new Set() }; stores.set(key, found); }
    const store = found;
    const listener = (state: CandleState) => setSnapshot({ key, state });
    store.listeners.add(listener);
    if (!store.timer && store.state.klines.length) store.state = { ...store.state, status: 'cached' };
    listener(store.state);
    const load = async () => {
      if (store.pending) return store.pending;
      store.pending = (async () => {
        try {
          let result;
          try { result = await getMarketCandles({ data: input.data }); } catch { result = null; }
          // If the cloud host cannot reach Binance, try the user's public connection.
          if (!result || result.error) {
            result = await fetchCandleSources(input.data);
          }
          if (result.error) throw new Error('Candles unavailable');
          store.state = { ...result, status: 'fresh' };
        } catch { store.state = { ...store.state, error: true, status: store.state.klines.length ? 'cached' : 'unavailable' }; }
        finally { store.pending = undefined; store.listeners.forEach((notify) => notify(store.state)); }
      })();
      return store.pending;
    };
    if (!store.timer) { void load(); store.timer = setInterval(load, 15000); }
    return () => { store.listeners.delete(listener); if (!store.listeners.size) { clearInterval(store.timer); store.timer = undefined; } };
  }, [market, timeframe, source, key]);
  return snapshot.key === key ? snapshot.state : initial;
}

/** Session VWAP across the loaded candles (typical price weighted by volume). */
export function klinesVwap(klines: Kline[]): number | null {
  let pv = 0, v = 0;
  for (const k of klines) { const tp = (k.high + k.low + k.close) / 3; pv += tp * k.volume; v += k.volume; }
  return v > 0 ? pv / v : null;
}
