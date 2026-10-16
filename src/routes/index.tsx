import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Layers, Menu, Radio, ShieldCheck, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketView } from '@/components/market/market-view';

export const Route = createFileRoute('/')({
 head:()=>({meta:[{title:'Live BTC Liquidity Heatmap — Fz Market Intelligence'},{name:'description',content:'Live BTC spot and perpetual liquidity heatmaps with minute-to-year windows, real Binance trades, order-book depth and volume delta.'},{property:'og:title',content:'Fz Market Intelligence — Live Market Liquidity'},{property:'og:description',content:'Live institutional-style BTC liquidity heatmaps, depth profiles and minute-to-year market windows from Binance.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Index,
});

function Index(){
 const [market,setMarket]=useState('Spot');
 const [collapsed,setCollapsed]=useState(false);
 return <div className={`terminal-shell ${collapsed?'collapsed':''}`}>
  <aside className="sidebar">
   <div className="flex items-center gap-3"><div className="brand-mark">Fz</div><div className="sidebar-copy brand-title">Market<br/>Intelligence</div></div>
   <div className="sidebar-label">Workspace</div>
   <Button variant="terminal" className="nav-item" data-active="true" title="Market liquidity"><Layers/><span className="sidebar-copy">Market liquidity</span></Button>
   <div className="sidebar-label">Markets</div>
   <Button variant="terminal" className="nav-item" data-active={market==='Spot'} title="BTC spot heatmap" onClick={()=>setMarket('Spot')}><Activity/><span className="sidebar-copy">Spot heatmap</span></Button>
   <Button variant="terminal" className="nav-item" data-active={market==='Perpetual'} title="BTC perpetual heatmap" onClick={()=>setMarket('Perpetual')}><Waves/><span className="sidebar-copy">Perpetual heatmap</span></Button>
   <div className="sidebar-label">Research</div>
   <Button variant="ghost" className="nav-item text-muted-foreground" title="Data and methodology" asChild><Link to="/methodology"><ShieldCheck/><span className="sidebar-copy">Data & methodology</span></Link></Button>
   <div className="mt-auto border-t border-border pt-4"><div className="sidebar-copy flex items-center gap-2 text-[11px] text-muted-foreground"><span className="status-dot"/>Live market workspace</div><div className="sidebar-copy mt-2 text-[10px] text-muted-foreground">Binance BTCUSDT stream</div><Button variant="ghost" size="icon" className="mt-3 text-muted-foreground" title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(s=>!s)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</Button></div>
  </aside>
  <div className="workspace">
   <header className="topbar"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground" title="Toggle sidebar" onClick={()=>setCollapsed(s=>!s)}><Menu/></Button><span className="text-xs text-muted-foreground hidden sm:inline">Workspace</span><ChevronRight className="size-3 text-muted-foreground hidden sm:inline"/><span className="text-xs hidden sm:inline">Market liquidity</span><div className="flex items-center gap-2 sm:hidden"><span className="text-primary font-semibold text-xl">Fz</span><span className="text-[11px] font-medium">Market Intelligence</span></div></div><div className="flex items-center gap-4 shrink-0"><span className="flex items-center gap-2 text-[10px] text-positive"><Radio className="size-3"/>LIVE · BINANCE</span><span className="size-7 border border-border rounded-full grid place-items-center text-[10px] bg-secondary">FZ</span></div></header>
   <MarketView initialMarket={market} key={market}/>
  </div>
 </div>;
}
