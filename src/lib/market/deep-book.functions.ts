import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export type DeepBook = { bids: [number, number][]; asks: [number, number][]; source: string | null; time: number; error?: boolean };

const schema = z.object({ market: z.enum(['Spot', 'Perpetual']) });
const cache = new Map<string, { book: DeepBook; expires: number }>();

const rows = (value: unknown): [number, number][] => Array.isArray(value)
  ? value.flatMap((r) => { const p = Number((r as unknown[])[0]), q = Number((r as unknown[])[1]); return Number.isFinite(p) && Number.isFinite(q) && q > 0 ? [[p, q] as [number, number]] : []; })
  : [];

async function json(url: string) {
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<any>;
}

const sources: Record<'Spot' | 'Perpetual', { name: string; load: () => Promise<{ bids: [number, number][]; asks: [number, number][] }> }[]> = {
  Spot: [
    { name: 'Binance', load: async () => { const d = await json('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=1000'); return { bids: rows(d.bids), asks: rows(d.asks) }; } },
    { name: 'OKX', load: async () => { const d = (await json('https://www.okx.com/api/v5/market/books?instId=BTC-USDT&sz=400')).data?.[0]; return { bids: rows(d?.bids), asks: rows(d?.asks) }; } },
    { name: 'Kraken', load: async () => { const r = (await json('https://api.kraken.com/0/public/Depth?pair=XBTUSDT&count=500')).result; const d = r && Object.values(r)[0] as any; return { bids: rows(d?.bids), asks: rows(d?.asks) }; } },
  ],
  Perpetual: [
    { name: 'Binance', load: async () => { const d = await json('https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=1000'); return { bids: rows(d.bids), asks: rows(d.asks) }; } },
    { name: 'OKX', load: async () => { const d = (await json('https://www.okx.com/api/v5/market/books?instId=BTC-USDT-SWAP&sz=400')).data?.[0]; const ct = 0.01; return { bids: rows(d?.bids).map(([p, q]) => [p, q * ct]), asks: rows(d?.asks).map(([p, q]) => [p, q * ct]) }; } },
    { name: 'Bybit', load: async () => { const d = (await json('https://api.bybit.com/v5/market/orderbook?category=linear&symbol=BTCUSDT&limit=500')).result; return { bids: rows(d?.b), asks: rows(d?.a) }; } },
  ],
};

/** Public deep order-book snapshot (no credentials); short cache to protect exchanges. */
export const getDeepBook = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<DeepBook> => {
    const hit = cache.get(data.market);
    if (hit && hit.expires > Date.now()) return hit.book;
    for (const source of sources[data.market]) {
      try {
        const { bids, asks } = await source.load();
        if (bids.length && asks.length) {
          const book = { bids, asks, source: source.name, time: Date.now() };
          cache.set(data.market, { book, expires: Date.now() + 1500 });
          return book;
        }
      } catch { /* try next public source */ }
    }
    return { bids: [], asks: [], source: null, time: Date.now(), error: true };
  });
