import { useEffect, useState } from 'react';
import { createLiveFeedStore, emptyLiveState } from './live-feed-store';

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

const stores = new Map<string, ReturnType<typeof createLiveFeedStore>>();

/** Browser-only public Binance stream for BTCUSDT (spot or USDⓈ-M perpetual). No key required. */
export function useBinanceLive(market: string): LiveState {
  const [snapshot, setSnapshot] = useState<{ market: string; state: LiveState }>({ market, state: emptyLiveState });
  useEffect(() => {
    const key = market === 'Perpetual' ? 'Perpetual' : 'Spot';
    let store = stores.get(key);
    if (!store) { store = createLiveFeedStore(key); stores.set(key, store); }
    return store.subscribe((state) => setSnapshot({ market, state }));
  }, [market]);
  return snapshot.market === market ? snapshot.state : emptyLiveState;
}
