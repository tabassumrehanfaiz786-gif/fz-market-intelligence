import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, Metric, SectionHeading, DataBadge, MethodNote } from './research-ui';
import { ForensicCapture } from './forensic-capture';
import { useOrderFlow, tiers } from '@/lib/market/use-order-flow';
import { useCrossVenue, premiumBps, annualizedFunding } from '@/lib/market/use-cross-venue';

const sgn = (n: number, d = 2) => `${n >= 0 ? '+' : ''}${n.toFixed(d)}`;
const iso = (t: number) => new Date(t).toISOString();
const status = (s: string) => (s === 'live' ? 'LIVE' : s === 'connecting' ? 'CONNECTING' : 'DISCONNECTED');
const assets = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

function AssetPicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return <div className="flex gap-1">{assets.map((a) => <Button key={a} variant="terminal" size="sm" data-active={value === a} onClick={() => onChange(a)}>{a.replace('USDT', '')}</Button>)}</div>;
}

export function WhaleOrderFlow() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const f = useOrderFlow(symbol);
  const base = symbol.replace('USDT', '');
  const max = Math.max(...tiers.map((t) => Math.abs(f.tierStats[t.key].buy - f.tierStats[t.key].sell)), 1e-9);
  const retail = f.tierStats.retail, inst = { buy: f.tierStats.large.buy + f.tierStats.whale.buy, sell: f.tierStats.large.sell + f.tierStats.whale.sell };
  const rD = retail.buy - retail.sell, iD = inst.buy - inst.sell;
  const signature = rD < 0 && iD > 0 ? 'Candidate absorption: retail selling, large-tier buying' : rD > 0 && iD < 0 ? 'Candidate distribution: retail buying, large-tier selling' : 'No divergence between retail and large tiers';
  return (
    <main className="research-content">
      <PageHeader eyebrow="Order flow / Size-tiered delta" title="Whale vs retail order flow" description="Live Binance spot aggressor volume split by trade notional, accumulated while this page is open." />
      <div className="research-filterbar"><AssetPicker value={symbol} onChange={setSymbol} /><DataBadge status={status(f.status)} /></div>
      <div className="research-metrics">
        <Metric label="Last price" value={f.price ? f.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'} unit="USDT" foot={`Live ${symbol}`} />
        <Metric label="Retail delta" value={sgn(rD, 3)} unit={base} foot="Trades < $10k" tone={rD >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Large + whale delta" value={sgn(iD, 3)} unit={base} foot="Trades ≥ $100k" tone={iD >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Tier signature" value={rD * iD < 0 ? 'Divergent' : 'Aligned'} foot={signature} tone="text-analysis" />
      </div>
      <section className="research-section"><SectionHeading title="Delta by size tier" aside={<DataBadge status={status(f.status)} />} />
        {tiers.map((t) => { const s = f.tierStats[t.key]; const d = s.buy - s.sell; return (
          <div key={t.key} className="grid grid-cols-[110px_1fr_90px] items-center gap-3 py-2 border-b border-border text-xs">
            <div><div>{t.label}</div><div className="text-[10px] text-muted-foreground">{t.range} · {s.count} trades</div></div>
            <div className="relative h-4 bg-secondary rounded-sm overflow-hidden"><div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" /><div className={`absolute top-0 bottom-0 ${d >= 0 ? 'left-1/2 bg-positive' : 'right-1/2 bg-negative'}`} style={{ width: `${Math.abs(d) / max * 50}%` }} /></div>
            <div className={`font-mono text-right ${d >= 0 ? 'text-positive' : 'text-negative'}`}>{sgn(d, 3)}</div>
          </div>); })}
      </section>
      <MethodNote>Tiers use individual aggregated trades (price × quantity). Large orders are often split into many small fills, so whale activity can be under-counted. Divergence is a research observation, not evidence of identity or intent.</MethodNote>
      <ForensicCapture title={`Size-tiered order flow · ${symbol}`} collect={() => ({ evidence: [...tiers.map((t) => { const s = f.tierStats[t.key]; return { metric: `${t.label} delta (${t.range})`, value: `${sgn(s.buy - s.sell, 4)} ${base} · buy ${s.buy.toFixed(4)} / sell ${s.sell.toFixed(4)} · ${s.count} trades`, source: `Binance spot aggTrade ${symbol} · session from ${iso(f.sessionStart)}`, timestamp: iso(f.lastUpdate ?? Date.now()) }; }), { metric: 'Tier signature', value: signature, source: 'FZ tier rule v1', timestamp: iso(Date.now()) }], raw: { tierStats: f.tierStats, lastTradeId: f.lastTradeId, bids: f.bids, asks: f.asks } })} />
    </main>
  );
}

export function SpoofingRadar() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const f = useOrderFlow(symbol);
  const done = f.walls.filter((w) => w.outcome !== 'resting');
  const filled = done.filter((w) => w.outcome === 'filled').length, cancelled = done.length - filled;
  const flagged = done.filter((w) => w.outcome === 'cancelled' && w.lastSeen - w.firstSeen < 5000 && w.distanceBps < 10);
  return (
    <main className="research-content">
      <PageHeader eyebrow="Surveillance / Liquidity lifecycle" title="Spoofing & cancellation radar" description="Tracks large resting walls (≥5× median level size) in the live top-20 book and classifies each removal as filled or cancelled." />
      <div className="research-filterbar"><AssetPicker value={symbol} onChange={setSymbol} /><DataBadge status={status(f.status)} /></div>
      <div className="research-metrics">
        <Metric label="Walls resting now" value={String(f.walls.length - done.length)} foot="Live order book" />
        <Metric label="Fill-to-cancel ratio" value={cancelled ? (filled / cancelled).toFixed(2) : done.length ? '∞' : '—'} foot={`${filled} filled · ${cancelled} cancelled`} />
        <Metric label="Candidate spoof events" value={String(flagged.length)} foot="Cancelled < 5s within 10 bps of mid" tone={flagged.length ? 'text-negative' : ''} />
        <Metric label="Session start" value={new Date(f.sessionStart).toISOString().slice(11, 19)} foot="UTC · observation window" />
      </div>
      <section className="research-section"><SectionHeading title="Wall lifecycle log" aside={<DataBadge status={status(f.status)} />} />
        <div className="research-table-wrap"><table className="research-table"><thead><tr><th>Side</th><th>Price</th><th>Max size</th><th>Rested</th><th>Dist. bps</th><th>Outcome</th></tr></thead><tbody>
          {f.walls.slice(0, 30).map((w) => { const flag = flagged.includes(w); return <tr key={w.id + w.firstSeen}><td className={w.side === 'bid' ? 'text-positive' : 'text-negative'}>{w.side}</td><td className="numeric">{w.price.toLocaleString('en-US')}</td><td className="numeric">{w.qty.toFixed(3)}</td><td className="numeric">{((w.lastSeen - w.firstSeen) / 1000).toFixed(1)}s</td><td className="numeric">{w.distanceBps.toFixed(1)}</td><td className={flag ? 'text-negative' : w.outcome === 'filled' ? 'text-positive' : 'text-muted-foreground'}>{flag ? 'Candidate spoof' : w.outcome}</td></tr>; })}
          {!f.walls.length && <tr><td colSpan={6} className="text-muted-foreground">Waiting for large walls in the live book…</td></tr>}
        </tbody></table></div>
      </section>
      <MethodNote>A "candidate spoof" is a quantitative flag only. Fast cancellations are routine for market makers and risk systems; this does not establish intent or a regulatory breach (FCA MAR, EU MiCA).</MethodNote>
      <ForensicCapture title={`Liquidity cancellation radar · ${symbol}`} collect={() => ({ evidence: [{ metric: 'Fill / cancel counts', value: `${filled} filled · ${cancelled} cancelled`, source: `Binance spot depth20@100ms ${symbol}`, timestamp: iso(Date.now()) }, ...flagged.slice(0, 20).map((w) => ({ metric: `Candidate spoof · ${w.side} ${w.price}`, value: `${w.qty.toFixed(4)} rested ${((w.lastSeen - w.firstSeen) / 1000).toFixed(3)}s · ${w.distanceBps.toFixed(1)} bps from mid`, source: 'FZ wall rule v1 (<5s, <10bps, not traded through)', timestamp: `${iso(w.firstSeen)} → ${iso(w.lastSeen)}` }))], raw: { walls: f.walls, bids: f.bids, asks: f.asks } })} />
    </main>
  );
}

