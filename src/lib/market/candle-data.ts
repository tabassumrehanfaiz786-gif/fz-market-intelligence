import { z } from 'zod';

export type Kline = { time: number; open: number; high: number; low: number; close: number; volume: number };
export const candleRequestSchema = z.object({ market: z.enum(['Spot', 'Perpetual']), timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M', '6M', '1Y']) });
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
    if (time === undefined || open === undefined || high === undefined || low === undefined || close === undefined || volume === undefined || ![time, open, high, low, close, volume].every(Number.isFinite) || open <= 0 || high < low || close <= 0 || volume < 0) throw new Error('Invalid candles');
    return { time, open, high, low, close, volume };
  });
}