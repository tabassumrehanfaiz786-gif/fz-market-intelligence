import { Radio } from 'lucide-react';
import { useBinanceLive, type LiveStatus } from '@/lib/market/use-binance-live';

const fmt = (n: number | null, d = 2) => (n == null ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
const statusLabel: Record<LiveStatus, string> = { connecting: 'CONNECTING', live: 'LIVE', stale: 'STALE', disconnected: 'DISCONNECTED' };

export function LiveFeedPanel({ market }: { market: string }) {
  const s = useBinanceLive(market);
  const live = s.status === 'live';
  const badge = live ? 'live' : 'unavailable';
  const bidVol = s.bids.reduce((a, l) => a + l[1], 0), askVol = s.asks.reduce((a, l) => a + l[1], 0);
  const imb = bidVol + askVol ? ((bidVol - askVol) / (bidVol + askVol)) * 100 : null;
  const maxQty = Math.max(1e-9, ...s.bids.slice(0, 10).map(l => l[1]), ...s.asks.slice(0, 10).map(l => l[1]));
  return (
    <section className="live-panel mb-5" aria-label="Live Binance feed">
      <div className="live-panel-head">
        <span className="flex items-center gap-2 font-medium text-xs"><Radio className={`size-3.5 ${live ? 'text-positive' : 'text-muted-foreground'}`} />Binance · BTCUSDT {market === 'Perpetual' ? 'USDⓈ-M perpetual' : 'spot'}</span>
        <span className="flex items-center gap-2"><span className={`data-badge ${badge}`}>{statusLabel[s.status]}</span><span className="text-[10px] text-muted-foreground font-mono">{s.lastUpdate ? new Date(s.lastUpdate).toISOString().slice(11, 19) + ' UTC' : 'awaiting data'}</span></span>
      </div>
      <div className="live-grid">
        <div className="live-col">
          <div className="stat-label">Last price <span className={`ml-auto data-badge ${badge}`}>{live ? 'LIVE' : statusLabel[s.status]}</span></div>
          <div className="stat-value text-2xl" data-testid="live-price">{fmt(s.price)} <span className="text-[10px] text-muted-foreground">USDT</span></div>
          <div className={`stat-foot ${s.change24h != null && s.change24h >= 0 ? 'text-positive' : 'text-negative'}`}>{s.change24h == null ? '—' : `${s.change24h >= 0 ? '+' : ''}${s.change24h.toFixed(2)}%`} <span className="text-muted-foreground">· 24h</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-mono">
            <span>24h high<br /><b className="text-foreground font-normal">{fmt(s.high24h)}</b></span>
            <span>24h low<br /><b className="text-foreground font-normal">{fmt(s.low24h)}</b></span>
            <span>24h vol<br /><b className="text-foreground font-normal">{fmt(s.volume24h, 0)} BTC</b></span>
            <span>Top-20 imbalance<br /><b className={`font-normal ${imb != null && imb >= 0 ? 'text-positive' : 'text-negative'}`}>{imb == null ? '—' : `${imb >= 0 ? '+' : ''}${imb.toFixed(2)}%`}</b></span>
          </div>
        </div>
        <div className="live-col">
          <div className="stat-label">Live trades <span className={`ml-auto data-badge ${badge}`}>{live ? 'LIVE' : statusLabel[s.status]}</span></div>
          <div className="live-list">
            {s.trades.length === 0 && <div className="text-muted-foreground text-[11px] py-4">Waiting for trades…</div>}
            {s.trades.slice(0, 12).map(t => (
              <div key={t.id} className="live-row"><span className={t.side === 'buy' ? 'text-positive' : 'text-negative'}>{fmt(t.price)}</span><span>{t.qty.toFixed(4)}</span><span className="text-muted-foreground">{new Date(t.time).toISOString().slice(11, 19)}</span></div>
            ))}
          </div>
        </div>
        <div className="live-col">
          <div className="stat-label">Order book · top 10 <span className={`ml-auto data-badge ${badge}`}>{live ? 'LIVE' : statusLabel[s.status]}</span></div>
          <div className="live-list">
            {s.asks.length === 0 && <div className="text-muted-foreground text-[11px] py-4">Waiting for depth…</div>}
            {s.asks.slice(0, 10).reverse().map(([p, q]) => <div key={'a' + p} className="live-row depth-row" style={{ ['--w' as string]: `${(q / maxQty) * 100}%` }} data-side="ask"><span className="text-negative">{fmt(p)}</span><span>{q.toFixed(4)}</span></div>)}
            {s.bids.slice(0, 10).map(([p, q]) => <div key={'b' + p} className="live-row depth-row" style={{ ['--w' as string]: `${(q / maxQty) * 100}%` }} data-side="bid"><span className="text-positive">{fmt(p)}</span><span>{q.toFixed(4)}</span></div>)}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Live: public Binance market stream, single venue, not recorded. The heatmap, delta and liquidity-level panels below remain <span className="text-analysis">SIMULATED</span>. Funding, open interest and historical depth are unavailable.</p>
    </section>
  );
}
