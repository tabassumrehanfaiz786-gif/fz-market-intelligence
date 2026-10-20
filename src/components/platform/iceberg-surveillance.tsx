import { useState } from 'react';
import { useIcebergDetection, type IcebergCandidate } from '@/lib/market/use-iceberg-detection';
import { PageHeader, SectionHeading, MethodNote } from './research-ui';
import { ForensicCapture } from './forensic-capture';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/research/report';

const assets = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const label = { 'native-reload': 'Native reload pattern', 'algorithmic-slicing': 'Algorithmic slicing pattern', 'passive-absorption': 'Passive absorption pattern' } as const;
const iso = (t: number) => new Date(t).toISOString();

function exportStor(symbol: string, list: IcebergCandidate[]) {
  const now = new Date().toISOString();
  downloadCsv(`fz-stor-draft-${symbol}.csv`, [
    ['section', 'field', 'value'],
    ['1. Reporting entity', 'Prepared by', 'Fz Market Intelligence (research draft — not a filed STOR)'],
    ['1. Reporting entity', 'Prepared at (UTC)', now],
    ['2. Instrument', 'Symbol / venue', `${symbol} / Binance spot (public feed)`],
    ['3. Description', 'Observed behaviour', 'Price levels absorbing executed volume beyond their displayed size with observed replenishment'],
    ['4. Legal basis considered', 'Reference', 'UK MAR Art. 12 / Art. 16; MiCA Art. 91–92 — candidate only'],
    ['5. Reasons for suspicion', 'Assessment', 'None established: heuristic pattern; legitimate iceberg orders are lawful'],
    ...list.flatMap((c, i) => [
      [`6. Order ${i + 1}`, 'Side / price', `${c.side} @ ${c.price}`],
      [`6. Order ${i + 1}`, 'Peak displayed / executed', `${c.peakDisplayed} / ${c.executed.toFixed(6)}`],
      [`6. Order ${i + 1}`, 'Reload ratio / reloads', `${c.reloadRatio.toFixed(2)}x / ${c.reloads}`],
      [`6. Order ${i + 1}`, 'First / last seen (UTC)', `${iso(c.firstSeen)} / ${iso(c.lastSeen)}`],
      [`6. Order ${i + 1}`, 'Pattern label', label[c.classification]],
    ]),
    ['7. Limitations', 'Data', 'Top-10 browser depth snapshots at 100ms; no participant IDs; clock is local browser'],
  ]);
}

export function IcebergSurveillance() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const s = useIcebergDetection(symbol);
  const active = s.candidates.filter((c) => c.active);
  const totalAbsorbed = s.candidates.reduce((a, c) => a + c.executed * c.price, 0);
  return (
    <main className="research-content">
      <PageHeader eyebrow="Surveillance · live Binance" title="Iceberg & absorption surveillance"
        description="Finds price levels that keep absorbing more traded volume than they ever showed, and refill after being hit."
        actions={<div className="flex gap-1">{assets.map((a) => <Button key={a} size="sm" variant={a === symbol ? 'default' : 'outline'} onClick={() => setSymbol(a)}>{a.replace('USDT', '')}</Button>)}</div>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[['Feed', s.status.toUpperCase()], ['Last price', s.price?.toLocaleString() ?? '—'], ['Active candidates', String(active.length)], ['Absorbed notional', `$${Math.round(totalAbsorbed).toLocaleString()}`]].map(([k, v]) => (
          <div key={k} className="research-metric"><div className="stat-label">{k}<span className={`data-badge ${s.status === 'live' ? 'live' : 'unavailable'}`}>{s.status === 'live' ? 'LIVE' : s.status.toUpperCase()}</span></div><div className="stat-value">{v}</div><p className="stat-foot">{s.tradesSeen} trades · {s.depthUpdates} depth snapshots this session</p></div>
        ))}
      </div>

      <section className="research-section">
        <SectionHeading title="Candidate radar" aside={<Button size="sm" variant="outline" disabled={!s.candidates.length} onClick={() => exportStor(symbol, s.candidates)}>STOR-style draft (CSV)</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground"><tr className="text-left">{['State', 'Side', 'Price', 'Peak shown', 'Executed', 'Reload ×', 'Refills', 'Move bps', 'Duration', 'Pattern'].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {s.candidates.length === 0 && <tr><td colSpan={10} className="py-6 text-muted-foreground">Watching live order book… candidates appear when a level absorbs ≥1.5× its displayed size and refills.</td></tr>}
              {s.candidates.map((c) => (
                <tr key={`${c.id}-${c.firstSeen}`} className="border-t border-border">
                  <td className="py-2 pr-3">{c.active ? 'ACTIVE' : 'ENDED'}</td>
                  <td className={`pr-3 ${c.side === 'bid' ? 'text-primary' : 'text-destructive'}`}>{c.side}</td>
                  <td className="pr-3">{c.price}</td><td className="pr-3">{c.peakDisplayed.toFixed(4)}</td><td className="pr-3">{c.executed.toFixed(4)}</td>
                  <td className="pr-3">{c.reloadRatio.toFixed(2)}</td><td className="pr-3">{c.reloads}</td><td className="pr-3">{c.priceMoveBps.toFixed(1)}</td>
                  <td className="pr-3">{((c.lastSeen - c.firstSeen) / 1000).toFixed(1)}s</td><td>{label[c.classification]}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </section>

      <MethodNote>Candidates are heuristic patterns from public data. Iceberg orders are lawful; a flag is not evidence of manipulation, of who placed an order, or of intent. Alternative explanations: market makers refreshing quotes, multiple independent traders at one price, or feed latency.</MethodNote>

      <ForensicCapture title={`Iceberg surveillance dossier — ${symbol}`} collect={() => ({
        evidence: s.candidates.map((c) => ({ metric: `${c.side} ${c.price} (${label[c.classification]})`, value: `executed ${c.executed.toFixed(6)} vs peak ${c.peakDisplayed} · ${c.reloadRatio.toFixed(2)}x · ${c.reloads} refills`, source: `Binance spot ${symbol} aggTrade + depth20@100ms`, timestamp: iso(c.lastSeen) })),
        raw: { symbol, candidates: s.candidates, price: s.price },
      })} />
    </main>
  );
}
