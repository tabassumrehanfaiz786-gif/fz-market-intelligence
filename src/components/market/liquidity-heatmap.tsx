import { useEffect, useRef, useState } from 'react';
import { useBinanceLive, type LiveState, type LiveTrade } from '@/lib/market/use-binance-live';
import { useKlines, klinesVwap, type Kline } from '@/lib/market/use-klines';
import { clamp, panPrice, visibleTimeWindow, zoomPriceAt, zoomTimeAt, type PriceView } from '@/lib/market/bookmap-math';

export const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M', '6M', '1Y'] as const;
export type Timeframe = typeof timeframes[number];

type DepthSnapshot = { t: number; levels: [number, number][] };
type Hover = { x: number; y: number; price: number; time: number };
type Geometry = { w: number; h: number; min: number; max: number; center: number; range: number; t0: number; t1: number; count: number; total: number };

type Props = {
  timeframe: Timeframe;
  intensity: number;
  bubbles: boolean;
  candles: boolean;
  vwap: boolean;
  market: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  visibleCount: number;
  onVisibleCountChange: (count: number) => void;
  timeResetKey: number;
  resetKey: number;
  playing: boolean;
  minTrade: number;
  bubbleScale: number;
};

function timeLabel(t: number, timeframe: string, withDate = false) {
  const d = new Date(t);
  if (withDate || !['1m', '5m', '15m', '30m', '1h', '4h'].includes(timeframe)) {
    return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`;
  }
  return d.toISOString().slice(11, 16);
}

function candleDuration(klines: Kline[]) {
  if (klines.length < 2) return 60000;
  const differences = klines.slice(1).map((k, i) => k.time - klines[i]!.time).filter((d) => d > 0).sort((a, b) => a - b);
  return differences[Math.floor(differences.length / 2)] ?? 60000;
}

/** Real candles plus depth and executions recorded from the live stream during this browser session. */
export function LiquidityHeatmap(props: Props) {
  const { timeframe, market, visibleCount, zoom } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const live = useBinanceLive(market);
  const { klines, status: candleStatus, updatedAt, source: candleSource, pair: candlePair } = useKlines(market, timeframe);
  const snapshotsRef = useRef<DepthSnapshot[]>([]);
  const tradeHistoryRef = useRef<LiveTrade[]>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const latestRef = useRef({ props, live, klines, candleStatus, updatedAt, candleSource, candlePair });
  const priceViewRef = useRef<PriceView>({ zoom: 1, pan: 0 });
  const timeOffsetRef = useRef(0);
  const geometryRef = useRef<Geometry | null>(null);
  const hoverRef = useRef<Hover | null>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  latestRef.current = { props, live, klines, candleStatus, updatedAt, candleSource, candlePair };
  hoverRef.current = hover;

  useEffect(() => {
    snapshotsRef.current = [];
    tradeHistoryRef.current = [];
    sessionStartRef.current = Date.now();
    timeOffsetRef.current = 0;
    priceViewRef.current = { zoom: 1, pan: 0 };
    setHover(null);
  }, [market]);

  useEffect(() => { timeOffsetRef.current = 0; }, [timeframe, props.timeResetKey]);
  useEffect(() => {
    priceViewRef.current = { zoom: 1, pan: 0 };
    timeOffsetRef.current = 0;
  }, [props.resetKey]);
  useEffect(() => {
    if (Math.abs(priceViewRef.current.zoom - zoom) > 0.0001) {
      priceViewRef.current = zoomPriceAt(priceViewRef.current, zoom, 0.5);
    }
  }, [zoom]);

  // One depth snapshot per second, retained for up to thirty minutes. No historical depth is invented.
  useEffect(() => {
    if (live.status !== 'live' || !props.playing || (!live.bids.length && !live.asks.length)) return;
    const levels: [number, number][] = [
      ...live.bids.map(([p, q]) => [p, q] as [number, number]),
      ...live.asks.map(([p, q]) => [p, -q] as [number, number]),
    ];
    const t = live.lastUpdate ?? Date.now();
    const snaps = snapshotsRef.current;
    const previous = snaps.at(-1);
    if (previous && t - previous.t < 1000) snaps[snaps.length - 1] = { t, levels };
    else snaps.push({ t, levels });
    if (snaps.length > 1800) snaps.splice(0, snaps.length - 1800);
  }, [live.bids, live.asks, live.status, live.lastUpdate, props.playing]);

  // Build a bounded session trade tape so bubbles do not disappear when the shared feed trims its latest trades.
  useEffect(() => {
    if (!live.trades.length) return;
    const merged = new Map<string, LiveTrade>();
    for (const trade of [...live.trades, ...tradeHistoryRef.current]) merged.set(`${trade.id}:${trade.time}`, trade);
    tradeHistoryRef.current = [...merged.values()].sort((a, b) => b.time - a.time).slice(0, 1500);
  }, [live.trades]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const geometry = geometryRef.current;
      if (!geometry || rect.width <= 0 || rect.height <= 0) return;
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const current = latestRef.current.props;
      if (event.shiftKey) {
        const count = current.visibleCount || geometry.total;
        const nextCount = clamp(Math.round(count * Math.exp(dy * 0.0015)), 10, Math.max(10, geometry.total));
        const next = zoomTimeAt(geometry.total, count, timeOffsetRef.current, nextCount, px / geometry.w);
        timeOffsetRef.current = next.offset;
        current.onVisibleCountChange(next.count >= geometry.total ? 0 : next.count);
      } else {
        const nextZoom = clamp(priceViewRef.current.zoom * Math.exp(-dy * 0.0015), 1, 12);
        priceViewRef.current = zoomPriceAt(priceViewRef.current, nextZoom, py / geometry.h);
        current.onZoomChange(nextZoom);
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let disposed = false;
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string) => styles.getPropertyValue(name).trim();

    const draw = () => {
      if (disposed) return;
      const { props: current, live: feed, klines: allKlines, candleStatus: status, updatedAt: candleTime, candleSource: candlesFrom, candlePair } = latestRef.current;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.globalAlpha = 1;
      context.fillStyle = color('--chart-bg');
      context.fillRect(0, 0, width, height);
      context.font = '10px "IBM Plex Mono", monospace';

      if (!allKlines.length) {
        context.fillStyle = color('--muted-foreground');
        context.fillText(status === 'unavailable' ? 'Real exchange candles unavailable — retrying…' : 'Loading real exchange candles…', 16, 26);
        geometryRef.current = null;
        return;
      }

      const gutter = width < 500 ? 62 : 78;
      const profile = width < 500 ? 34 : 68;
      const w = Math.max(50, width - gutter - profile);
      const h = Math.max(80, height - 63);
      const window = visibleTimeWindow(allKlines.length, current.visibleCount, timeOffsetRef.current);
      timeOffsetRef.current = window.offset;
      const visible = allKlines.slice(window.start, window.end);
      if (!visible.length) return;

      let baseMin = Infinity, baseMax = -Infinity;
      for (const k of visible) { baseMin = Math.min(baseMin, k.low); baseMax = Math.max(baseMax, k.high); }
      const basePad = (baseMax - baseMin) * 0.09 || Math.max(1, baseMax * 0.001);
      baseMin -= basePad;
      baseMax += basePad;
      const baseRange = baseMax - baseMin;
      const baseMid = (baseMin + baseMax) / 2;
      const view = priceViewRef.current;
      const range = baseRange / view.zoom;
      const center = baseMid + view.pan * baseRange;
      const min = center - range / 2;
      const max = center + range / 2;
      const duration = candleDuration(allKlines);
      const t0 = visible[0]!.time;
      const t1 = visible.at(-1)!.time + duration;
      const span = Math.max(1, t1 - t0);
      const yOf = (price: number) => h - ((price - min) / range) * h;
      const xOf = (time: number) => ((time - t0) / span) * w;
      geometryRef.current = { w, h, min, max, center, range, t0, t1, count: window.count, total: allKlines.length };

      // Grid and axes.
      context.strokeStyle = color('--border');
      context.fillStyle = color('--muted-foreground');
      context.lineWidth = 0.5;
      for (let i = 0; i <= 10; i++) {
        const y = (i * h) / 10;
        const price = max - (i / 10) * range;
        context.globalAlpha = 0.38;
        context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke();
        context.globalAlpha = 1;
        context.fillText(price.toFixed(price < 1000 ? 2 : 0), w + profile + 7, y + 3);
      }
      for (let i = 0; i < 5; i++) {
        const x = (w * i) / 4;
        context.globalAlpha = 0.25;
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, h); context.stroke();
        context.globalAlpha = 1;
        const time = t0 + (span * i) / 4;
        context.textAlign = i === 4 ? 'right' : i === 0 ? 'left' : 'center';
        context.fillText(timeLabel(time, current.timeframe), x, height - 8);
      }
      context.textAlign = 'left';

      // Session-only order-book heatmap aligned to exchange timestamps.
      const snaps = snapshotsRef.current.filter((s) => s.t >= t0 && s.t <= t1);
      if (snaps.length) {
        const quantities: number[] = [];
        for (const snap of snaps) for (const level of snap.levels) quantities.push(Math.abs(level[1]));
        quantities.sort((a, b) => a - b);
        const referenceQ = Math.max(1e-9, quantities[Math.floor(quantities.length * 0.95)] ?? 1);
        const rows = 120, cellH = h / rows;
        snaps.forEach((snap, index) => {
          const x = xOf(snap.t);
          const nextX = index + 1 < snaps.length ? xOf(snaps[index + 1]!.t) : x + Math.max(2, w / 180);
          const colW = clamp(nextX - x, 1.5, Math.max(2, w / 180));
          if (x + colW < 0 || x > w) return;
          for (const [price, signedQ] of snap.levels) {
            const y = yOf(price);
            if (y < -cellH || y > h + cellH) continue;
            const strength = clamp(Math.pow(Math.abs(signedQ) / referenceQ, 0.55) * (current.intensity / 65), 0, 1);
            context.globalAlpha = 0.12 + strength * 0.82;
            context.fillStyle = color(strength > 0.88 ? '--heat-hot' : strength > 0.65 ? '--heat-high' : strength > 0.35 ? '--heat-mid' : '--heat-low');
            context.fillRect(x, y - cellH / 2, colW + 0.5, Math.max(1, cellH - 0.35));
          }
        });
        context.globalAlpha = 1;
      }

      // Close trace and optional real candlesticks.
      context.strokeStyle = color('--foreground');
      context.lineWidth = 1;
      context.globalAlpha = current.candles ? 0.28 : 0.75;
      context.beginPath();
      visible.forEach((k, i) => {
        const x = ((i + 0.5) / visible.length) * w, y = yOf(k.close);
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.stroke();
      context.globalAlpha = 1;
      if (current.candles) {
        const candleW = clamp((w / visible.length) * 0.58, 1, 7);
        visible.forEach((k, i) => {
          const x = ((i + 0.5) / visible.length) * w;
          context.strokeStyle = color(k.close >= k.open ? '--positive' : '--negative');
          context.fillStyle = color(k.close >= k.open ? '--positive' : '--negative');
          context.globalAlpha = 0.72;
          context.beginPath(); context.moveTo(x, yOf(k.high)); context.lineTo(x, yOf(k.low)); context.stroke();
          const top = yOf(Math.max(k.open, k.close)), bottom = yOf(Math.min(k.open, k.close));
          context.fillRect(x - candleW / 2, top, candleW, Math.max(1, bottom - top));
        });
        context.globalAlpha = 1;
      }

      if (current.vwap) {
        const value = klinesVwap(visible);
        if (value != null && value > min && value < max) {
          context.strokeStyle = color('--analysis');
          context.setLineDash([5, 5]);
          context.beginPath(); context.moveTo(0, yOf(value)); context.lineTo(w, yOf(value)); context.stroke();
          context.setLineDash([]);
          context.fillStyle = color('--analysis');
          context.fillText('VWAP', 6, yOf(value) - 5);
        }
      }

      // Real executed trades recorded this session.
      if (current.bubbles) {
        const trades = tradeHistoryRef.current.filter((t) => t.time >= t0 && t.time <= t1 && t.qty >= current.minTrade);
        const maxQty = Math.max(1e-9, ...trades.map((t) => t.qty));
        for (const trade of trades) {
          const x = xOf(trade.time), y = yOf(trade.price);
          if (x < 0 || x > w || y < 0 || y > h) continue;
          const radius = (1.8 + Math.sqrt(trade.qty / maxQty) * (width < 500 ? 7 : 11)) * current.bubbleScale;
          context.globalAlpha = 0.76;
          context.fillStyle = color(trade.side === 'buy' ? '--positive' : '--negative');
          context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
          context.globalAlpha = 0.9;
          context.strokeStyle = color('--chart-bg');
          context.lineWidth = 0.7; context.stroke();
        }
        context.globalAlpha = 1;
      }

      // Current resting-depth profile.
      const bookMax = Math.max(1e-9, ...feed.bids.map((l) => l[1]), ...feed.asks.map((l) => l[1]));
      const profileRows = 120, profileCellH = h / profileRows;
      for (const [side, levels] of [['bid', feed.bids], ['ask', feed.asks]] as const) {
        for (const [price, quantity] of levels) {
          const y = yOf(price);
          if (y < 0 || y > h) continue;
          const size = (quantity / bookMax) * profile;
          context.globalAlpha = 0.58;
          context.fillStyle = color(side === 'bid' ? '--positive' : '--negative');
          context.fillRect(w + profile - size, y - profileCellH / 2, size, Math.max(1, profileCellH - 0.7));
        }
      }
      context.globalAlpha = 1;

      // Latest real price and candle volume.
      const last = feed.price ?? visible.at(-1)!.close;
      const lastY = clamp(yOf(last), 0, h);
      context.strokeStyle = color('--foreground');
      context.setLineDash([3, 4]);
      context.beginPath(); context.moveTo(0, lastY); context.lineTo(w + profile, lastY); context.stroke();
      context.setLineDash([]);
      context.fillStyle = color(last >= visible.at(-1)!.open ? '--positive' : '--negative');
      context.fillRect(w + profile, lastY - 10, gutter, 20);
      context.fillStyle = color('--background');
      context.fillText(last.toFixed(last < 1000 ? 2 : 0), w + profile + 7, lastY + 3);

      const maxVol = Math.max(1e-9, ...visible.map((k) => k.volume));
      visible.forEach((k, i) => {
        context.fillStyle = color(k.close >= k.open ? '--positive' : '--negative');
        context.globalAlpha = 0.48;
        const x = (i / visible.length) * w;
        context.fillRect(x, h + 7, Math.max(1, w / visible.length - 0.8), (k.volume / maxVol) * 20);
      });
      context.globalAlpha = 1;

      // Crosshair and axis values.
      const crosshair = hoverRef.current;
      if (crosshair && crosshair.x >= 0 && crosshair.x <= w && crosshair.y >= 0 && crosshair.y <= h) {
        context.strokeStyle = color('--muted-foreground');
        context.setLineDash([2, 3]);
        context.beginPath(); context.moveTo(crosshair.x, 0); context.lineTo(crosshair.x, h); context.moveTo(0, crosshair.y); context.lineTo(w + profile, crosshair.y); context.stroke();
        context.setLineDash([]);
        context.fillStyle = color('--secondary');
        context.fillRect(w + profile, crosshair.y - 9, gutter, 18);
        context.fillStyle = color('--foreground');
        context.fillText(crosshair.price.toFixed(crosshair.price < 1000 ? 2 : 0), w + profile + 7, crosshair.y + 3);
      }

      context.fillStyle = color('--muted-foreground');
      context.font = '9px "IBM Plex Mono", monospace';
      const coverage = snaps.length ? `DEPTH ${new Date(snaps[0]!.t).toISOString().slice(11, 19)}–${new Date(snaps.at(-1)!.t).toISOString().slice(11, 19)} UTC` : 'AWAITING SESSION DEPTH';
      context.fillText(`${coverage} · ${window.count}/${allKlines.length} CANDLES`, 6, 13);
      context.textAlign = 'right';
      context.fillText(`${candlesFrom ?? 'EXCHANGE'} ${candlePair ?? ''} · ${candleTime ? new Date(candleTime).toISOString().slice(11, 19) : '—'} UTC`, w - 5, 13);
      context.textAlign = 'left';
      if (!snaps.length) {
        context.fillStyle = color('--muted-foreground');
        context.fillText('Heat appears as live order-book depth is recorded; no synthetic historical depth.', 8, 31);
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const timer = window.setInterval(draw, 125);
    return () => { disposed = true; observer.disconnect(); window.clearInterval(timer); };
  }, []);

  const updateHover = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current, geometry = geometryRef.current;
    if (!canvas || !geometry) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (x < 0 || x > geometry.w || y < 0 || y > geometry.h) { setHover(null); return; }
    const price = geometry.center + (0.5 - y / geometry.h) * geometry.range;
    const time = geometry.t0 + (x / geometry.w) * (geometry.t1 - geometry.t0);
    setHover({ x, y, price, time });
  };

  return (
    <div className="chart-area bookmap-area">
      <canvas
        ref={canvasRef}
        aria-label={`${market} real candle chart and session liquidity heatmap. Drag to pan, mouse wheel to zoom price, Shift plus wheel to zoom time.`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointersRef.current.size === 2) {
            const [a, b] = [...pointersRef.current.values()];
            pinchRef.current = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: priceViewRef.current.zoom };
            dragRef.current = null;
          } else dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const geometry = geometryRef.current;
          if (pointersRef.current.size === 2 && pinchRef.current && geometry) {
            const [a, b] = [...pointersRef.current.values()];
            const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
            const rect = event.currentTarget.getBoundingClientRect();
            const anchorY = ((a!.y + b!.y) / 2 - rect.top) / geometry.h;
            const nextZoom = clamp(pinchRef.current.zoom * (distance / Math.max(1, pinchRef.current.distance)), 1, 12);
            priceViewRef.current = zoomPriceAt(priceViewRef.current, nextZoom, anchorY);
            props.onZoomChange(nextZoom);
          } else if (dragRef.current?.id === event.pointerId && geometry) {
            const dx = event.clientX - dragRef.current.x, dy = event.clientY - dragRef.current.y;
            priceViewRef.current = panPrice(priceViewRef.current, dy / geometry.h);
            timeOffsetRef.current = clamp(timeOffsetRef.current + (dx / geometry.w) * geometry.count, 0, Math.max(0, geometry.total - geometry.count));
            dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          }
          updateHover(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          pointersRef.current.delete(event.pointerId);
          dragRef.current = null;
          pinchRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => { pointersRef.current.delete(event.pointerId); dragRef.current = null; pinchRef.current = null; }}
        onPointerLeave={() => { if (!pointersRef.current.size) setHover(null); }}
      />
      {hover && (
        <div className="chart-tooltip bookmap-tooltip" style={{ left: clamp(hover.x + 14, 8, 210), top: clamp(hover.y + 14, 34, 150) }}>
          <div className="text-positive">{(live.source ?? 'EXCHANGE').toUpperCase()} · {(live.source === 'Coinbase' ? 'BTC-USD' : 'BTCUSDT')}</div>
          <div className="mt-2">Price <span className="text-foreground">{hover.price.toFixed(2)}</span></div>
          <div>{timeLabel(hover.time, timeframe, true)} UTC</div>
          <div className="mt-1 text-muted-foreground">Live session evidence · not historical depth</div>
        </div>
      )}
      <div className="bookmap-status" role="status">
        <span>Candles {candleStatus.toUpperCase()}</span><span>Stream {live.status.toUpperCase()}</span><span className="hidden sm:inline">Wheel: price · Shift+wheel: time · Drag: pan</span>
      </div>
    </div>
  );
}
