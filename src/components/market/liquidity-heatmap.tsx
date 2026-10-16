import { useEffect, useRef, useState } from 'react';
import { useBinanceLive } from '@/lib/market/use-binance-live';
import { useKlines, klinesVwap } from '@/lib/market/use-klines';

export const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M', '6M', '1Y'] as const;
export type Timeframe = typeof timeframes[number];

type DepthSnapshot = { t: number; levels: [number, number][] }; // signed qty: bid +, ask −

function timeLabel(t: number, timeframe: string) {
  const d = new Date(t);
  if (['1m', '5m', '15m', '30m', '1h', '4h'].includes(timeframe))
    return d.toISOString().slice(11, 16);
  if (timeframe === '1D') return d.toISOString().slice(5, 10);
  return d.toISOString().slice(0, 7);
}

/** Live BTCUSDT chart: real Binance candles, live order-book depth heatmap recorded this session, live trade bubbles. */
export function LiquidityHeatmap({ timeframe, intensity, bubbles, vwap, market, zoom, playing }: { timeframe: Timeframe; intensity: number; bubbles: boolean; vwap: boolean; market: string; zoom: number; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ price: string; time: string } | null>(null);
  const live = useBinanceLive(market);
  const { klines } = useKlines(market, timeframe);
  const snapshotsRef = useRef<DepthSnapshot[]>([]);
  const tradesRef = useRef(live.trades);
  const sessionStartRef = useRef<number>(Date.now());
  tradesRef.current = live.trades;

  // Record live order-book snapshots (paused while "playing" is false? no: playing pauses recording)
  useEffect(() => {
    if (!live.bids.length && !live.asks.length) return;
    if (!playing && snapshotsRef.current.length > 0) {
      // still record the first snapshot so the heatmap is never empty
    }
    const levels: [number, number][] = [
      ...live.bids.map(([p, q]) => [p, q] as [number, number]),
      ...live.asks.map(([p, q]) => [p, -q] as [number, number]),
    ];
    const snaps = snapshotsRef.current;
    if (snaps.length && Date.now() - snaps[snaps.length - 1]!.t < 1000) {
      snaps[snaps.length - 1] = { t: Date.now(), levels };
    } else {
      snaps.push({ t: Date.now(), levels });
      if (snaps.length > 240) snaps.shift();
    }
  }, [live.bids, live.asks, playing]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const context = canvas.getContext('2d'); if (!context) return;
    let frame = 0;
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string) => styles.getPropertyValue(name).trim();

    const draw = () => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr; canvas.height = height * dpr; context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gutter = width < 500 ? 57 : 72, profile = width < 500 ? 32 : 65, w = width - gutter - profile, h = height - 45;
      context.fillStyle = color('--chart-bg'); context.fillRect(0, 0, width, height);

      if (!klines.length) {
        context.fillStyle = color('--muted-foreground'); context.font = '11px "IBM Plex Mono", monospace';
        context.fillText('Loading live Binance candles…', 16, 24);
        return;
      }

      // Price range from real candles, tightened by zoom
      let min = Infinity, max = -Infinity;
      for (const k of klines) { min = Math.min(min, k.low); max = Math.max(max, k.high); }
      const pad = (max - min) * 0.08 || 1;
      min -= pad; max += pad;
      const mid = (min + max) / 2, half = (max - min) / 2 / zoom;
      min = mid - half; max = mid + half;
      const yOf = (p: number) => h - ((p - min) / (max - min)) * h;
      const xOf = (i: number) => (i / (klines.length - 1)) * w;

      // Grid + real price axis
      context.strokeStyle = color('--border'); context.lineWidth = 0.5;
      context.fillStyle = color('--muted-foreground'); context.font = '10px "IBM Plex Mono", monospace';
      for (let i = 0; i <= 10; i++) {
        const y = (i * h) / 10, p = max - (i / 10) * (max - min);
        context.globalAlpha = 0.45; context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke(); context.globalAlpha = 1;
        context.fillText(p.toFixed(0), w + profile + 7, y + 4);
      }
      for (let i = 0; i < 5; i++) {
        const idx = Math.round((i / 4) * (klines.length - 1));
        context.textAlign = i === 4 ? 'right' : i === 0 ? 'left' : 'center';
        context.fillText(timeLabel(klines[idx]!.time, timeframe), (w * i) / 4, height - 9);
      }
      context.textAlign = 'left';

      // Live order-book heatmap: recorded depth snapshots, newest at right
      const snaps = snapshotsRef.current;
      if (snaps.length) {
        const rows = 105, cellH = h / rows;
        const colW = Math.max(2, w / 240);
        const maxQ = Math.max(1e-9, ...snaps.flatMap((s) => s.levels.map((l) => Math.abs(l[1]))));
        snaps.forEach((snap, si) => {
          const x = w - (snaps.length - si) * colW;
          for (const [p, q] of snap.levels) {
            const y = yOf(p);
            if (y < 0 || y > h) continue;
            const strength = Math.min(1, (Math.abs(q) / maxQ) * (intensity / 65) * 1.6);
            context.globalAlpha = 0.25 + strength * 0.7;
            context.fillStyle = color(strength > 0.9 ? '--heat-hot' : strength > 0.72 ? '--heat-high' : strength > 0.48 ? '--heat-mid' : '--heat-low');
            context.fillRect(x, y - cellH / 2, colW + 0.4, Math.max(1, cellH - 0.5));
          }
        });
        context.globalAlpha = 1;
        // Session-coverage note
        context.fillStyle = color('--muted-foreground'); context.font = '9px "IBM Plex Mono", monospace';
        context.fillText(`live depth recorded since ${new Date(sessionStartRef.current).toISOString().slice(11, 19)} UTC`, 6, 12);
      }

      // VWAP from real candles
      if (vwap) {
        const v = klinesVwap(klines);
        if (v != null && v > min && v < max) {
          context.strokeStyle = color('--analysis'); context.setLineDash([4, 5]);
          context.beginPath(); context.moveTo(0, yOf(v)); context.lineTo(w, yOf(v)); context.stroke(); context.setLineDash([]);
        }
      }

      // Real price line from candle closes
      context.strokeStyle = color('--heat-high'); context.lineWidth = 1; context.beginPath();
      klines.forEach((k, i) => { const x = xOf(i), y = yOf(k.close); if (i === 0) context.moveTo(x, y); else context.lineTo(x, y); });
      context.stroke();

      // Live trade bubbles (this session)
      if (bubbles) {
        const t0 = klines[0]!.time, t1 = klines[klines.length - 1]!.time;
        const span = Math.max(1, t1 - t0);
        const maxQty = Math.max(1e-9, ...tradesRef.current.map((t) => t.qty));
        for (const t of tradesRef.current) {
          if (t.time < t0) continue;
          const x = ((t.time - t0) / span) * w;
          const y = yOf(t.price);
          if (y < 0 || y > h) continue;
          const radius = 1.6 + Math.pow(t.qty / maxQty, 0.5) * (width < 500 ? 7 : 10);
          context.globalAlpha = 0.78;
          context.fillStyle = color(t.side === 'buy' ? '--positive' : '--negative');
          context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1;
        }
      }

      // Right-side live depth profile
      const rows2 = 105, cellH2 = h / rows2;
      const bookMax = Math.max(1e-9, ...live.bids.map((l) => l[1]), ...live.asks.map((l) => l[1]));
      for (const [p, q] of live.bids) {
        const y = yOf(p); if (y < 0 || y > h) continue;
        const size = (q / bookMax) * profile;
        context.globalAlpha = 0.6; context.fillStyle = color('--positive');
        context.fillRect(w + profile - size, y - cellH2 / 2, size, cellH2 - 1);
      }
      for (const [p, q] of live.asks) {
        const y = yOf(p); if (y < 0 || y > h) continue;
        const size = (q / bookMax) * profile;
        context.globalAlpha = 0.6; context.fillStyle = color('--negative');
        context.fillRect(w + profile - size, y - cellH2 / 2, size, cellH2 - 1);
      }
      context.globalAlpha = 1;

      // Last live price marker
      const last = live.price ?? klines[klines.length - 1]!.close;
      const lastY = Math.min(h, Math.max(0, yOf(last)));
      context.strokeStyle = color('--foreground'); context.setLineDash([3, 4]);
      context.beginPath(); context.moveTo(0, lastY); context.lineTo(w + profile, lastY); context.stroke(); context.setLineDash([]);
      context.fillStyle = color(last >= klines[klines.length - 1]!.open ? '--positive' : '--negative');
      context.fillRect(w + profile, lastY - 10, gutter, 20);
      context.fillStyle = color('--background'); context.fillText(last.toFixed(0), w + profile + 7, lastY + 4);

      // Real volume bars from candles
      const maxVol = Math.max(1e-9, ...klines.map((k) => k.volume));
      klines.forEach((k, i) => {
        context.fillStyle = color(k.close >= k.open ? '--positive' : '--negative');
        context.globalAlpha = 0.65;
        context.fillRect(xOf(i), h + 4, Math.max(1, w / klines.length - 1), (k.volume / maxVol) * 17);
      });
      context.globalAlpha = 1;
    };

    draw();
    const observer = new ResizeObserver(draw); observer.observe(canvas);
    const timer = setInterval(draw, 2000); // refresh with live data
    return () => { observer.disconnect(); clearInterval(timer); cancelAnimationFrame(frame); };
  }, [timeframe, intensity, bubbles, vwap, market, zoom, playing, klines, live.price, live.bids, live.asks]);

  return (
    <div className="chart-area">
      <canvas
        ref={canvasRef}
        aria-label={`${market} live liquidity heatmap, ${timeframe} window, Binance BTCUSDT`}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHover({ price: '', time: timeLabel(Date.now(), timeframe) });
        }}
        onPointerLeave={() => setHover(null)}
      />
      {hover && (
        <div className="chart-tooltip">
          <div className="text-positive">LIVE · BINANCE BTCUSDT</div>
          <div className="mt-2">Candles, depth and trades are real market data.</div>
          <div>Depth history is recorded only while this page is open.</div>
        </div>
      )}
    </div>
  );
}
