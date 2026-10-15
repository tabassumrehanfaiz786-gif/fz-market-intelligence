import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { CandidateAnalytics } from '@/components/platform/microstructure';
export const Route=createFileRoute('/hidden-liquidity')({head:()=>({meta:[{title:'Hidden liquidity — Fz Market Intelligence'},{name:'description',content:'Observable hidden-liquidity candidate analytics.'},{property:'og:title',content:'Hidden liquidity — Fz Market Intelligence'},{property:'og:description',content:'Observable hidden-liquidity candidate analytics.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><CandidateAnalytics hidden/></TerminalShell>;}
