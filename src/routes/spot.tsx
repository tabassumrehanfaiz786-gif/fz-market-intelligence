import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { MarketView } from '@/components/market/market-view';
export const Route=createFileRoute('/spot')({head:()=>({meta:[{title:'Spot heatmap — Fz Market Intelligence'},{name:'description',content:'BTC spot liquidity heatmap, minute to year windows.'},{property:'og:title',content:'Spot heatmap — Fz Market Intelligence'},{property:'og:description',content:'BTC spot liquidity heatmap, minute to year windows.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><MarketView initialMarket="Spot"/></TerminalShell>;}
