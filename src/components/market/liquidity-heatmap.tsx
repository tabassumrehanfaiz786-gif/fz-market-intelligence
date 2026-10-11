import { useEffect, useRef, useState } from 'react';

export const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M', '6M', '1Y'] as const;
export type Timeframe = typeof timeframes[number];
const labels: Record<Timeframe, string[]> = {
 '1m':['00:00','00:15','00:30','00:45','01:00'], '5m':['00:00','01:15','02:30','03:45','05:00'], '15m':['00:00','03:45','07:30','11:15','15:00'], '30m':['00:00','07:30','15:00','22:30','30:00'], '1h':['00:00','00:15','00:30','00:45','01:00'], '4h':['00:00','01:00','02:00','03:00','04:00'], '1D':['00:00','06:00','12:00','18:00','24:00'], '1W':['Mon','Wed','Fri','Sun','Mon'], '1M':['Day 1','Day 8','Day 15','Day 22','Day 30'], '6M':['Jan','Feb','Mar','May','Jun'], '1Y':['Jan','Apr','Jul','Oct','Dec'],
};
function random(n:number) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function LiquidityHeatmap({ timeframe, intensity, bubbles, vwap, market, zoom, playing }: {timeframe:Timeframe;intensity:number;bubbles:boolean;vwap:boolean;market:string;zoom:number;playing:boolean}) {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const [hover, setHover] = useState<{price:string;depth:string;time:string}|null>(null);
 useEffect(() => {
  const canvas = canvasRef.current; if (!canvas) return;
  const context = canvas.getContext('2d'); if (!context) return;
  let frame = 0; let tick = 0;
  const styles = getComputedStyle(document.documentElement);
  const color = (name:string) => styles.getPropertyValue(name).trim();
  const draw = () => {
   const width = canvas.clientWidth, height = canvas.clientHeight;
   const dpr = window.devicePixelRatio || 1;
   canvas.width = width*dpr; canvas.height = height*dpr; context.setTransform(dpr,0,0,dpr,0,0);
   const gutter = width<500?57:72, profile = width<500?32:65, w = width-gutter-profile, h = height-45;
   context.fillStyle=color('--chart-bg'); context.fillRect(0,0,width,height);
   const cols=180, rows=105, cellW=w/cols, cellH=h/rows;
   const shift = timeframes.indexOf(timeframe)*.6 + (market==='Perpetual'?2:0);
   const path = (x:number) => .66 - x*.36 + Math.sin(x*15+shift)*.073 + Math.sin(x*34)*.019;
   for(let y=0;y<rows;y++) {
    for(let x=0;x<cols;x++) {
     const r=random(y*713+x*3+Math.floor(shift));
     const distance=Math.abs(y/rows-path(x/cols));
     const bands=(y===18||y===39||y===73||y===91||y===57);
     let strength = r*.18 + (distance<.1?r*.35:0);
     if(bands && random(Math.floor(x/25)+y)>.24) strength=.50+random(y+x/35)*.45;
     if(y%13===0 && x>random(y)*100) strength+=.23;
     strength=Math.min(1,strength*intensity/65);
     context.globalAlpha = strength<.2?strength*1.7:.55+strength*.4;
     context.fillStyle=color(strength>.90?'--heat-hot':strength>.72?'--heat-high':strength>.48?'--heat-mid':'--heat-low');
     context.fillRect(x*cellW,y*cellH,cellW+.4,Math.max(1,cellH-1));
    }
   }
   context.globalAlpha=1;
   context.strokeStyle=color('--border'); context.lineWidth=.5;
   for(let i=0;i<5;i++){const x=w*i/4;context.beginPath();context.moveTo(x,0);context.lineTo(x,h);context.stroke();}
   context.fillStyle=color('--muted-foreground'); context.font='10px "IBM Plex Mono", monospace';
   const range=2400/zoom, top=87300-range*.1;
   for(let i=0;i<=10;i++) {const y=i*h/10; context.globalAlpha=.45; context.beginPath();context.moveTo(0,y);context.lineTo(w,y);context.stroke();context.globalAlpha=1;context.fillText((top-i*range/10).toFixed(0),w+profile+7,y+4);}
   for(let i=0;i<5;i++){context.textAlign=i===4?'right':i===0?'left':'center';context.fillText(labels[timeframe][i]??'',w*i/4,height-9);}
   context.textAlign='left';
   if(vwap) {context.strokeStyle=color('--analysis');context.setLineDash([4,5]);context.beginPath();for(let x=0;x<=w;x+=4){const y=h*(.62-x/w*.27);if(x===0)context.moveTo(x,y);else context.lineTo(x,y);}context.stroke();context.setLineDash([]);}
   context.strokeStyle=color('--heat-high');context.lineWidth=1;context.beginPath();
   for(let x=0;x<w;x+=2){const y=path(x/w)*h;if(x===0)context.moveTo(x,y);else context.lineTo(x,y);}context.stroke();
   if(bubbles) for(let i=0;i<160;i++){const x=(i/160)*w;const y=(path(i/160)+(random(i+300)-.5)*.048)*h;const buy=random(i+70)>.48;const radius=1.6+Math.pow(random(i+123),3)*(width<500?7:10);context.globalAlpha=.78;context.fillStyle=color(buy?'--positive':'--negative');context.beginPath();context.arc(x,y,radius,0,Math.PI*2);context.fill();context.globalAlpha=1;}
   for(let i=0;i<rows;i++){const size=(random(i+44)*.25+Math.exp(-Math.pow((i/rows-.38)*7,2))*.65)*profile;context.globalAlpha=.6;context.fillStyle=color(i/rows<path(1)?'--negative':'--positive');context.fillRect(w+profile-size,i*cellH,size,cellH-1);}context.globalAlpha=1;
   const lastY=path(1)*h;context.strokeStyle=color('--foreground');context.setLineDash([3,4]);context.beginPath();context.moveTo(0,lastY);context.lineTo(w+profile,lastY);context.stroke();context.setLineDash([]);
   context.fillStyle=color('--positive');context.fillRect(w+profile,lastY-10,gutter,20);context.fillStyle=color('--background');context.fillText((top-path(1)*range).toFixed(0),w+profile+7,lastY+4);
   for(let x=0;x<cols;x++){context.fillStyle=color(random(x+888)>.5?'--positive':'--negative');context.globalAlpha=.65;context.fillRect(x*cellW,h+4,Math.max(1,cellW-1),random(x+772)*17);}context.globalAlpha=1;
  };
  draw(); const observer=new ResizeObserver(draw); observer.observe(canvas);
  const animate=()=>{tick++;if(tick%120===0)draw();frame=requestAnimationFrame(animate);};if(playing)frame=requestAnimationFrame(animate);
  return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[timeframe,intensity,bubbles,vwap,market,zoom,playing]);
 return <div className="chart-area"><canvas ref={canvasRef} aria-label={`${market} liquidity heatmap, simulated ${timeframe} window`} onPointerMove={e=>{const rect=e.currentTarget.getBoundingClientRect();const y=(e.clientY-rect.top)/(rect.height-45);setHover({price:(87300-240/zoom-y*2400/zoom).toFixed(2),depth:(random(Math.floor(y*100))*72).toFixed(2),time:labels[timeframe][Math.min(4,Math.floor((e.clientX-rect.left)/rect.width*5))]??''});}} onPointerLeave={()=>setHover(null)} />{hover&&<div className="chart-tooltip"><div className="text-primary">SIMULATED OBSERVATION</div><div className="mt-2">Price {hover.price} USDT</div><div>Displayed depth {hover.depth} BTC</div><div>Window {timeframe} · {hover.time}</div></div>}</div>;
}
