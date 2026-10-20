import { describe, it, expect } from 'vitest';
import { reloadRatio, classifyIceberg } from '@/lib/market/use-iceberg-detection';

describe('iceberg rules', () => {
  it('reload ratio is executed over peak shown', () => { expect(reloadRatio(3, 2)).toBe(1.5); expect(reloadRatio(1, 0)).toBe(0); });
  it('3+ refills under a minute is native reload', () => expect(classifyIceberg(3, 30_000, 5)).toBe('native-reload'));
  it('2+ refills over a minute is slicing', () => expect(classifyIceberg(2, 90_000, 5)).toBe('algorithmic-slicing'));
  it('flat price with few refills is passive absorption', () => expect(classifyIceberg(1, 10_000, 1)).toBe('passive-absorption'));
});
