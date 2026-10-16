import { useEffect, useState } from 'react';

export type Kline = { time: number; open: number; high: number; low: number; close: number; volume: number };

const intervalMap: Record<string, { interval: string; limit: number }> = {
  '1m': { interval: '1m', limit: 120 },
  '5m': { interval: '5m', limit: 120 },
  '15m': { interval: '15m', limit: 120 },
  '30m': { interval: '30m', limit: 120 },
  '1h': { interval: '1h', limit: 120 },
  '4h': { interval: '4h', limit: 120 },
  '1D': { interval: '1d', limit: 120 },
  '1W': { interval: '1w', limit: 104 },
  '1M': { interval: '1M', limit: 60 },
  '6M': { interval: '1w', limit: 26 },
  '1Y': { interval: '1M', limit: 12 },
};

/** Real historical candles from the public Binance REST API (no key). Polls for fresh candles. */
export function useKlines(market: string, timeframe: string) {
  const [klines, setKlines] = useState<Kline[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const cfg = intervalMap[timeframe] ?? intervalMap['4h']!;
    const base = market === 'Perpetual' ? 'https://fapi.binance.com/fapi/v1/klines' : 'https://api.binance.com/api/v3/klines';
    let cancelled = false;
    const load = () => {
      fetch(`${base}?symbol=BTCUSDT&interval=${cfg.interval}&limit=${cfg.limit}`)
        .then((r) => r.json())
        .then((rows: unknown[][]) => {
          if (cancelled || !Array.isArray(rows)) return;
          setKlines(rows.map((k) => ({ time: Number(k[0]), open: +k[1]!, high: +k[2]!, low: +k[3]!, close: +k[4]!, volume: +k[5]! })));
          setError(false);
        })
        .catch(() => !cancelled && setError(true));
    };
    setKlines([]);
    load();
    const timer = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [market, timeframe]);
  return { klines, error };
}

/** Session VWAP across the loaded candles (typical price weighted by volume). */
export function klinesVwap(klines: Kline[]): number | null {
  let pv = 0, v = 0;
  for (const k of klines) { const tp = (k.high + k.low + k.close) / 3; pv += tp * k.volume; v += k.volume; }
  return v > 0 ? pv / v : null;
}
