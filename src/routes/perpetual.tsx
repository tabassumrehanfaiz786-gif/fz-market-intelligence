import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { MarketView } from '@/components/market/market-view';
export const Route=createFileRoute('/perpetual')({head:()=>({meta:[{title:'Perpetual Bookmap heatmap — Fz Market Intelligence'},{name:'description',content:'Real BTC perpetual candles, session order-book heatmap and executed-trade bubbles with minute-to-year ranges, zoom and pan.'},{property:'og:title',content:'Perpetual Bookmap heatmap — Fz Market Intelligence'},{property:'og:description',content:'Explore real BTC perpetual liquidity with time ranges, cursor-anchored zoom, depth intensity and trade bubbles.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><MarketView initialMarket="Perpetual"/></TerminalShell>;}
