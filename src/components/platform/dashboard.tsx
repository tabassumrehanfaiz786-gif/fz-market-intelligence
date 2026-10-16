import { Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiquidityHeatmap } from '@/components/market/liquidity-heatmap';
import { PageHeader, Metric, DataBadge, SectionHeading, MethodNote, EmptyState } from './research-ui';
import { useBinanceLive } from '@/lib/market/use-binance-live';
import { providers } from '@/lib/research/fixtures';

const fmt = (n: number | null, d = 2) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));

export function Dashboard() {
  const live = useBinanceLive('Spot');
  const cvd = live.trades.reduce((a, t) => a + (t.side === 'buy' ? t.qty : -t.qty), 0);
  return (
    <main className="research-content">
      <PageHeader eyebrow="Institutional intelligence / Overview" title="Executive dashboard" description="A consolidated view of live market data, liquidity and research signals." />
      <div className="flex items-center justify-between gap-3"><div className="flex gap-2 items-center text-xs"><span className="size-6 rounded-full border border-primary/30 text-primary grid place-items-center font-mono">₿</span><span>Bitcoin <span className="text-muted-foreground">/ BTCUSDT</span></span></div><span className="text-[10px] text-muted-foreground">Live · Binance spot</span></div>
      <div className="research-metrics">
        <Metric label="Bitcoin price" value={fmt(live.price)} unit="USDT" foot="Live Binance spot" />
        <Metric label="24h change" value={live.change24h == null ? '—' : `${live.change24h >= 0 ? '+' : ''}${live.change24h.toFixed(2)}%`} foot="Live ticker" tone={(live.change24h ?? 0) >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Session delta" value={`${cvd >= 0 ? '+' : ''}${cvd.toFixed(2)}`} unit="BTC" foot="Live trades this session" tone={cvd >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Daily ETF net flow" value="—" foot="Unavailable · no licensed source" />
      </div>
      <div className="research-grid">
        <section className="min-w-0"><SectionHeading title="BTCUSDT · liquidity landscape" aside={<Button variant="link" size="sm" asChild><Link to="/spot">Open heatmap<ArrowUpRight /></Link></Button>} /><div className="chart-panel dashboard-heatmap"><div className="chart-subbar"><span>Spot · 4-hour live window</span><DataBadge status="LIVE" /></div><LiquidityHeatmap timeframe="4h" intensity={70} bubbles vwap market="Spot" zoom={1} playing /></div></section>
        <section className="min-w-0"><SectionHeading title="Research workflow" />{[{ n: '01', title: 'Institutional ETF flows', text: 'Requires a licensed fund-reporting source.', to: '/etf-flows' }, { n: '02', title: 'Spot / perpetual alignment', text: 'Live comparison of Binance spot and perpetual streams.', to: '/comparison' }, { n: '03', title: 'Explainable divergence', text: 'Requires a connected news provider and recorded flows.', to: '/news-divergence' }, { n: '04', title: 'Evidence & research report', text: 'Save a private case with provenance. Export CSV or PDF.', to: '/cases' }].map((step) => <div className="workflow-step" key={step.n}><span className="workflow-number">{step.n}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><Button variant="ghost" size="icon" asChild><Link to={step.to} title={step.title}><ArrowUpRight /></Link></Button></div>)}<MethodNote>Market anomalies are research observations, not evidence of institutional identity, intention or wrongdoing.</MethodNote></section>
      </div>
      <div className="research-grid">
        <section className="research-section"><SectionHeading title="Aggregate ETF net flows" aside={<DataBadge status="UNAVAILABLE" />} /><EmptyState title="ETF reporting source not connected" description="No verified fund flows are available. A licensed, dated reporting source is required; no simulated figures are displayed." /></section>
        <section className="research-section"><SectionHeading title="Data source coverage" aside={<DataBadge status="UNAVAILABLE" />} />{providers.map((p) => <div className="provider-item" key={p.name}><div><h3>{p.name}</h3><p>{p.coverage}</p></div><DataBadge status="UNAVAILABLE" /></div>)}<Button variant="link" size="sm" asChild><Link to="/methodology">Sources & methodology<ArrowRight /></Link></Button></section>
      </div>
    </main>
  );
}
