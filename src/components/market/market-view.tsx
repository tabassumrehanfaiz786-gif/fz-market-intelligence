import { useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, Bitcoin, CircleHelp, Download, Expand, Layers, Pause, Play, Radio, Settings2, SlidersHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveFeedPanel } from '@/components/market/live-feed-panel';
import { LiquidityHeatmap, timeframes, type Timeframe } from '@/components/market/liquidity-heatmap';
import { useBinanceLive } from '@/lib/market/use-binance-live';
import { useKlines, klinesVwap } from '@/lib/market/use-klines';

const fmt = (n: number | null, d = 2) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));

export function MarketView({ initialMarket = 'Spot' }: { initialMarket?: string }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('4h');
  const [market, setMarket] = useState(initialMarket);
  const [intensity, setIntensity] = useState(65);
  const [bubbles, setBubbles] = useState(true);
  const [vwap, setVwap] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [notice, setNotice] = useState('');
  const [details, setDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const live = useBinanceLive(market);
  const { klines } = useKlines(market, timeframe);
  const liveNow = live.status === 'live';

  const bidVol = live.bids.reduce((a, l) => a + l[1], 0);
  const askVol = live.asks.reduce((a, l) => a + l[1], 0);
  const imbalance = bidVol + askVol ? ((bidVol - askVol) / (bidVol + askVol)) * 100 : null;
  const cvd = useMemo(() => live.trades.reduce((a, t) => a + (t.side === 'buy' ? t.qty : -t.qty), 0), [live.trades]);
  const vwapValue = useMemo(() => klinesVwap(klines), [klines]);

  // Session cumulative delta path from live trades (oldest → newest)
  const cvdPath = useMemo(() => {
    const ordered = [...live.trades].reverse();
    if (ordered.length < 2) return null;
    let acc = 0;
    const points = ordered.map((t) => (acc += t.side === 'buy' ? t.qty : -t.qty));
    const min = Math.min(...points, 0), max = Math.max(...points, 0);
    const span = max - min || 1;
    const coords = points.map((p, i) => `${((i / (points.length - 1)) * 600).toFixed(1)} ${(110 - ((p - min) / span) * 90).toFixed(1)}`);
    return { line: `M${coords.join('L')}`, fill: `M${coords.join('L')}V125H0Z`, up: points[points.length - 1]! >= 0 };
  }, [live.trades]);

  const levels = useMemo(() => {
    const asks = live.asks.slice(0, 2).map(([p, q]) => ({ price: p, bid: null as number | null, ask: q, side: 'Ask' }));
    const bids = live.bids.slice(0, 2).map(([p, q]) => ({ price: p, bid: q, ask: null as number | null, side: 'Bid' }));
    return [...asks.reverse(), ...bids];
  }, [live.bids, live.asks]);

  const exportData = () => {
    const rows = [
      'data_status,market,time_window,last_price,bid_depth_btc,ask_depth_btc,source',
      `live,BTCUSDT ${market},${timeframe},${live.price ?? ''},${bidVol.toFixed(4)},${askVol.toFixed(4)},Binance public stream (not recorded)`,
    ];
    const blob = new Blob([rows.join('\n') + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fz-market-live-snapshot.csv'; a.click(); URL.revokeObjectURL(url);
    setNotice('Live snapshot exported. Values are real-time Binance observations, not stored history.');
  };

  return (
    <main className="content">
      <div className="market-heading"><div className="min-w-0"><div className="eyebrow">Market intelligence / Liquidity</div><h1>Market liquidity</h1><p className="text-xs text-muted-foreground">Live order-book depth, executed trades & liquidity concentration.</p></div><Button variant="outline" size="sm" onClick={exportData} title="Export live snapshot"><Download /><span className="hidden sm:inline">Export</span></Button></div>
      <LiveFeedPanel market={market} />
      <div className="market-stats">
        <div className="market-stat"><div className="stat-label"><Bitcoin className="size-3 text-primary" />BTC / USDT <span className={`ml-auto data-badge ${liveNow ? 'live' : 'unavailable'}`}>{liveNow ? 'LIVE' : live.status.toUpperCase()}</span></div><div className="stat-value">{fmt(live.price)} <span className="text-[10px] text-muted-foreground">USDT</span></div><div className={`stat-foot ${(live.change24h ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>{live.change24h == null ? '—' : `${live.change24h >= 0 ? '+' : ''}${live.change24h.toFixed(2)}%`} <span className="text-muted-foreground">· 24h change</span></div></div>
        <div className="market-stat"><div className="stat-label">Displayed liquidity</div><div className="stat-value">{fmt(bidVol + askVol, 1)} <span className="text-[10px] text-muted-foreground">BTC</span></div><div className="stat-foot">Live top-20 resting depth</div></div>
        <div className="market-stat"><div className="stat-label">Bid / ask imbalance</div><div className={`stat-value ${(imbalance ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>{imbalance == null ? '—' : `${imbalance >= 0 ? '+' : ''}${imbalance.toFixed(2)}`}<span className="text-sm">%</span></div><div className="stat-foot">Live order book</div></div>
        <div className="market-stat"><div className="stat-label">Session delta</div><div className={`stat-value ${cvd >= 0 ? 'text-positive' : 'text-negative'}`}>{cvd >= 0 ? '+' : ''}{cvd.toFixed(2)}</div><div className="stat-foot">BTC · live trades this session</div></div>
        <div className="market-stat"><div className="stat-label">VWAP</div><div className="stat-value text-analysis">{fmt(vwapValue)}</div><div className="stat-foot">USDT · {timeframe} candles</div></div>
      </div>
      {details && <section className="mb-5 border-y border-border py-4"><h2 className="font-medium text-sm">Data & methodology</h2><p className="mt-2 text-xs text-muted-foreground leading-6">All values on this page are real market data from the public Binance BTCUSDT stream (spot or USDⓈ-M perpetual): candles via the public REST API, trades and top-20 order-book depth via websocket. Depth history is recorded only while this page is open and is not stored. Single-venue data; funding, open interest and full historical depth are unavailable.</p></section>}
      <section className="chart-panel" ref={(el) => { if (el && expanded) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }}>
        <div className="chart-toolbar"><div className="flex items-center gap-2"><select className="market-select" aria-label="Market pair"><option>BTC / USDT</option></select><div className="flex gap-1 border-l border-border pl-2">{['Spot', 'Perpetual'].map((m) => <Button key={m} variant="terminal" size="sm" data-active={market === m} onClick={() => setMarket(m)}>{m}</Button>)}</div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" title="Chart settings" className="text-muted-foreground h-7 w-7" onClick={() => setShowControls((s) => !s)}><Settings2 /></Button><Button variant="ghost" size="icon" title={expanded ? 'Exit fullscreen' : 'Expand chart'} className="text-muted-foreground h-7 w-7" onClick={() => { const panel = document.querySelector('.chart-panel'); if (!document.fullscreenElement) { panel?.requestFullscreen?.().then(() => setExpanded(true)).catch(() => setNotice('Fullscreen is unavailable in this preview.')); } else { document.exitFullscreen().then(() => setExpanded(false)); } }}><Expand /></Button></div></div>
        <div className="chart-toolbar"><div className="timeframe-row"><span className="text-[10px] text-muted-foreground mr-2 hidden lg:inline">TIMEFRAME</span>{timeframes.map((t) => <Button key={t} variant="terminal" data-active={timeframe === t} aria-pressed={timeframe === t} onClick={() => setTimeframe(t)}>{t}</Button>)}</div><div className="flex items-center gap-2"><Button variant="terminal" size="sm" data-active={!playing} onClick={() => setPlaying((s) => !s)}>{playing ? <Pause className="size-3" /> : <Play className="size-3" />}{playing ? 'Pause' : 'Resume'}</Button><span className={`data-badge ${liveNow ? 'live' : 'unavailable'}`}>{liveNow ? 'LIVE' : live.status.toUpperCase()}</span></div></div>
        <div className="chart-subbar"><div className="flex items-center gap-2"><span className="font-medium">BTCUSDT</span><span className="text-muted-foreground">· {market} · {timeframe}</span><span className="text-positive border border-positive/25 bg-positive/5 rounded px-1.5 py-0.5 text-[9px]">LIVE · BINANCE</span></div>{showControls && <div className="flex flex-wrap gap-3"><label className="control-label"><input type="checkbox" checked={bubbles} onChange={(e) => setBubbles(e.target.checked)} />Trades</label><label className="control-label"><input type="checkbox" checked={vwap} onChange={(e) => setVwap(e.target.checked)} />VWAP</label><label className="control-label"><SlidersHorizontal className="size-3" />Intensity<input aria-label="Heatmap intensity" type="range" min="25" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /></label></div>}</div>
        <LiquidityHeatmap timeframe={timeframe} market={market} intensity={intensity} bubbles={bubbles} vwap={vwap} zoom={zoom} playing={playing} />
        <div className="chart-footer"><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-positive" />Buy trades</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-negative" />Sell trades</span><span className="flex items-center gap-1.5 text-analysis">— VWAP</span></div><div className="flex items-center gap-2"><span>Price range</span><Button variant="ghost" size="icon" className="h-5 w-5" title="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.25))}><ZoomOut /></Button><span className="font-mono">{zoom.toFixed(2)}×</span><Button variant="ghost" size="icon" className="h-5 w-5" title="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + 0.25))}><ZoomIn /></Button></div></div>
      </section>
      <div className="lower-grid">
        <section><h2 className="section-title"><span className="flex items-center gap-2"><Activity className="size-3.5 text-positive" />Session volume delta <span className="text-muted-foreground text-[9px]">LIVE · THIS SESSION</span></span><span className={`font-mono text-[11px] ${cvd >= 0 ? 'text-positive' : 'text-negative'}`}>{cvd >= 0 ? '+' : ''}{cvd.toFixed(2)} BTC</span></h2><div className="delta-chart">{cvdPath ? <svg viewBox="0 0 600 125" preserveAspectRatio="none" aria-label="Live session cumulative volume delta"><path className="delta-grid" d="M0 30H600 M0 60H600 M0 90H600 M100 0V125 M200 0V125 M300 0V125 M400 0V125 M500 0V125" /><path className="delta-fill" d={cvdPath.fill} /><path className="delta-line" d={cvdPath.line} /></svg> : <div className="text-muted-foreground text-[11px] py-8 text-center">Accumulating live trades…</div>}</div><div className="flex justify-between mt-2 font-mono text-[9px] text-muted-foreground"><span>Session start</span><span>{timeframe} · live trade flow</span><span>Now</span></div></section>
        <section><h2 className="section-title"><span className="flex items-center gap-2"><Layers className="size-3.5 text-primary" />Liquidity levels</span><span className="text-[9px] text-muted-foreground">LIVE · BTC</span></h2><table className="depth-table"><thead><tr><th>Price (USDT)</th><th>Bid depth</th><th>Ask depth</th><th>Side</th></tr></thead><tbody>{levels.map((row) => <tr key={row.price}><td>{fmt(row.price)}</td><td className="text-positive">{row.bid == null ? '—' : row.bid.toFixed(2)}</td><td className="text-negative">{row.ask == null ? '—' : row.ask.toFixed(2)}</td><td className={row.side === 'Bid' ? 'text-positive' : 'text-negative'}><span className="inline-flex items-center gap-1">{row.side === 'Bid' ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}{row.side}</span></td></tr>)}{!levels.length && <tr><td colSpan={4} className="text-center text-muted-foreground py-4">Waiting for live depth…</td></tr>}</tbody></table></section>
      </div>
      <div className="simulation-note"><Radio className="size-3.5 shrink-0 text-positive" /><span>Live mode. Prices, trades and order-book depth stream from Binance in real time. Depth history is recorded only while this page is open; funding and open interest are unavailable.</span><Button variant="ghost" className="h-5 w-5 p-0 shrink-0" title="Data methodology" onClick={() => setDetails((s) => !s)}><CircleHelp className="size-3" /></Button></div>
      {notice && <div role="status" className="mt-3 flex items-center justify-between border border-border bg-secondary p-3 rounded text-xs"><span>{notice}</span><Button variant="ghost" size="sm" onClick={() => setNotice('')}>Dismiss</Button></div>}
    </main>
  );
}
