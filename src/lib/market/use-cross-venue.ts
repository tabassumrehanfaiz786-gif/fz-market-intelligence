import { useEffect, useState } from 'react';

export type VenueQuote = { price: number | null; time: number | null; status: 'connecting' | 'live' | 'disconnected' };
export type CrossVenueState = { binance: VenueQuote; coinbase: VenueQuote; bybit: VenueQuote; perp: VenueQuote; fundingRate: number | null; nextFunding: number | null; indexPrice: number | null };

const q = (): VenueQuote => ({ price: null, time: null, status: 'connecting' });

export function premiumBps(a: number | null, b: number | null) { return a != null && b != null && b > 0 ? (a - b) / b * 10000 : null; }
/** Funding is charged every 8h: 3 periods/day × 365. */
export function annualizedFunding(rate: number | null) { return rate == null ? null : rate * 3 * 365 * 100; }

/** Public, keyless live tickers from Binance spot/perp, Coinbase and Bybit for BTC. */
export function useCrossVenue(): CrossVenueState {
  const [s, set] = useState<CrossVenueState>({ binance: q(), coinbase: q(), bybit: q(), perp: q(), fundingRate: null, nextFunding: null, indexPrice: null });
  useEffect(() => {
    let closed = false; const sockets: WebSocket[] = []; const timers: ReturnType<typeof setTimeout>[] = [];
    const open = (key: keyof Pick<CrossVenueState, 'binance' | 'coinbase' | 'bybit' | 'perp'>, url: string, onOpen: ((w: WebSocket) => void) | null, parse: (m: any) => void) => {
      const go = () => {
        const w = new WebSocket(url); sockets.push(w);
        w.onopen = () => onOpen?.(w);
        w.onmessage = (e) => { try { parse(JSON.parse(e.data)); } catch { /* ignore malformed frame */ } };
        w.onclose = () => { if (closed) return; set((st) => ({ ...st, [key]: { ...st[key], status: 'disconnected' } })); timers.push(setTimeout(go, 3000)); };
        w.onerror = () => w.close();
      };
      go();
    };
    const put = (key: 'binance' | 'coinbase' | 'bybit' | 'perp', price: number) => set((st) => ({ ...st, [key]: { price, time: Date.now(), status: 'live' } }));
    open('binance', 'wss://stream.binance.com:9443/ws/btcusdt@ticker', null, (m) => m.c && put('binance', +m.c));
    open('perp', 'wss://fstream.binance.com/market/ws/btcusdt@markPrice@1s', null, (m) => { if (!m.p) return; put('perp', +m.p); set((st) => ({ ...st, fundingRate: +m.r, nextFunding: +m.T, indexPrice: +m.i })); });
    open('coinbase', 'wss://ws-feed.exchange.coinbase.com', (w) => w.send(JSON.stringify({ type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] })), (m) => m.type === 'ticker' && m.price && put('coinbase', +m.price));
    open('bybit', 'wss://stream.bybit.com/v5/public/spot', (w) => w.send(JSON.stringify({ op: 'subscribe', args: ['tickers.BTCUSDT'] })), (m) => m.data?.lastPrice && put('bybit', +m.data.lastPrice));
    return () => { closed = true; timers.forEach(clearTimeout); sockets.forEach((w) => w.close()); };
  }, []);
  return s;
}
