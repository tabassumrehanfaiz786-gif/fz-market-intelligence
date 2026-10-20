import { createFileRoute } from '@tanstack/react-router';
import { TerminalShell } from '@/components/platform/terminal-shell';
import { IcebergSurveillance } from '@/components/platform/iceberg-surveillance';
const t='Iceberg & absorption surveillance — Fz Market Intelligence', d='Live iceberg candidate detection with reload ratios, pattern labels and STOR-style evidence export.';
export const Route=createFileRoute('/icebergs')({head:()=>({meta:[{title:t},{name:'description',content:d},{property:'og:title',content:t},{property:'og:description',content:d},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <TerminalShell><IcebergSurveillance/></TerminalShell>;}
