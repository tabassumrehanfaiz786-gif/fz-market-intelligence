import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { CrossVenue } from '@/components/platform/institutional';
export const Route=createFileRoute('/cross-venue')({head:()=>({meta:[{title:'Cross-venue premium and basis — Fz Market Intelligence'},{name:'description',content:'Live Coinbase premium, Bybit dislocation, perpetual basis and funding.'},{property:'og:title',content:'Cross-venue premium and basis — Fz Market Intelligence'},{property:'og:description',content:'Live Coinbase premium, Bybit dislocation, perpetual basis and funding.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><CrossVenue/></TerminalShell>;}
