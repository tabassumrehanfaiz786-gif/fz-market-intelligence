import { createServerFn } from '@tanstack/react-start';
import { parseEtfTable, parseRss, type EtfResult, type NewsResult } from './public-feeds';

const UA = { 'User-Agent': 'Mozilla/5.0 (FzMarketIntelligence research terminal)' };
let newsCache: { at: number; value: NewsResult } | null = null;
let etfCache: { at: number; value: EtfResult } | null = null;

export const getLiveNews = createServerFn({ method: 'GET' }).handler(async (): Promise<NewsResult> => {
  if (newsCache && Date.now() - newsCache.at < 120_000) return newsCache.value;
  const feeds = [['Cointelegraph', 'https://cointelegraph.com/rss'], ['Decrypt', 'https://decrypt.co/feed']] as const;
  const results = await Promise.all(feeds.map(async ([name, url]) => {
    try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(5000) }); return r.ok ? parseRss(await r.text(), name) : []; }
    catch { return []; }
  }));
  const items = results.flat().sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 40);
  const value: NewsResult = { items, sources: feeds.filter((_, i) => results[i]!.length).map(([n]) => n), updatedAt: items.length ? Date.now() : null, error: !items.length };
  if (items.length) newsCache = { at: Date.now(), value };
  return items.length ? value : newsCache?.value ?? value;
});

export const getEtfFlows = createServerFn({ method: 'GET' }).handler(async (): Promise<EtfResult> => {
  if (etfCache && Date.now() - etfCache.at < 600_000) return etfCache.value;
  try {
    const r = await fetch('https://bitbo.io/treasuries/etf-flows/', { headers: UA, signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const value: EtfResult = { ...parseEtfTable(await r.text()), source: 'bitbo.io (public daily US spot ETF flows, US$ millions)', updatedAt: Date.now(), error: false };
    etfCache = { at: Date.now(), value };
    return value;
  } catch {
    return etfCache?.value ?? { days: [], tickers: [], source: 'bitbo.io', updatedAt: null, error: true };
  }
});

/** Server-side reachability of public exchanges, independent of the visitor's local network. */
export const checkExchangeProxy = createServerFn({ method: 'GET' }).handler(async () => {
  const r = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD', { signal: AbortSignal.timeout(5000) });
  const body = (await r.json()) as { result?: Record<string, { c?: string[] }> };
  const price = Number(Object.values(body.result ?? {})[0]?.c?.[0]);
  if (!Number.isFinite(price)) throw new Error('No price');
  return { price };
});

export type PerpSnapshot = { source: string; price: number; change24h: number | null; high24h: number | null; low24h: number | null; volume24h: number | null; bids: [number, number][]; asks: [number, number][]; trades: { id: number; price: number; qty: number; time: number; side: 'buy' | 'sell' }[] };
let perpCache: { at: number; value: PerpSnapshot } | null = null;

/** BTC-USDT perpetual snapshot fetched by the app server, for visitors whose network blocks exchange streams. */
export const getPerpSnapshot = createServerFn({ method: 'GET' }).handler(async (): Promise<PerpSnapshot | null> => {
  if (perpCache && Date.now() - perpCache.at < 1000) return perpCache.value;
  const j = async (u: string) => { const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(4000) }); if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<any>; };
  const lv = (rows: any[]) => rows.map((r) => [Number(r[0]), Number(r[1])] as [number, number]).filter(([p, q]) => p > 0 && q >= 0);
  try {
    const b = 'https://www.okx.com/api/v5/market';
    const [t, d, tr] = await Promise.all([j(`${b}/ticker?instId=BTC-USDT-SWAP`), j(`${b}/books?instId=BTC-USDT-SWAP&sz=20`), j(`${b}/trades?instId=BTC-USDT-SWAP&limit=40`)]);
    const tk = t.data[0], bk = d.data[0], last = Number(tk.last), open = Number(tk.open24h);
    // OKX swap sizes are contracts of 0.01 BTC.
    const value: PerpSnapshot = { source: 'OKX via server', price: last, change24h: open ? ((last - open) / open) * 100 : null, high24h: Number(tk.high24h), low24h: Number(tk.low24h), volume24h: Number(tk.volCcy24h),
      bids: lv(bk.bids).map(([p, q]) => [p, q * 0.01]), asks: lv(bk.asks).map(([p, q]) => [p, q * 0.01]),
      trades: tr.data.map((x: any) => ({ id: Number(x.tradeId), price: Number(x.px), qty: Number(x.sz) * 0.01, time: Number(x.ts), side: x.side === 'sell' ? 'sell' : 'buy' })) };
    perpCache = { at: Date.now(), value };
    return value;
  } catch {
    try {
      const b = 'https://api.bybit.com/v5/market';
      const [t, d, tr] = await Promise.all([j(`${b}/tickers?category=linear&symbol=BTCUSDT`), j(`${b}/orderbook?category=linear&symbol=BTCUSDT&limit=50`), j(`${b}/recent-trade?category=linear&symbol=BTCUSDT&limit=40`)]);
      const tk = t.result.list[0];
      const value: PerpSnapshot = { source: 'Bybit via server', price: Number(tk.lastPrice), change24h: Number(tk.price24hPcnt) * 100, high24h: Number(tk.highPrice24h), low24h: Number(tk.lowPrice24h), volume24h: Number(tk.volume24h),
        bids: lv(d.result.b).slice(0, 20), asks: lv(d.result.a).slice(0, 20),
        trades: tr.result.list.map((x: any) => ({ id: Number(x.time) * 100 + (Number(String(x.execId).replace(/\D/g, '').slice(-2)) || 0), price: Number(x.price), qty: Number(x.size), time: Number(x.time), side: x.side === 'Sell' ? 'sell' : 'buy' })) };
      perpCache = { at: Date.now(), value };
      return value;
    } catch { return perpCache?.value ?? null; }
  }
});
