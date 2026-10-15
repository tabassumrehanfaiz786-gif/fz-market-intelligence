import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { FlowAnalytics } from '@/components/platform/flow-analytics';
export const Route=createFileRoute('/aggregate-flows')({head:()=>({meta:[{title:'Aggregate flow analytics — Fz Market Intelligence'},{name:'description',content:'Aggregated ETF flow analytics across issuers.'},{property:'og:title',content:'Aggregate flow analytics — Fz Market Intelligence'},{property:'og:description',content:'Aggregated ETF flow analytics across issuers.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><FlowAnalytics aggregate/></TerminalShell>;}
