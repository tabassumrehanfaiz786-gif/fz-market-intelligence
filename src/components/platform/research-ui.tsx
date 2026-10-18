import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Database, Download, Info, Radio, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fixtureSource, fixtureTimestamp } from '@/lib/research/fixtures';
export function PageHeader({eyebrow,title,description,actions}:{eyebrow:string;title:string;description:string;actions?:ReactNode}){return <div className="market-heading mb-6"><div className="min-w-0"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="text-xs text-muted-foreground leading-5">{description}</p></div>{actions}</div>;}
export function DataBadge({status='LIVE'}:{status?:string}){return <span className={`data-badge ${status.toLowerCase()}`}>{status}</span>;}
export function Provenance(){return <div className="provenance"><Info className="size-3 shrink-0"/><span>{fixtureSource} · {fixtureTimestamp} · UTC</span></div>;}
export function EmptyState({title,description,children}:{title:string;description:string;children?:ReactNode}){return <div className="research-empty"><Database className="size-7 text-muted-foreground mb-3"/><h3 className="font-medium text-sm">{title}</h3><p className="text-xs text-muted-foreground max-w-lg leading-6 mt-2">{description}</p><div className="mt-4">{children}</div></div>;}
export function Metric({label,value,unit,foot,tone=''}:{label:string;value:string;unit?:string;foot:string;tone?:string}){return <div className="research-metric"><div className="stat-label">{label}<DataBadge status={value==='—'?'UNAVAILABLE':'LIVE'}/></div><div className={`stat-value ${tone}`}>{value} <span className="text-xs text-muted-foreground">{unit}</span></div><p className="stat-foot">{foot}</p></div>;}
export function MethodNote({children}:{children:ReactNode}){return <div className="method-note"><ShieldIcon/>{children}</div>;}
function ShieldIcon(){return <Info className="size-3.5 text-analysis shrink-0 mt-0.5"/>;}
export function SectionHeading({title,aside}:{title:string;aside?:ReactNode}){return <h2 className="section-title"><span>{title}</span>{aside}</h2>;}
export function FlowChart({values,labels,cumulative=false}:{values:number[];labels:string[];cumulative?:boolean}){const max=Math.max(...values.map(Math.abs),1);return <div className="flow-chart"><div className="flow-chart-grid"/><div className="flow-bars">{values.map((v,i)=><div className="flow-bar-column" key={i}><div className="flow-bar-track"><div className={`flow-bar ${v>=0?'positive':'negative'}`} style={{height:`${Math.max(2,Math.abs(v)/max*85)}%`}} title={`${labels[i]} · ${v.toFixed(2)} million USD · SIMULATED`}/></div><span>{labels[i]}</span></div>)}</div><span className="flow-chart-unit">{cumulative?'Cumulative':'Net flow'} · USD millions · SIMULATED</span></div>;}
