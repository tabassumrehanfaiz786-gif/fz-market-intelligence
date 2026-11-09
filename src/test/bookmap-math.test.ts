import { describe, expect, it } from 'vitest';
import { panPrice, visibleTimeWindow, zoomPriceAt, zoomTimeAt } from '@/lib/market/bookmap-math';

describe('Bookmap viewport calculations', () => {
  it('keeps the price under the cursor stationary while zooming', () => {
    const before = { zoom: 2, pan: 0.1 };
    const anchor = 0.3;
    const priceAt = (view: typeof before) => 0.5 + view.pan + (0.5 - anchor) / view.zoom;
    const after = zoomPriceAt(before, 5, anchor);
    expect(priceAt(after)).toBeCloseTo(priceAt(before), 10);
    expect(after.zoom).toBe(5);
  });

  it('moves the price window naturally when dragged', () => {
    expect(panPrice({ zoom: 2, pan: 0 }, 0.2).pan).toBeCloseTo(0.1);
  });

  it('clamps the visible range and prevents panning beyond available candles', () => {
    expect(visibleTimeWindow(120, 60, 999)).toEqual({ start: 0, end: 60, offset: 60, count: 60 });
    expect(visibleTimeWindow(120, 60, -5)).toEqual({ start: 60, end: 120, offset: 0, count: 60 });
    expect(visibleTimeWindow(120, 0, 0)).toEqual({ start: 0, end: 120, offset: 0, count: 120 });
  });

  it('zooms the time range around the cursor', () => {
    const result = zoomTimeAt(120, 60, 0, 30, 0.5);
    expect(result.count).toBe(30);
    expect(result.start).toBeGreaterThan(60);
    expect(result.end).toBe(120);
  });
});
