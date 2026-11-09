export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type PriceView = { zoom: number; pan: number };

/** Zoom around an anchor expressed as a 0–1 position down the price pane. */
export function zoomPriceAt(view: PriceView, requestedZoom: number, anchorRatio: number): PriceView {
  const zoom = clamp(requestedZoom, 1, 12);
  const anchor = clamp(anchorRatio, 0, 1);
  const center = 0.5 + view.pan;
  const anchoredPrice = center + (0.5 - anchor) / view.zoom;
  const pan = anchoredPrice - (0.5 - anchor) / zoom - 0.5;
  return { zoom, pan: clamp(pan, -20, 20) };
}

/** Dragging down moves the visible price window up, keeping chart movement natural. */
export function panPrice(view: PriceView, deltaYRatio: number): PriceView {
  return { ...view, pan: clamp(view.pan + deltaYRatio / view.zoom, -20, 20) };
}

export type TimeWindow = { start: number; end: number; offset: number; count: number };

/** A count of zero means all candles; offset is the number of candles hidden at the right. */
export function visibleTimeWindow(length: number, requestedCount: number, requestedOffset: number): TimeWindow {
  const count = requestedCount <= 0 ? length : Math.min(length, Math.max(1, Math.round(requestedCount)));
  const maxOffset = Math.max(0, length - count);
  const offset = clamp(Math.round(requestedOffset), 0, maxOffset);
  const end = Math.max(0, length - offset);
  return { start: Math.max(0, end - count), end, offset, count };
}

/** Change the visible candle count while keeping the candle under the cursor stationary. */
export function zoomTimeAt(length: number, currentCount: number, currentOffset: number, requestedCount: number, anchorRatio: number): TimeWindow {
  const current = visibleTimeWindow(length, currentCount, currentOffset);
  const nextCount = clamp(Math.round(requestedCount), 10, Math.max(10, length));
  const anchor = clamp(anchorRatio, 0, 1);
  const focusedIndex = current.start + anchor * Math.max(1, current.count - 1);
  const desiredStart = focusedIndex - anchor * Math.max(1, nextCount - 1);
  const desiredOffset = length - (desiredStart + nextCount);
  return visibleTimeWindow(length, nextCount, desiredOffset);
}
