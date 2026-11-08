import { useQuery } from '@tanstack/react-query';
import { PageHeader, DataBadge, EmptyState, SectionHeading, MethodNote } from './research-ui';
import { getEtfFlows } from '@/lib/market/public-feeds.functions';

const fmt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
const tone = (v: number) => (v > 0 ? 'text-positive' : v < 0 ? 'text-negative' : 'text-muted-foreground');

export function FlowAnalytics({ aggregate = false }: { aggregate?: boolean }) {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['etf-flows'], queryFn: () => getEtfFlows(), refetchInterval: 600_000 });
  const days = data?.days ?? [];
  const latest = days[0];
  const week = days.slice(0, 5).reduce((s, d) => s + d.total, 0);
  const chart = days.slice(0, 10).reverse();
  const max = Math.max(...chart.map((d) => Math.abs(d.total)), 1);
  const activeTickers = (data?.tickers ?? []).filter((t) => days.some((d) => d.funds[t] !== 0));
  return (
    <main className="research-content">
      <PageHeader eyebrow="Institutional flows / US spot Bitcoin ETFs"
        title={aggregate ? 'Aggregate ETF analytics' : 'Institutional ETF flow monitor'}
        description="Daily net creations/redemptions per fund in US$ millions, from a free public tracker. Figures update once each trading day after funds report."
        actions={<DataBadge status={isLoading ? 'CHECKING' : data?.error ? 'UNAVAILABLE' : 'LIVE'} />} />
      {isLoading ? <EmptyState title="Loading ETF flows…" description="Fetching the latest reported daily fund flows." /> : !latest ? (
        <EmptyState title="ETF source temporarily unreachable" description="The public ETF flow tracker could not be reached. No figures are invented — try again shortly.">
          <button className="text-xs underline" onClick={() => refetch()}>Retry</button>
        </EmptyState>
      ) : (<>
        <div className="research-metrics">
          <div className="research-metric"><div className="stat-label">Latest day<DataBadge status="LIVE" /></div><div className={`stat-value ${tone(latest.total)}`}>{fmt(latest.total)} <span className="text-xs text-muted-foreground">US$m</span></div><p className="stat-foot">{latest.date}</p></div>
          <div className="research-metric"><div className="stat-label">Last 5 reported days</div><div className={`stat-value ${tone(week)}`}>{fmt(week)} <span className="text-xs text-muted-foreground">US$m</span></div><p className="stat-foot">Sum of daily totals</p></div>
          <div className="research-metric"><div className="stat-label">Days covered</div><div className="stat-value">{days.length}</div><p className="stat-foot">Most recent first</p></div>
          <div className="research-metric"><div className="stat-label">Active funds</div><div className="stat-value">{activeTickers.length}</div><p className="stat-foot">Non-zero flow in period</p></div>
        </div>
        <SectionHeading title="Daily net flow · US$ millions" />
        <div className="flow-chart"><div className="flow-chart-grid" /><div className="flow-bars">{chart.map((d) => (
          <div className="flow-bar-column" key={d.date}><div className="flow-bar-track"><div className={`flow-bar ${d.total >= 0 ? 'positive' : 'negative'}`} style={{ height: `${Math.max(2, Math.abs(d.total) / max * 85)}%` }} title={`${d.date} · ${fmt(d.total)} US$m`} /></div><span>{d.date.slice(0, 6)}</span></div>
        ))}</div><span className="flow-chart-unit">Net flow · US$ millions · LIVE public data</span></div>
        <SectionHeading title="Fund breakdown" />
        <div className="research-table-wrap"><table className="research-table"><thead><tr><th>Date</th>{activeTickers.map((t) => <th key={t}>{t}</th>)}<th>Total</th></tr></thead>
          <tbody>{days.map((d) => <tr key={d.date}><td>{d.date}</td>{activeTickers.map((t) => <td key={t} className={`numeric ${tone(d.funds[t] ?? 0)}`}>{fmt(d.funds[t] ?? 0)}</td>)}<td className={`numeric ${tone(d.total)}`}>{fmt(d.total)}</td></tr>)}</tbody></table></div>
        <MethodNote>Source: {data?.source}. Retrieved {data?.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'}. Public tracker data, not an official fund filing — verify against issuer disclosures before citing.</MethodNote>
      </>)}
    </main>
  );
}
