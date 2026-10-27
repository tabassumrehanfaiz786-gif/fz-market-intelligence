import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLiveFeedStore } from '@/lib/market/live-feed-store';
import { candleRequestSchema, candleUrl, parseCandles } from '@/lib/market/candle-data';

class FakeSocket {
  static instances: FakeSocket[] = [];
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  close = vi.fn(() => this.onclose?.());
  constructor(public url: string) { FakeSocket.instances.push(this); }
  sendFrame(stream: string, data: unknown) { this.onmessage?.({ data: JSON.stringify({ stream, data }) }); }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); FakeSocket.instances = []; });
describe('Shared market loading', () => {
  it('shares a single spot stream between consumers and closes after the last leaves', () => {
    vi.useFakeTimers(); vi.stubGlobal('WebSocket', FakeSocket);
    const store = createLiveFeedStore('Spot');
    const a = vi.fn(), b = vi.fn();
    const leaveA = store.subscribe(a), leaveB = store.subscribe(b);
    expect(FakeSocket.instances).toHaveLength(1);
    FakeSocket.instances[0]?.sendFrame('btcusdt@ticker', { c: '80150.56', P: '1', h: '81000', l: '79000', v: '100' });
    vi.advanceTimersByTime(100);
    expect(a.mock.lastCall?.[0].price).toBe(80150.56);
    expect(b.mock.lastCall?.[0].price).toBe(80150.56);
    leaveA(); vi.advanceTimersByTime(600);
    expect(FakeSocket.instances[0]?.close).not.toHaveBeenCalled();
    leaveB(); vi.advanceTimersByTime(600);
    expect(FakeSocket.instances[0]?.close).toHaveBeenCalledOnce();
  });
  it('keeps reused observations stale until a new exchange update', () => {
    vi.useFakeTimers(); vi.stubGlobal('WebSocket', FakeSocket);
    const store = createLiveFeedStore('Spot');
    const leave = store.subscribe(vi.fn());
    FakeSocket.instances[0]?.sendFrame('btcusdt@ticker', { c: '80150.56' });
    vi.advanceTimersByTime(100); leave(); vi.advanceTimersByTime(600);
    const listener = vi.fn(), stop = store.subscribe(listener);
    expect(listener.mock.lastCall?.[0].status).toBe('stale');
    expect(listener.mock.lastCall?.[0].price).toBe(80150.56);
    stop(); vi.advanceTimersByTime(600);
  });
  it('does not label partial futures connections live', () => {
    vi.useFakeTimers(); vi.stubGlobal('WebSocket', FakeSocket);
    const listener = vi.fn(), store = createLiveFeedStore('Perpetual');
    const stop = store.subscribe(listener);
    expect(FakeSocket.instances).toHaveLength(2);
    FakeSocket.instances[0]?.sendFrame('btcusdt@ticker', { c: '80150.56' });
    vi.advanceTimersByTime(100);
    expect(listener.mock.lastCall?.[0].status).toBe('connecting');
    FakeSocket.instances[1]?.sendFrame('btcusdt@depth20', { b: [['80150', '2']], a: [['80151', '3']] });
    vi.advanceTimersByTime(100);
    expect(listener.mock.lastCall?.[0].status).toBe('live');
    stop(); vi.advanceTimersByTime(600);
  });
  it('preserves minute-to-year candle selections and rejects malformed provider data', () => {
    expect(candleUrl({ market: 'Spot', timeframe: '1m' })).toContain('interval=1m&limit=120');
    expect(candleUrl({ market: 'Spot', timeframe: '1Y' })).toContain('interval=1M&limit=12');
    expect(candleRequestSchema.safeParse({ market: 'Spot', timeframe: 'https://elsewhere' }).success).toBe(false);
    expect(parseCandles([[1793044800000, '80020', '80211', '79728', '80150', '1515']])[0]?.close).toBe(80150);
    expect(() => parseCandles({ code: -1 })).toThrow();
    expect(() => parseCandles([[1, 'bad', 3, 1, 2, 0]])).toThrow();
  });
});