import { describe, expect, it } from 'vitest';
import { parseEtfTable, parseRss } from '@/lib/market/public-feeds';

describe('public feeds', () => {
  it('parses RSS items with publisher and time', () => {
    const items = parseRss('<item><title><![CDATA[BTC &amp; ETFs]]></title><link>https://x.com/a</link><pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate></item>', 'Decrypt');
    expect(items).toEqual([{ title: 'BTC & ETFs', link: 'https://x.com/a', publisher: 'Decrypt', publishedAt: Date.parse('2026-11-05T10:00:00Z') }]);
  });
  it('parses ETF daily rows and skips summary rows', () => {
    const html = '<table><tr><th>Date</th><th>IBIT</th><th>Totals</th></tr><tr><td>Nov 05, 2026</td><td>-118.7</td><td>-447.8</td></tr><tr><td>Maximum</td><td>1</td><td>2</td></tr></table>';
    expect(parseEtfTable(html)).toEqual({ tickers: ['IBIT'], days: [{ date: 'Nov 05, 2026', total: -447.8, funds: { IBIT: -118.7 } }] });
  });
});
