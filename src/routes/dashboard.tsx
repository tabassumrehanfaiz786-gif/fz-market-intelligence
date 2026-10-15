import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { Dashboard } from '@/components/platform/dashboard';
export const Route=createFileRoute('/dashboard')({head:()=>({meta:[{title:'Executive dashboard — Fz Market Intelligence'},{name:'description',content:'Institutional BTC flow and liquidity overview.'},{property:'og:title',content:'Executive dashboard — Fz Market Intelligence'},{property:'og:description',content:'Institutional BTC flow and liquidity overview.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><Dashboard/></TerminalShell>;}
