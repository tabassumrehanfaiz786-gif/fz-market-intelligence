import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { FlowAnalytics } from '@/components/platform/flow-analytics';
export const Route=createFileRoute('/etf-flows')({head:()=>({meta:[{title:'ETF flow monitor — Fz Market Intelligence'},{name:'description',content:'Spot bitcoin ETF flow monitoring with simulated fixtures.'},{property:'og:title',content:'ETF flow monitor — Fz Market Intelligence'},{property:'og:description',content:'Spot bitcoin ETF flow monitoring with simulated fixtures.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><FlowAnalytics/></TerminalShell>;}
