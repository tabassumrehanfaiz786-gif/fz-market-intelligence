import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { PageHeader, EmptyState, DataBadge, MethodNote } from '@/components/platform/research-ui';
import { getLiveNews } from '@/lib/market/public-feeds.functions';

export const Route = createFileRoute('/news')({
  head: () => ({ meta: [
    { title: 'Institutional news — Fz Market Intelligence' },
    { name: 'description', content: 'Live crypto market headlines with publisher, timestamp and original link.' },
    { property: 'og:title', content: 'Institutional news — Fz Market Intelligence' },
    { property: 'og:description', content: 'Live crypto market headlines with publisher, timestamp and original link.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Page,
});

const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };

function Page() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['live-news'], queryFn: () => getLiveNews(), refetchInterval: 120_000 });
  return (
    <TerminalShell><main className="research-content">
      <PageHeader eyebrow="Fz Market Intelligence" title="Institutional news" description="Live headlines from public publisher feeds. Each item links to the original article."
        actions={<DataBadge status={isLoading ? 'CHECKING' : data?.error ? 'UNAVAILABLE' : 'LIVE'} />} />
      {isLoading ? <EmptyState title="Loading headlines…" description="Fetching the latest publisher feeds." /> : !data?.items.length ? (
        <EmptyState title="News feeds temporarily unreachable" description="No headlines could be fetched right now. Nothing is invented — try again shortly."><button className="text-xs underline" onClick={() => refetch()}>Retry</button></EmptyState>
      ) : (<section className="research-section">
        {data.items.map((n) => (
          <a className="provider-item" key={n.link} href={n.link} target="_blank" rel="noopener noreferrer">
            <div><h3>{n.title}</h3><p>{n.publisher} · {new Date(n.publishedAt).toLocaleString()} · {ago(n.publishedAt)}</p></div>
            <DataBadge status="LIVE" />
          </a>
        ))}
        <MethodNote>Sources: {data.sources.join(', ')}. Headlines are publisher reporting, not verified market evidence; read the original before citing.</MethodNote>
      </section>)}
    </main></TerminalShell>
  );
}
