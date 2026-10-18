import { downloadPdf, downloadCsv } from './report';

export type Evidence = { metric: string; value: string; source: string; timestamp: string };

/** Stable JSON: object keys sorted so identical evidence always hashes the same. */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function buildDossier(title: string, evidence: Evidence[], raw: unknown) {
  const capturedAt = new Date().toISOString();
  const payload = { title, capturedAt, evidence, raw };
  const hash = await sha256Hex(canonicalJson(payload));
  return { title, capturedAt, evidence, hash, payload };
}

export async function exportDossier(d: Awaited<ReturnType<typeof buildDossier>>) {
  await downloadPdf({
    title: d.title,
    question: 'Forensic snapshot of live market order flow and depth.',
    conclusion: 'Observation only. No inference of identity, intent or wrongdoing is made.',
    alternatives: 'Wall removals and tiered flow may reflect market-making, hedging, risk limits or latency.',
    limitations: `Browser-captured, top-20 depth levels, session-only history. SHA-256 of canonical payload: ${d.hash}`,
    status: 'live',
    generatedAt: d.capturedAt,
    evidence: [...d.evidence, { metric: 'SHA-256 dossier hash', value: d.hash, source: 'Web Crypto over canonical JSON', timestamp: d.capturedAt }],
  });
  downloadCsv('fz-forensic-dossier.csv', [['metric', 'value', 'source', 'timestamp'], ...d.evidence.map((e) => [e.metric, e.value, e.source, e.timestamp]), ['sha256', d.hash, 'Web Crypto', d.capturedAt]]);
}
