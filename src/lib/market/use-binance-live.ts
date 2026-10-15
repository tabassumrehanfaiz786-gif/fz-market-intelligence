import { useEffect, useRef, useState } from 'react';

export type LiveStatus = 'connecting' | 'live' | 'stale' | 'disconnected';
export type LiveTrade = { id: number; price: number; qty: number; time: number; side: 'buy' | 'sell' };
export type LiveLevel = [number, number];
export type LiveState = {
  status: LiveStatus;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  trades: LiveTrade[];
  bids: LiveLevel[];
  asks: LiveLevel[];
  lastUpdate: number | null;
};

const empty: LiveState = { status: 'connecting', price: null, change24h: null, high24h: null, low24h: null, volume24h: null, trades: [], bids: [], asks: [], lastUpdate: null };

/** Browser-only public Binance stream for BTCUSDT (spot or USDⓈ-M perpetual). No key required. */
export function useBinanceLive(market: string): LiveState {
  const [state, setState] = useState<LiveState>(empty);
  const tradesRef = useRef<LiveTrade[]>([]);
  useEffect(() => {
    const perp = market === 'Perpetual';
    const base = perp ? 'wss://fstream.binance.com/stream' : 'wss://stream.binance.com:9443/stream';
    const depth = perp ? 'btcusdt@depth20@500ms' : 'btcusdt@depth20@1000ms';
    const url = `${base}?streams=btcusdt@ticker/btcusdt@aggTrade/${depth}`;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    tradesRef.current = [];
    setState(empty);
    const connect = () => {
      ws = new WebSocket(url);
      ws.onmessage = (ev) => {
        const { stream, data } = JSON.parse(ev.data);
        const now = Date.now();
        if (stream.endsWith('@ticker')) {
          setState((s) => ({ ...s, status: 'live', price: +data.c, change24h: +data.P, high24h: +data.h, low24h: +data.l, volume24h: +data.v, lastUpdate: now }));
        } else if (stream.endsWith('@aggTrade')) {
          const t: LiveTrade = { id: data.a, price: +data.p, qty: +data.q, time: data.T, side: data.m ? 'sell' : 'buy' };
          tradesRef.current = [t, ...tradesRef.current].slice(0, 40);
          setState((s) => ({ ...s, status: 'live', price: t.price, trades: tradesRef.current, lastUpdate: now }));
        } else if (stream.includes('@depth')) {
          const bids = (data.bids ?? data.b ?? []).map((l: string[]) => [+l[0], +l[1]] as LiveLevel);
          const asks = (data.asks ?? data.a ?? []).map((l: string[]) => [+l[0], +l[1]] as LiveLevel);
          setState((s) => ({ ...s, status: 'live', bids, asks, lastUpdate: now }));
        }
      };
      ws.onclose = () => {
        if (closed) return;
        setState((s) => ({ ...s, status: 'disconnected' }));
        retry = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws?.close();
    };
    connect();
    const staleTimer = setInterval(() => setState((s) => (s.status === 'live' && s.lastUpdate && Date.now() - s.lastUpdate > 10000 ? { ...s, status: 'stale' } : s)), 2000);
    return () => { closed = true; clearTimeout(retry); clearInterval(staleTimer); ws?.close(); };
  }, [market]);
  return state;
}
