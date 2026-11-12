import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { PageHeader, DataBadge, SectionHeading, MethodNote } from '@/components/platform/research-ui';
import { supabase } from '@/integrations/supabase/client';
import { getMarketCandles } from '@/lib/market/candles.functions';
import { checkExchangeProxy, getEtfFlows, getLiveNews, getPerpSnapshot } from '@/lib/market/public-feeds.functions';

export const Route = createFileRoute('/system-health')({
  head: () => ({ meta: [
    { title: 'System health — Fz Market Intelligence' },
    { name: 'description', content: 'Live connection checks for every market data feed and backend service.' },
    { property: 'og:title', content: 'System health — Fz Market Intelligence' },
    { property: 'og:description', content: 'Live connection checks for every market data feed and backend service.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Page,
});

type Result = { status: 'CHECKING' | 'LIVE' | 'DISCONNECTED' | 'NOT CONFIGURED'; ms?: number; note?: string | undefined };
type Check = { name: string; kind: string; run?: () => Promise<string | void>; note?: string };

const timeout = <T,>(p: Promise<T>, ms = 6000) => Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error('Timed out')), ms))]);
const http = (url: string) => async () => { const r = await fetch(url).catch(() => { throw new Error('Blocked by your local network — app uses fallback'); }); if (!r.ok) throw new Error(`HTTP ${r.status}`); };
const ws = (url: string, sub?: unknown) => () => new Promise<void>((res, rej) => {
  const s = new WebSocket(url);
  s.onopen = () => { if (sub) s.send(JSON.stringify(sub)); else { s.close(); res(); } };
  s.onmessage = () => { s.close(); res(); };
  s.onerror = () => rej(new Error('Blocked by your local network — app uses fallback'));
});

const checks: Check[] = [
  { name: 'Perpetual feed via app server', kind: 'Server proxy', run: async () => { const r = await getPerpSnapshot(); if (!r) throw new Error('Unreachable'); return `${r.source} · $${r.price.toLocaleString()}`; } },
  { name: 'Binance spot stream', kind: 'WebSocket', run: ws('wss://stream.binance.com:9443/ws/btcusdt@trade') },
  { name: 'Binance futures stream', kind: 'WebSocket', run: ws('wss://fstream.binance.com/ws/btcusdt@aggTrade') },
  { name: 'Coinbase stream (fallback)', kind: 'WebSocket', run: ws('wss://ws-feed.exchange.coinbase.com', { type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] }) },
  { name: 'Bybit stream (fallback)', kind: 'WebSocket', run: ws('wss://stream.bybit.com/v5/public/linear', { op: 'subscribe', args: ['tickers.BTCUSDT'] }) },
  { name: 'Binance REST', kind: 'HTTP', run: http('https://api.binance.com/api/v3/ping') },
  { name: 'Coinbase REST', kind: 'HTTP', run: http('https://api.exchange.coinbase.com/products/BTC-USD/ticker') },
  { name: 'Candle server', kind: 'App server', run: async () => { const r: any = await getMarketCandles({ data: { market: 'Spot', timeframe: '1h' } as any }); if (!r || (Array.isArray(r.klines) && !r.klines.length)) throw new Error('No candles'); } },
  { name: 'Database & sign-in', kind: 'Cloud', run: async () => { const { error } = await supabase.auth.getSession(); if (error) throw error; } },
  { name: 'Kraken stream (global)', kind: 'WebSocket', run: ws('wss://ws.kraken.com/v2', { method: 'subscribe', params: { channel: 'ticker', symbol: ['BTC/USD'] } }) },
  { name: 'Exchange via app server', kind: 'Server proxy', run: async () => { const r = await checkExchangeProxy(); return `BTC $${r.price.toLocaleString()}`; } },
  { name: 'Bitcoin ETF flows', kind: 'Public tracker', run: async () => { const r = await getEtfFlows(); if (r.error || !r.days.length) throw new Error('Source unreachable'); return `Latest ${r.days[0]!.date}`; } },
  { name: 'Institutional news', kind: 'Publisher feeds', run: async () => { const r = await getLiveNews(); if (r.error) throw new Error('Feeds unreachable'); return `${r.items.length} headlines · ${r.sources.join(', ')}`; } },
];

function Page() {
  const [res, setRes] = useState<Record<string, Result>>({});
  const runAll = useCallback(() => {
    checks.forEach((c) => {
      if (!c.run) { setRes((s) => ({ ...s, [c.name]: { status: 'NOT CONFIGURED', note: c.note ?? '' } })); return; }
      setRes((s) => ({ ...s, [c.name]: { status: 'CHECKING' } }));
      const t = performance.now();
      timeout(c.run()).then(
        (note) => setRes((s) => ({ ...s, [c.name]: { status: 'LIVE', ms: Math.round(performance.now() - t), note: note || undefined } })),
        (e) => setRes((s) => ({ ...s, [c.name]: { status: 'DISCONNECTED', note: e instanceof Error ? e.message : 'Failed' } })),
      );
    });
  }, []);
  useEffect(runAll, [runAll]);
  const testable = checks.filter((c) => c.run);
  const live = testable.filter((c) => res[c.name]?.status === 'LIVE').length;
  return (
    <TerminalShell>
      <main className="research-content">
        <PageHeader eyebrow="Fz Market Intelligence" title="System health" description="Real connection tests run from your browser right now."
          actions={<Button size="sm" variant="outline" onClick={runAll}><RefreshCw />Run check</Button>} />
        <SectionHeading title={`${live}/${testable.length} live connections`} />
        <section className="research-section">
          {checks.map((c) => { const r = res[c.name]; return (
            <div className="provider-item" key={c.name}>
              <div><h3>{c.name}</h3><p>{c.kind}{r?.ms != null ? ` · ${r.ms} ms` : ''}{r?.note ? ` · ${r.note}` : ''}</p></div>
              <DataBadge status={r?.status === 'NOT CONFIGURED' ? 'UNAVAILABLE' : r?.status ?? 'CHECKING'} />
            </div>); })}
        </section>
        <MethodNote>If a Binance or Bybit line shows disconnected, your local network is likely blocking that exchange. The app switches to Coinbase automatically, and the app-server line shows market data still reaches you through our server.</MethodNote>
      </main>
    </TerminalShell>
  );
}
