import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { WhaleOrderFlow } from '@/components/platform/institutional';
export const Route=createFileRoute('/order-flow')({head:()=>({meta:[{title:'Whale vs retail order flow — Fz Market Intelligence'},{name:'description',content:'Live size-tiered delta for BTC, ETH and SOL from Binance.'},{property:'og:title',content:'Whale vs retail order flow — Fz Market Intelligence'},{property:'og:description',content:'Live size-tiered delta for BTC, ETH and SOL from Binance.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><WhaleOrderFlow/></TerminalShell>;}
