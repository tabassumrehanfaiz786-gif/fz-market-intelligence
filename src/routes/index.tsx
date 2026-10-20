import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Layers, Menu, Radio, Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketView } from '@/components/market/market-view';
import { navGroups } from '@/components/platform/terminal-shell';

export const Route = createFileRoute('/')({
 head:()=>({meta:[{title:'Live BTC Liquidity Heatmap — Fz Market Intelligence'},{name:'description',content:'Live BTC spot and perpetual liquidity heatmaps with minute-to-year windows, real Binance trades, order-book depth and volume delta.'},{property:'og:title',content:'Fz Market Intelligence — Live Market Liquidity'},{property:'og:description',content:'Live institutional-style BTC liquidity heatmaps, depth profiles and minute-to-year market windows from Binance.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:Index,
});

const quick=[
 {title:'Icebergs',path:'/icebergs'},
 {title:'Whale flow',path:'/order-flow'},
 {title:'Spoofing radar',path:'/spoofing'},
 {title:'Cross-venue basis',path:'/cross-venue'},
 {title:'Dashboard',path:'/dashboard'},
] as const;

function Index(){
 const [market,setMarket]=useState('Spot');
 const [collapsed,setCollapsed]=useState(false);
 const [mobile,setMobile]=useState(false);
 return <div className={`terminal-shell ${collapsed?'collapsed':''} ${mobile?'mobile-open':''}`}>
  <aside className="sidebar institutional-sidebar">
   <div className="flex items-center gap-3"><div className="brand-mark">Fz</div><div className="sidebar-copy brand-title">Market<br/>Intelligence</div><Button variant="ghost" size="icon" className="sm:hidden ml-auto" title="Close navigation" onClick={()=>setMobile(false)}><X/></Button></div>
   <div className="sidebar-label">Markets</div>
   <Button variant="terminal" className="nav-item" data-active={market==='Spot'} title="BTC spot heatmap" onClick={()=>{setMarket('Spot');setMobile(false);}}><Activity/><span className="sidebar-copy">Spot heatmap</span></Button>
   <Button variant="terminal" className="nav-item" data-active={market==='Perpetual'} title="BTC perpetual heatmap" onClick={()=>{setMarket('Perpetual');setMobile(false);}}><Waves/><span className="sidebar-copy">Perpetual heatmap</span></Button>
   <nav className="platform-nav">{navGroups.map(g=><div key={g.label}><div className="sidebar-label">{g.label}</div>{g.items.map(item=><Button variant="terminal" className="nav-item" asChild key={item.path}><Link to={item.path} title={item.title}><item.icon/><span className="sidebar-copy">{item.title}</span></Link></Button>)}</div>)}</nav>
   <div className="mt-auto border-t border-border pt-4"><div className="sidebar-copy flex items-center gap-2 text-[11px] text-muted-foreground"><span className="status-dot"/>Live market workspace</div><Button variant="ghost" size="icon" className="mt-3 text-muted-foreground hidden sm:inline-flex" title={collapsed?'Expand sidebar':'Collapse sidebar'} onClick={()=>setCollapsed(s=>!s)}>{collapsed?<ChevronRight/>:<ChevronLeft/>}</Button></div>
  </aside>
  {mobile&&<div className="mobile-scrim" onClick={()=>setMobile(false)}/>}
  <div className="workspace">
   <header className="topbar"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="text-muted-foreground" title="Open navigation" onClick={()=>{if(window.innerWidth<640)setMobile(v=>!v);else setCollapsed(s=>!s);}}><Menu/></Button><span className="text-xs hidden sm:inline">Market liquidity</span><div className="flex items-center gap-2 sm:hidden"><span className="text-primary font-semibold text-xl">Fz</span><span className="text-[11px] font-medium">Market Intelligence</span></div></div><div className="flex items-center gap-4 shrink-0"><span className="flex items-center gap-2 text-[10px] text-positive"><Radio className="size-3"/>LIVE · BINANCE</span></div></header>
   <div className="flex gap-2 overflow-x-auto border-b border-border px-3 py-2">
    <Button variant="terminal" size="sm" className="nav-item shrink-0" data-active="true"><Layers/>Heatmap</Button>
    {quick.map(q=><Button key={q.path} variant="outline" size="sm" className="shrink-0" asChild><Link to={q.path}>{q.title}</Link></Button>)}
   </div>
   <MarketView initialMarket={market} key={market}/>
  </div>
 </div>;
}
