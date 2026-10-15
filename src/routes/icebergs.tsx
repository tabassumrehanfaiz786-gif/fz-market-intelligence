import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { CandidateAnalytics } from '@/components/platform/microstructure';
export const Route=createFileRoute('/icebergs')({head:()=>({meta:[{title:'Iceberg candidates — Fz Market Intelligence'},{name:'description',content:'Explainable iceberg candidate detection.'},{property:'og:title',content:'Iceberg candidates — Fz Market Intelligence'},{property:'og:description',content:'Explainable iceberg candidate detection.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><CandidateAnalytics/></TerminalShell>;}
