# Fz Market Intelligence

A live market-liquidity and microstructure research terminal. Real-time BTC, ETH and SOL
liquidity heatmaps, order-book depth, trade tapes and volume delta from public exchange
feeds, with minute-to-year timeframes, whale flow and spoofing analysis, cross-venue basis,
iceberg-order surveillance and forensic case export.

**Live app**: https://fz-market-intelligence.lovable.app

## What it does

- **Liquidity heatmap** — live depth and trade bubbles across 1m, 5m, 15m, 1h, 4h, 1d, 1w and 1M windows, for spot and perpetual markets.
- **Live market data** — price, ticker stats, recent trades and top-of-book depth streamed directly from Binance, with LIVE / STALE / DISCONNECTED status badges.
- **Whale flow and spoofing radar** — size-tiered cumulative volume delta, absorption and liquidity-cancellation candidates.
- **Cross-venue basis** — spot/perpetual premium, funding and open interest across venues.
- **Iceberg surveillance** — heuristic detection of executed-versus-displayed volume patterns, with reload and absorption tracking.
- **Forensic case export** — timestamped evidence dossiers with SHA-256 integrity hashes, CSV drafts and PDF capture.
- **Research and methodology** — documented detection rules, legal framing under UK MAR / MiCA, and academic citation.

Lead researcher: Faizan Rehan.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20036809-8137-4210-9680-6316f68324fb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Notes on data honesty

Detection output is heuristic. Candidate flags describe observable patterns in public market
data only — they are not proof of an order type, an identity, an intent or a market-abuse
offence. Any feed that is not connected shows as unavailable rather than being filled with
sample values.
