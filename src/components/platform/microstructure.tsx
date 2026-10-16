import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiquidityHeatmap, type Timeframe } from '@/components/market/liquidity-heatmap';
import { PageHeader, Metric, SectionHeading, DataBadge, MethodNote, EmptyState } from './research-ui';
import { useBinanceLive } from '@/lib/market/use-binance-live';

export function Comparison() {
  const [window, setWindow] = useState<Timeframe>('4h');
  const spot = useBinanceLive('Spot');
  const perp = useBinanceLive('Perpetual');
  const cvd = (trades: { qty: number; side: string }[]) => trades.reduce((a, t) => a + (t.side === 'buy' ? t.qty : -t.qty), 0);
  const spotCvd = cvd(spot.trades), perpCvd = cvd(perp.trades);
  const basis = spot.price != null && perp.price != null ? perp.price - spot.price : null;
  return (
    <main className="research-content">
      <PageHeader eyebrow="Microstructure / Cross-market analysis" title="Spot vs perpetual intelligence" description="Live Binance spot and USDⓈ-M perpetual streams, aligned in real time." />
      <div className="research-filterbar"><div className="flex gap-1">{(['1h', '4h', '1D', '1W'] as Timeframe[]).map((t) => <Button key={t} variant="terminal" size="sm" data-active={window === t} onClick={() => setWindow(t)}>{t}</Button>)}</div><DataBadge status="LIVE" /></div>
      <div className="research-metrics">
        <Metric label="Spot session delta" value={`${spotCvd >= 0 ? '+' : ''}${spotCvd.toFixed(2)}`} unit="BTC" foot="Live trades this session" tone={spotCvd >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Perpetual session delta" value={`${perpCvd >= 0 ? '+' : ''}${perpCvd.toFixed(2)}`} unit="BTC" foot="Live trades this session" tone={perpCvd >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Perp − spot basis" value={basis == null ? '—' : `${basis >= 0 ? '+' : ''}${basis.toFixed(2)}`} unit="USDT" foot="Live mid-price difference" tone="text-analysis" />
        <Metric label="Funding / open interest" value="—" foot="Unavailable · no derivatives source" />
      </div>
      <div className="comparison-grid">{['Spot', 'Perpetual'].map((m) => <section key={m}><SectionHeading title={`${m} · BTCUSDT`} aside={<DataBadge status="LIVE" />} /><div className="chart-panel compact-heatmap"><LiquidityHeatmap timeframe={window} intensity={65} bubbles vwap market={m} zoom={1} playing /></div></section>)}</div>
      <section className="research-section mt-6"><SectionHeading title="Cross-market evidence" /><div className="research-table-wrap"><table className="research-table"><thead><tr><th>Signal</th><th>Observed live</th><th>Rule / confidence</th><th>Alternative explanations</th></tr></thead><tbody><tr><td>Trade-flow direction</td><td className="numeric">{`${spotCvd >= 0 ? '+' : ''}${spotCvd.toFixed(2)} / ${perpCvd >= 0 ? '+' : ''}${perpCvd.toFixed(2)} BTC`}</td><td>Session delta comparison · uncalibrated</td><td>Hedging, venue coverage, timing differences</td></tr><tr><td>Market leadership</td><td>Unclassified</td><td>Insufficient lag evidence</td><td>Session delta alone cannot establish market leadership</td></tr><tr><td>Funding / open interest</td><td>Unavailable</td><td>No source</td><td>Derivatives context not observed</td></tr></tbody></table></div></section>
      <MethodNote>Both panels stream live from Binance. Session deltas cover only the time this page has been open and are not stored. A verified comparison requires aligned exchange timestamps and independently validated feeds.</MethodNote>
      <Button className="mt-5" size="sm" asChild><Link to="/cases"><FilePlus2 />Create evidence case</Link></Button>
    </main>
  );
}

export function CandidateAnalytics({ hidden = false }: { hidden?: boolean }) {
  return (
    <main className="research-content">
      <PageHeader eyebrow="Microstructure / Observable replenishment" title={hidden ? 'Hidden liquidity analytics' : 'Iceberg candidate detection'} description="Explainable candidate rules over recorded execution and replenishment events." />
      <EmptyState title="Recorded depth not available" description="Iceberg and hidden-liquidity detection require recorded order-book depth and trade history, which are not stored. The live stream is not recorded, so no candidates can be computed and no simulated candidates are shown." />
      <MethodNote>Iceberg candidates are not confirmed iceberg orders. When recording is available, replenishment counts and execution ratios will be computed only from stored observations.</MethodNote>
    </main>
  );
}

export function Replay() {
  return (
    <main className="research-content">
      <PageHeader eyebrow="Microstructure / Historical coverage" title="Historical liquidity replay" description="Replay recorded order-book observations." />
      <EmptyState title="No historical depth coverage" description="Earliest recorded observation: unavailable. Replay requires stored exchange depth, not candlestick reconstruction. The live Binance stream is not recorded, so recording cannot begin until a storage pipeline is connected." />
      <MethodNote>Continuous persistence requires gap-free observations; disconnected and reappearing levels cannot be treated as continuously present.</MethodNote>
    </main>
  );
}
