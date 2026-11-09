import { useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Activity, ArrowDownLeft, ArrowUpRight, Bitcoin, CircleHelp, Download, Expand, Layers, Pause, Play, Radio, RotateCcw, Settings2, SlidersHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiquidityHeatmap, timeframes, type Timeframe } from '@/components/market/liquidity-heatmap';
import { useBinanceLive } from '@/lib/market/use-binance-live';
import { useKlines, klinesVwap } from '@/lib/market/use-klines';

const fmt = (n: number | null, d = 2) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
const ranges = [{ label: '30', value: 30 }, { label: '60', value: 60 }, { label: '120', value: 120 }, { label: 'All', value: 0 }];

export function MarketView({ initialMarket = 'Spot' }: { initialMarket?: string }) {
  const market = initialMarket === 'Perpetual' ? 'Perpetual' : 'Spot';
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [intensity, setIntensity] = useState(65);
  const [bubbles, setBubbles] = useState(true);
  const [candles, setCandles] = useState(true);
  const [vwap, setVwap] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [visibleCount, setVisibleCount] = useState(60);
  const [timeResetKey, setTimeResetKey] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [minTrade, setMinTrade] = useState(0);
  const [bubbleScale, setBubbleScale] = useState(1);
  const [notice, setNotice] = useState('');
  const [details, setDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const panelRef = useRef<HTMLElement>(null);

  const live = useBinanceLive(market);
  const { klines, status: candleStatus, source: candleSource, pair: candlePair } = useKlines(market, timeframe);
  const liveNow = live.status === 'live';
  const source = live.source ?? 'Connecting';
  const displayPair = live.source === 'Coinbase' || (!live.source && candlePair === 'BTC-USD') ? 'BTC / USD' : 'BTC / USDT';

  const bidVol = live.bids.reduce((a, l) => a + l[1], 0);
  const askVol = live.asks.reduce((a, l) => a + l[1], 0);
  const imbalance = bidVol + askVol ? ((bidVol - askVol) / (bidVol + askVol)) * 100 : null;
  const cvd = useMemo(() => live.trades.reduce((a, t) => a + (t.side === 'buy' ? t.qty : -t.qty), 0), [live.trades]);
  const vwapValue = useMemo(() => klinesVwap(klines), [klines]);

  const cvdPath = useMemo(() => {
    const ordered = [...live.trades].reverse();
    if (ordered.length < 2) return null;
    let acc = 0;
    const points = ordered.map((t) => (acc += t.side === 'buy' ? t.qty : -t.qty));
    const min = Math.min(...points, 0), max = Math.max(...points, 0);
    const span = max - min || 1;
    const coords = points.map((p, i) => `${((i / (points.length - 1)) * 600).toFixed(1)} ${(110 - ((p - min) / span) * 90).toFixed(1)}`);
    return { line: `M${coords.join('L')}`, fill: `M${coords.join('L')}V125H0Z` };
  }, [live.trades]);

  const levels = useMemo(() => {
    const asks = live.asks.slice(0, 2).map(([p, q]) => ({ price: p, bid: null as number | null, ask: q, side: 'Ask' }));
    const bids = live.bids.slice(0, 2).map(([p, q]) => ({ price: p, bid: q, ask: null as number | null, side: 'Bid' }));
    return [...asks.reverse(), ...bids];
  }, [live.bids, live.asks]);

  const exportData = () => {
    const rows = [
      'data_status,market,time_window,last_price,bid_depth_btc,ask_depth_btc,stream_source,candle_source',
      `${live.status},${displayPair} ${market},${timeframe},${live.price ?? ''},${bidVol.toFixed(4)},${askVol.toFixed(4)},${source},${candleSource ?? 'unavailable'}`,
    ];
    const blob = new Blob([rows.join('\n') + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fz-${market.toLowerCase()}-live-snapshot.csv`; a.click(); URL.revokeObjectURL(url);
    setNotice(`Snapshot exported (${live.status}). Session observations only; not stored exchange history.`);
  };

  const resetView = () => { setZoom(1); setVisibleCount(60); setResetKey((key) => key + 1); };
  const selectTimeframe = (value: Timeframe) => { setTimeframe(value); setTimeResetKey((key) => key + 1); };
  const selectRange = (value: number) => { setVisibleCount(value); setTimeResetKey((key) => key + 1); };

  return (
    <main className="content bookmap-workspace">
      <div className="market-heading">
        <div className="min-w-0"><div className="eyebrow">Market microstructure / {market}</div><h1>{market} liquidity heatmap</h1><p className="text-xs text-muted-foreground">Bookmap-style session depth, real candles and executed-trade bubbles.</p></div>
        <Button variant="outline" size="sm" onClick={exportData} title="Export live snapshot"><Download /><span className="hidden sm:inline">Export</span></Button>
      </div>

      <div className="market-stats bookmap-stats">
        <div className="market-stat"><div className="stat-label"><Bitcoin className="size-3 text-primary" />{displayPair}<span className={`ml-auto data-badge ${liveNow ? 'live' : 'unavailable'}`}>{liveNow ? `LIVE · ${source.toUpperCase()}` : live.status.toUpperCase()}</span></div><div className="stat-value">{fmt(live.price)} <span className="text-[10px] text-muted-foreground">{displayPair.endsWith('USD') && !displayPair.endsWith('USDT') ? 'USD' : 'USDT'}</span></div><div className={`stat-foot ${(live.change24h ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>{live.change24h == null ? '—' : `${live.change24h >= 0 ? '+' : ''}${live.change24h.toFixed(2)}%`} <span className="text-muted-foreground">· 24h change</span></div></div>
        <div className="market-stat"><div className="stat-label">Displayed liquidity</div><div className="stat-value">{fmt(bidVol + askVol, 1)} <span className="text-[10px] text-muted-foreground">BTC</span></div><div className="stat-foot">Live top-20 resting depth</div></div>
        <div className="market-stat"><div className="stat-label">Bid / ask imbalance</div><div className={`stat-value ${(imbalance ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>{imbalance == null ? '—' : `${imbalance >= 0 ? '+' : ''}${imbalance.toFixed(2)}`}<span className="text-sm">%</span></div><div className="stat-foot">Live order book</div></div>
        <div className="market-stat"><div className="stat-label">Session delta</div><div className={`stat-value ${cvd >= 0 ? 'text-positive' : 'text-negative'}`}>{cvd >= 0 ? '+' : ''}{cvd.toFixed(2)}</div><div className="stat-foot">BTC · latest live trade window</div></div>
        <div className="market-stat"><div className="stat-label">VWAP</div><div className="stat-value text-analysis">{fmt(vwapValue)}</div><div className="stat-foot">{timeframe} candles · {candleSource ?? candleStatus.toUpperCase()}</div></div>
      </div>

      {details && <section className="mb-4 border-y border-border py-4"><h2 className="font-medium text-sm">Data & interaction methodology</h2><p className="mt-2 text-xs text-muted-foreground leading-6">Candles come from real public exchange APIs; trades and top-20 depth come from the active public stream shown above. Depth and trade history accumulate only while this page is open, with up to 30 minutes of depth and 1,500 recent executions retained in memory. Empty areas are unrecorded—not zero liquidity. Wheel zooms price, Shift+wheel zooms time, dragging pans, and two-finger pinch zooms price. Funding, open interest and historical exchange depth are not supplied.</p></section>}

      <section className="chart-panel bookmap-panel" ref={panelRef}>
        <div className="chart-toolbar bookmap-primary-toolbar">
          <div className="flex items-center gap-2 min-w-0"><span className="bookmap-product">{displayPair}</span><div className="flex gap-1 border-l border-border pl-2">{['Spot', 'Perpetual'].map((item) => <Button key={item} variant="terminal" size="sm" data-active={market === item} asChild><Link to={item === 'Spot' ? '/spot' : '/perpetual'}>{item}</Link></Button>)}</div></div>
          <div className="flex items-center gap-1"><Button variant="ghost" size="sm" title="Reset price and time view" onClick={resetView}><RotateCcw /><span className="hidden md:inline">Reset</span></Button><Button variant="ghost" size="icon" title="Chart settings" className="text-muted-foreground h-7 w-7" onClick={() => setShowControls((s) => !s)}><Settings2 /></Button><Button variant="ghost" size="icon" title={expanded ? 'Exit fullscreen' : 'Expand chart'} className="text-muted-foreground h-7 w-7" onClick={() => { const panel = panelRef.current; if (!document.fullscreenElement) { panel?.requestFullscreen?.().then(() => setExpanded(true)).catch(() => setNotice('Fullscreen is unavailable in this preview.')); } else { document.exitFullscreen().then(() => setExpanded(false)); } }}><Expand /></Button></div>
        </div>

        <div className="chart-toolbar bookmap-time-toolbar">
          <div className="timeframe-row" aria-label="Candle timeframe"><span className="toolbar-caption">TIMEFRAME</span>{timeframes.map((t) => <Button key={t} variant="terminal" data-active={timeframe === t} aria-pressed={timeframe === t} onClick={() => selectTimeframe(t)}>{t}</Button>)}</div>
          <Button variant="terminal" size="sm" data-active={!playing} title="Pause or resume live depth recording" onClick={() => setPlaying((s) => !s)}>{playing ? <Pause className="size-3" /> : <Play className="size-3" />}{playing ? 'Pause depth' : 'Resume depth'}</Button>
        </div>

        <div className="chart-subbar bookmap-rangebar">
          <div className="range-control"><span className="toolbar-caption">RANGE</span>{ranges.map((range) => <Button key={range.label} variant="terminal" size="sm" data-active={visibleCount === range.value} onClick={() => selectRange(range.value)}>{range.label}</Button>)}<span className="range-unit">candles</span></div>
          <div className="price-zoom-control"><span className="toolbar-caption">PRICE ZOOM</span><Button variant="ghost" size="icon" className="h-6 w-6" title="Zoom price out" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value / 1.25))}><ZoomOut /></Button><span className="font-mono">{zoom.toFixed(2)}×</span><Button variant="ghost" size="icon" className="h-6 w-6" title="Zoom price in" disabled={zoom >= 12} onClick={() => setZoom((value) => Math.min(12, value * 1.25))}><ZoomIn /></Button></div>
        </div>

        {showControls && <div className="bookmap-controls">
          <label className="control-label"><input type="checkbox" checked={candles} onChange={(e) => setCandles(e.target.checked)} />Candles</label>
          <label className="control-label"><input type="checkbox" checked={bubbles} onChange={(e) => setBubbles(e.target.checked)} />Trade bubbles</label>
          <label className="control-label"><input type="checkbox" checked={vwap} onChange={(e) => setVwap(e.target.checked)} />VWAP</label>
          <label className="control-label">Min trade<select aria-label="Minimum trade bubble size" className="bookmap-select" value={minTrade} onChange={(e) => setMinTrade(Number(e.target.value))}><option value={0}>All</option><option value={0.01}>0.01 BTC</option><option value={0.1}>0.10 BTC</option><option value={0.5}>0.50 BTC</option><option value={1}>1.00 BTC</option></select></label>
          <label className="control-label"><SlidersHorizontal className="size-3" />Heat<input aria-label="Heatmap intensity" type="range" min="25" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /></label>
          <label className="control-label">Bubble size<input aria-label="Trade bubble scale" type="range" min="0.6" max="2" step="0.1" value={bubbleScale} onChange={(e) => setBubbleScale(Number(e.target.value))} /></label>
          <span className="bookmap-source">CANDLES {candleSource?.toUpperCase() ?? candleStatus.toUpperCase()} · STREAM {source.toUpperCase()}</span>
        </div>}

        <LiquidityHeatmap timeframe={timeframe} market={market} intensity={intensity} bubbles={bubbles} candles={candles} vwap={vwap} zoom={zoom} onZoomChange={setZoom} visibleCount={visibleCount} onVisibleCountChange={setVisibleCount} timeResetKey={timeResetKey} resetKey={resetKey} playing={playing} minTrade={minTrade} bubbleScale={bubbleScale} />
        <div className="chart-footer bookmap-legend"><div className="flex items-center gap-4 flex-wrap"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-positive" />Buy executions</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-negative" />Sell executions</span><span className="heat-legend"><i />Resting depth intensity</span><span className="text-analysis">— VWAP</span></div><span>SESSION DEPTH · NOT HISTORICAL ORDER-BOOK REPLAY</span></div>
      </section>

      <div className="lower-grid bookmap-lower-grid">
        <section><h2 className="section-title"><span className="flex items-center gap-2"><Activity className="size-3.5 text-positive" />Session volume delta <span className="text-muted-foreground text-[9px]">LIVE · LATEST TRADES</span></span><span className={`font-mono text-[11px] ${cvd >= 0 ? 'text-positive' : 'text-negative'}`}>{cvd >= 0 ? '+' : ''}{cvd.toFixed(2)} BTC</span></h2><div className="delta-chart">{cvdPath ? <svg viewBox="0 0 600 125" preserveAspectRatio="none" aria-label="Live session cumulative volume delta"><path className="delta-grid" d="M0 30H600 M0 60H600 M0 90H600 M100 0V125 M200 0V125 M300 0V125 M400 0V125 M500 0V125" /><path className="delta-fill" d={cvdPath.fill} /><path className="delta-line" d={cvdPath.line} /></svg> : <div className="text-muted-foreground text-[11px] py-8 text-center">Accumulating live trades…</div>}</div></section>
        <section><h2 className="section-title"><span className="flex items-center gap-2"><Layers className="size-3.5 text-primary" />Best liquidity levels</span><span className="text-[9px] text-muted-foreground">{source.toUpperCase()}</span></h2><table className="depth-table"><thead><tr><th>Price</th><th>Bid depth</th><th>Ask depth</th><th>Side</th></tr></thead><tbody>{levels.map((row) => <tr key={row.price}><td>{fmt(row.price)}</td><td className="text-positive">{row.bid == null ? '—' : row.bid.toFixed(2)}</td><td className="text-negative">{row.ask == null ? '—' : row.ask.toFixed(2)}</td><td className={row.side === 'Bid' ? 'text-positive' : 'text-negative'}><span className="inline-flex items-center gap-1">{row.side === 'Bid' ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}{row.side}</span></td></tr>)}{!levels.length && <tr><td colSpan={4} className="text-center text-muted-foreground py-4">Waiting for live depth…</td></tr>}</tbody></table></section>
      </div>
      <div className="simulation-note"><Radio className="size-3.5 shrink-0 text-positive" /><span>Real public market data only. Heatmap depth begins recording when you open this workspace; blank areas mean no session coverage, not zero liquidity.</span><Button variant="ghost" className="h-5 w-5 p-0 shrink-0" title="Data methodology" onClick={() => setDetails((s) => !s)}><CircleHelp className="size-3" /></Button></div>
      {notice && <div role="status" className="mt-3 flex items-center justify-between border border-border bg-secondary p-3 rounded text-xs"><span>{notice}</span><Button variant="ghost" size="sm" onClick={() => setNotice('')}>Dismiss</Button></div>}
    </main>
  );
}
