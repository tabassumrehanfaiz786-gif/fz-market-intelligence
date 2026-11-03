import { z } from 'zod';

export type Kline = { time: number; open: number; high: number; low: number; close: number; volume: number };
export const candleRequestSchema = z.object({ market: z.enum(['Spot', 'Perpetual']), timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M', '6M', '1Y']), source: z.enum(['Binance', 'Bybit', 'Coinbase']).optional() });
export const intervalMap = {
  '1m': { interval: '1m', limit: 120 }, '5m': { interval: '5m', limit: 120 },
  '15m': { interval: '15m', limit: 120 }, '30m': { interval: '30m', limit: 120 },
  '1h': { interval: '1h', limit: 120 }, '4h': { interval: '4h', limit: 120 },
  '1D': { interval: '1d', limit: 120 }, '1W': { interval: '1w', limit: 104 },
  '1M': { interval: '1M', limit: 60 }, '6M': { interval: '1w', limit: 26 }, '1Y': { interval: '1M', limit: 12 },
} as const;
export function candleUrl(input: z.infer<typeof candleRequestSchema>) {
  const config = intervalMap[input.timeframe];
  const base = input.market === 'Perpetual' ? 'https://fapi.binance.com/fapi/v1/klines' : 'https://api.binance.com/api/v3/klines';
  return `${base}?symbol=BTCUSDT&interval=${config.interval}&limit=${config.limit}`;
}
export function parseCandles(rows: unknown): Kline[] {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Candles unavailable');
  return rows.map((row) => {
    if (!Array.isArray(row) || row.length < 6) throw new Error('Invalid candles');
    const [time, open, high, low, close, volume] = row.slice(0, 6).map(Number);
    if (time === undefined || open === undefined || high === undefined || low === undefined || close === undefined || volume === undefined || ![time, open, high, low, close, volume].every(Number.isFinite) || time <= 0 || open <= 0 || low <= 0 || high < Math.max(open, close) || low > Math.min(open, close) || close <= 0 || volume < 0) throw new Error('Invalid candles');
    return { time, open, high, low, close, volume };
  });
}

export type CandleSource = 'Binance' | 'Bybit' | 'Coinbase';
export type CandleResult = { klines: Kline[]; updatedAt: number | null; error: boolean; source: CandleSource | null; pair: 'BTCUSDT' | 'BTC-USD' | null };
export const emptyCandleResult: CandleResult = { klines: [], updatedAt: null, error: true, source: null, pair: null };
type CandleInput = z.infer<typeof candleRequestSchema>;
const bybitIntervals = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '4h': '240', '1D': 'D', '1W': 'W', '1M': 'M', '6M': 'W', '1Y': 'M' } as const;

export function fallbackCandleUrl(input: CandleInput, source: CandleSource) {
  if (source === 'Binance') return candleUrl(input);
  if (source === 'Bybit') return `https://api.bybit.com/v5/market/kline?category=${input.market === 'Perpetual' ? 'linear' : 'spot'}&symbol=BTCUSDT&interval=${bybitIntervals[input.timeframe]}&limit=${intervalMap[input.timeframe].limit}`;
  const granularity = { '1m': 60, '5m': 300, '15m': 900, '30m': 900, '1h': 3600, '4h': 3600, '1D': 86400, '1W': 86400, '1M': 86400, '6M': 86400, '1Y': 86400 }[input.timeframe];
  return `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=${granularity}`;
}

export function parseProviderCandles(rows: unknown, input: CandleInput, source: CandleSource): Kline[] {
  if (source === 'Binance') return parseCandles(rows);
  if (source === 'Bybit') {
    const body = rows as { retCode?: number; result?: { list?: unknown } } | null;
    if (body?.retCode !== 0) throw new Error('Candles unavailable');
    return parseCandles(body.result?.list).sort((a, b) => a.time - b.time);
  }
  if (input.market !== 'Spot' || !Array.isArray(rows)) throw new Error('Spot candles only');
  const candles = parseCandles(rows.map((r) => Array.isArray(r) ? [Number(r[0]) * 1000, r[3], r[2], r[1], r[4], r[5]] : r)).sort((a, b) => a.time - b.time);
  const buckets = new Map<number, Kline>();
  const duration = { '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000, '1h': 3600000, '4h': 14400000, '1D': 86400000, '1W': 604800000, '6M': 604800000 };
  for (const k of candles) {
    const d = new Date(k.time);
    const time = input.timeframe === '1M' || input.timeframe === '1Y'
      ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
      : ['1W', '6M'].includes(input.timeframe)
        ? Math.floor((k.time - 345600000) / 604800000) * 604800000 + 345600000
        : Math.floor(k.time / duration[input.timeframe as keyof typeof duration]) * duration[input.timeframe as keyof typeof duration];
    const previous = buckets.get(time);
    buckets.set(time, previous ? { ...previous, high: Math.max(previous.high, k.high), low: Math.min(previous.low, k.low), close: k.close, volume: previous.volume + k.volume } : { ...k, time });
  }
  return [...buckets.values()].slice(-intervalMap[input.timeframe].limit);
}

/** Never substitutes a spot product for a perpetual contract. */
export async function fetchCandleSources(input: CandleInput, request: typeof fetch = fetch): Promise<CandleResult> {
  const sources: CandleSource[] = input.market === 'Perpetual' ? ['Binance', 'Bybit'] : ['Binance', 'Bybit', 'Coinbase'];
  const ordered = input.source && sources.includes(input.source) ? [input.source, ...sources.filter((s) => s !== input.source)] : sources;
  for (const source of ordered) {
    try {
      const response = await request(fallbackCandleUrl(input, source), { signal: AbortSignal.timeout(2500) });
      if (!response.ok) continue;
      const klines = parseProviderCandles(await response.json(), input, source);
      return { klines, updatedAt: Date.now(), error: false, source, pair: source === 'Coinbase' ? 'BTC-USD' : 'BTCUSDT' };
    } catch { /* Try the next independent public exchange. */ }
  }
  return emptyCandleResult;
}