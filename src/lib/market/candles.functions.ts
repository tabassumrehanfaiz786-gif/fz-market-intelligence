import { createServerFn } from '@tanstack/react-start';
import { candleRequestSchema, candleUrl, parseCandles, type Kline } from './candle-data';

type CandleResult = { klines: Kline[]; updatedAt: number | null; error: boolean };
const cache = new Map<string, { result: CandleResult; expires: number }>();
const pending = new Map<string, Promise<CandleResult>>();

/** Public exchange observations only; no account data or credentials. */
export const getMarketCandles = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => candleRequestSchema.parse(input))
  .handler(async ({ data }): Promise<CandleResult> => {
    const key = `${data.market}:${data.timeframe}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.result;
    const existing = pending.get(key);
    if (existing) return existing;
    const request = (async (): Promise<CandleResult> => {
      try {
        const response = await fetch(candleUrl(data), { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error('Exchange unavailable');
        const result = { klines: parseCandles(await response.json()), updatedAt: Date.now(), error: false };
        cache.set(key, { result, expires: Date.now() + 10000 });
        return result;
      } catch {
        return { klines: [], updatedAt: null, error: true };
      } finally { pending.delete(key); }
    })();
    pending.set(key, request);
    return request;
  });