export function CrossVenue() {
  const v = useCrossVenue();
  const cbPrem = premiumBps(v.coinbase.price, v.binance.price);
  const bbPrem = premiumBps(v.bybit.price, v.binance.price);
  const basis = premiumBps(v.perp.price, v.binance.price);
  const apr = annualizedFunding(v.fundingRate);
  const rows: [string, typeof v.binance, string][] = [['Binance spot', v.binance, 'BTC/USDT'], ['Coinbase', v.coinbase, 'BTC/USD'], ['Bybit spot', v.bybit, 'BTC/USDT'], ['Binance perp (mark)', v.perp, 'BTCUSDT-PERP']];
  return (
    <main className="research-content">
      <PageHeader eyebrow="Cross-market / Venue dislocation" title="Cross-venue premium & basis" description="Live public tickers from Binance, Coinbase and Bybit, with Coinbase premium, perpetual basis and annualised funding." />
      <div className="research-metrics">
        <Metric label="Coinbase premium" value={cbPrem == null ? '—' : sgn(cbPrem, 1)} unit="bps" foot="Coinbase USD vs Binance USDT" tone={(cbPrem ?? 0) >= 0 ? 'text-positive' : 'text-negative'} />
        <Metric label="Bybit vs Binance" value={bbPrem == null ? '—' : sgn(bbPrem, 1)} unit="bps" foot="Spot dislocation" />
        <Metric label="Perp basis" value={basis == null ? '—' : sgn(basis, 1)} unit="bps" foot="Mark vs spot" tone="text-analysis" />
        <Metric label="Funding (annualised)" value={apr == null ? '—' : sgn(apr, 2)} unit="%" foot={v.fundingRate == null ? 'Binance perp' : `${(v.fundingRate * 100).toFixed(4)}% / 8h`} tone={(apr ?? 0) >= 0 ? 'text-positive' : 'text-negative'} />
      </div>
      <section className="research-section"><SectionHeading title="Venue tickers" />
        <div className="research-table-wrap"><table className="research-table"><thead><tr><th>Venue</th><th>Pair</th><th>Price</th><th>vs Binance spot</th><th>Updated (UTC)</th><th>Status</th></tr></thead><tbody>
          {rows.map(([n, q, pair]) => { const p = premiumBps(q.price, v.binance.price); return <tr key={n}><td>{n}</td><td>{pair}</td><td className="numeric">{q.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}</td><td className="numeric">{p == null ? '—' : `${sgn(p, 1)} bps`}</td><td className="numeric">{q.time ? iso(q.time).slice(11, 23) : '—'}</td><td><DataBadge status={status(q.status)} /></td></tr>; })}
        </tbody></table></div>
      </section>
      <MethodNote>Coinbase quotes USD while Binance and Bybit quote USDT, so the premium includes the USDT/USD rate. A positive Coinbase premium has historically coincided with US demand but is not proof of institutional buying. Funding is annualised at 3 periods per day.</MethodNote>
      <ForensicCapture title="Cross-venue premium snapshot · BTC" collect={() => ({ evidence: [...rows.map(([n, q, pair]) => ({ metric: `${n} ${pair}`, value: q.price == null ? 'unavailable' : String(q.price), source: `${n} public WebSocket`, timestamp: q.time ? iso(q.time) : 'n/a' })), { metric: 'Coinbase premium', value: cbPrem == null ? 'unavailable' : `${cbPrem.toFixed(2)} bps`, source: 'Derived', timestamp: iso(Date.now()) }, { metric: 'Funding rate', value: v.fundingRate == null ? 'unavailable' : `${v.fundingRate} per 8h`, source: 'Binance markPrice stream', timestamp: iso(Date.now()) }], raw: v })} />
    </main>
  );
}
