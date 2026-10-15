import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { Replay } from '@/components/platform/microstructure';
export const Route=createFileRoute('/replay')({head:()=>({meta:[{title:'Historical replay — Fz Market Intelligence'},{name:'description',content:'Historical liquidity replay with coverage limits.'},{property:'og:title',content:'Historical replay — Fz Market Intelligence'},{property:'og:description',content:'Historical liquidity replay with coverage limits.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><Replay/></TerminalShell>;}
