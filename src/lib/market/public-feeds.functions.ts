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
