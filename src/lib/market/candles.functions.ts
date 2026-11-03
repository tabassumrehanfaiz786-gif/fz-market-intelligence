import { createServerFn } from '@tanstack/react-start';
import { candleRequestSchema, fetchCandleSources, type CandleResult } from './candle-data';

const cache = new Map<string, { result: CandleResult; expires: number }>();
const pending = new Map<string, Promise<CandleResult>>();

/** Public exchange observations only; no account data or credentials. */
export const getMarketCandles = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => candleRequestSchema.parse(input))
  .handler(async ({ data }): Promise<CandleResult> => {
    const key = `${data.market}:${data.timeframe}:${data.source ?? 'auto'}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.result;
    const existing = pending.get(key);
    if (existing) return existing;
    const request = (async (): Promise<CandleResult> => {
      try {
        const result = await fetchCandleSources(data);
        if (!result.error) cache.set(key, { result, expires: Date.now() + 10000 });
        return result;
      } catch {
        return { klines: [], updatedAt: null, error: true, source: null, pair: null };
      } finally { pending.delete(key); }
    })();
    pending.set(key, request);
    return request;
  });