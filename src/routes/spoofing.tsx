import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { SpoofingRadar } from '@/components/platform/institutional';
export const Route=createFileRoute('/spoofing')({head:()=>({meta:[{title:'Spoofing and cancellation radar — Fz Market Intelligence'},{name:'description',content:'Live large-wall lifecycle tracking with fill-to-cancel ratio and candidate spoof flags.'},{property:'og:title',content:'Spoofing and cancellation radar — Fz Market Intelligence'},{property:'og:description',content:'Live large-wall lifecycle tracking with fill-to-cancel ratio and candidate spoof flags.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><SpoofingRadar/></TerminalShell>;}
