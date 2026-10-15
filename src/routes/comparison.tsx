import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { Comparison } from '@/components/platform/microstructure';
export const Route=createFileRoute('/comparison')({head:()=>({meta:[{title:'Spot vs perpetual — Fz Market Intelligence'},{name:'description',content:'Cross-market spot and perpetual comparison.'},{property:'og:title',content:'Spot vs perpetual — Fz Market Intelligence'},{property:'og:description',content:'Cross-market spot and perpetual comparison.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><Comparison/></TerminalShell>;}
