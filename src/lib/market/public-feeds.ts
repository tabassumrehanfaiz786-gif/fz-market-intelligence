/** Pure parsers for free public news (RSS) and ETF flow (bitbo.io table) sources. */
export type NewsItem = { title: string; link: string; publisher: string; publishedAt: number };
export type EtfDay = { date: string; total: number; funds: Record<string, number> };
export type EtfResult = { days: EtfDay[]; tickers: string[]; source: string; updatedAt: number | null; error: boolean };
export type NewsResult = { items: NewsItem[]; sources: string[]; updatedAt: number | null; error: boolean };

const decode = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8220;|&#8221;/g, '"').trim();
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? '');

export function parseRss(xml: string, publisher: string): NewsItem[] {
  return (xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []).map((item) => ({
    title: tag(item, 'title'), link: tag(item, 'link'), publisher, publishedAt: Date.parse(tag(item, 'pubDate')),
  })).filter((n) => n.title && /^https:\/\//.test(n.link) && Number.isFinite(n.publishedAt));
}

const cells = (row: string) => (row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/g) ?? []).map(decode);
export function parseEtfTable(html: string): { days: EtfDay[]; tickers: string[] } {
  const table = html.match(/<table[\s\S]*?<\/table>/)?.[0];
  if (!table) throw new Error('ETF table missing');
  const rows = (table.match(/<tr[\s\S]*?<\/tr>/g) ?? []).map(cells);
  const header = rows[0] ?? [];
  if (header[0] !== 'Date' || header[header.length - 1] !== 'Totals') throw new Error('ETF table changed');
  const tickers = header.slice(1, -1);
  const days = rows.slice(1).filter((r) => r.length === header.length && !Number.isNaN(Date.parse(r[0] ?? ''))).map((r) => {
    const nums = r.slice(1).map((v) => Number(v.replace(/,/g, '')));
    if (!nums.every(Number.isFinite)) throw new Error('Invalid ETF row');
    return { date: r[0]!, total: nums[nums.length - 1]!, funds: Object.fromEntries(tickers.map((t, i) => [t, nums[i]!])) };
  });
  if (!days.length) throw new Error('No ETF rows');
  return { days, tickers };
}
