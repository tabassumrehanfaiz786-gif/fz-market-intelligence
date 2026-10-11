export function aggregateFlows(values: number[]) { return values.reduce((sum,v)=>sum+v,0); }
export function cumulativeFlows(values: number[]) { let sum=0;return values.map(v=>{sum+=v;return Number(sum.toFixed(6));}); }
export function btcEquivalent(usd:number,price:number|null) { return price && price>0 && Number.isFinite(price)?usd/price:null; }
export function imbalance(bids:number,asks:number){return bids+asks>0?(bids-asks)/(bids+asks)*100:null;}
export function icebergCandidate(e:{count:number;executed:number;displayed:number},minCount=3,minRatio=3){return e.displayed>0&&e.count>=minCount&&e.executed/e.displayed>=minRatio;}
export function divergence(flow:number,priceChange:number){return flow*priceChange<0;}
export function alignTimestamps(a:string,b:string,toleranceMs=60000){return Math.abs(Date.parse(a)-Date.parse(b))<=toleranceMs;}
export function persistence(first:string,last:string){return Math.max(0,(Date.parse(last)-Date.parse(first))/1000);}
export function applyDepthUpdate(snapshot:{sequence:number;bids:Map<number,number>},update:{first:number;last:number;bids:[number,number][]}){if(update.last<=snapshot.sequence)return {status:'ignored' as const,snapshot};if(update.first>snapshot.sequence+1)return {status:'gap' as const,snapshot};const bids=new Map(snapshot.bids);for(const [price,qty]of update.bids){if(qty===0)bids.delete(price);else bids.set(price,qty);}return {status:'applied' as const,snapshot:{sequence:update.last,bids}};}
export function safeCsv(rows:(string|number)[][]){return rows.map(row=>row.map(v=>{let s=String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export const usdMillions = (v:number)=>`${v<0?'−':'+'}$${Math.abs(v).toFixed(1)}M`;
export function canUseFeature(entitlement:{feature:string;usage_limit:number;expires_at:string|null}|null,feature:string,used:number,now:number){return Boolean(entitlement&&entitlement.feature===feature&&used<entitlement.usage_limit&&(!entitlement.expires_at||Date.parse(entitlement.expires_at)>now));}
