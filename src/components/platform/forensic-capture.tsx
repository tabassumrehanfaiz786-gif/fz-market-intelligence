import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { FileLock2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSession } from './session';
import { buildDossier, exportDossier, type Evidence } from '@/lib/research/dossier';
import { saveForensicCase } from '@/lib/research/research.functions';

/** Captures the current live evidence into a tamper-evident (SHA-256) dossier: PDF + CSV, optionally saved as a private case. */
export function ForensicCapture({ title, collect }: { title: string; collect: () => { evidence: Evidence[]; raw: unknown } }) {
  const { user } = useSession();
  const save = useServerFn(saveForensicCase);
  const [hash, setHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (persist: boolean) => {
    setBusy(true);
    try {
      const { evidence, raw } = collect();
      const d = await buildDossier(title, evidence, raw);
      setHash(d.hash);
      await exportDossier(d);
      if (persist) { await save({ data: { title: d.title, hash: d.hash, capturedAt: d.capturedAt, evidence: d.evidence } }); toast.success('Dossier saved to your private cases.'); }
    } catch { toast.error('The dossier could not be completed. Please retry.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="research-section mt-6">
      <h2 className="section-title"><span>Forensic dossier</span><span className="data-badge live">LIVE CAPTURE</span></h2>
      <p className="text-xs text-muted-foreground leading-5">Freeze the current live evidence with millisecond timestamps and a SHA-256 hash for tamper-evident provenance. Downloads an audit-ready PDF and CSV.</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" disabled={busy} onClick={() => run(false)}><FileLock2 />Capture & export</Button>
        {user && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(true)}><Save />Capture & save to cases</Button>}
      </div>
      {hash && <p className="mt-3 font-mono text-[10px] break-all text-muted-foreground">SHA-256 · {hash}</p>}
    </section>
  );
}
