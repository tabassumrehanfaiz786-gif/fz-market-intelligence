import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, DataBadge, EmptyState } from './research-ui';
import { providers } from '@/lib/research/fixtures';

export function FlowAnalytics({ aggregate = false }: { aggregate?: boolean }) {
  return (
    <main className="research-content">
      <PageHeader
        eyebrow="Institutional flows / Bitcoin spot ETFs"
        title={aggregate ? 'Aggregate ETF analytics' : 'Institutional ETF flow monitor'}
        description="Fund-level net flows and coverage. No simulated data is shown on this page."
      />
      <EmptyState
        title="ETF reporting source not connected"
        description="Live ETF flow data requires a licensed, dated fund-reporting source, which is not connected. No verified fund flows, AUM ranking or aggregate analytics are available, and no simulated figures are displayed."
      >
        <Button variant="link" size="sm" asChild><Link to="/methodology">Sources & methodology<ArrowRight /></Link></Button>
      </EmptyState>
      <section className="research-section mt-6">
        {providers.filter((p) => p.name.includes('ETF')).map((p) => (
          <div className="provider-item" key={p.name}>
            <div><h3>{p.name}</h3><p>{p.required}</p></div>
            <DataBadge status="UNAVAILABLE" />
          </div>
        ))}
      </section>
    </main>
  );
}
