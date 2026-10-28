# Fz Market Intelligence

**A research instrument for studying market manipulation and market integrity in crypto-asset markets, built at the intersection of financial-markets law and market microstructure.**

**© 2026 Faizan Rehan. All rights reserved. Proprietary; see [LICENSE](./LICENSE).**

**Live application:** https://fz-market-intelligence.lovable.app

**Author and lead researcher:** Faizan Rehan, Advocate and Independent Legal & Financial Markets Researcher
Contact: [faizan.tabassumrehan@gmail.com](mailto:faizan.tabassumrehan@gmail.com)
[ORCID 0009-0000-2249-6711](https://orcid.org/0009-0000-2249-6711) · SSRN Author ID 13164428

## Purpose

Allegations of spoofing, layering and other manipulation in crypto markets are usually argued without a shared evidentiary method. This project asks a practical legal-research question: **what can public order-book and trade data show, and what can it never show, when assessed against the standards of UK MAR and MiCA?**

It does this by turning observable microstructure patterns into timestamped, hash-verified, reproducible records, while stating plainly where inference stops. It is a research tool, not an enforcement tool or a source of legal conclusions.

## Research context

The application supports the empirical side of the author's research programme on crypto market microstructure, market manipulation and financial regulation:

- **Invisible Market Power in Crypto-Asset Markets** (working paper, SSRN, October 2026): [SSRN Abstract 7656978](https://papers.ssrn.com/abstract=7656978)

All papers are listed on the author's [SSRN](https://papers.ssrn.com/) and [ORCID](https://orcid.org/0009-0000-2249-6711) profiles.

## What the application does

- **Liquidity heatmap:** live depth and trade bubbles across 1m to 1M windows, for spot and perpetual markets.
- **Live market data:** price, ticker stats, recent trades and top-of-book depth from Binance, with LIVE / STALE / DISCONNECTED status badges.
- **Whale flow and spoofing radar:** size-tiered cumulative volume delta, absorption and liquidity-cancellation candidates.
- **Cross-venue basis:** spot/perpetual premium, funding and open interest across venues.
- **Iceberg surveillance:** heuristic detection of executed-versus-displayed volume patterns, with reload and absorption tracking.
- **Forensic case export:** timestamped evidence dossiers with SHA-256 integrity hashes, CSV drafts and PDF capture, designed so that a finding can be re-examined by a third party.
- **Documented methodology:** explicit detection rules with legal framing under UK MAR and MiCA.

## Research design principles

1. **Rule-based, falsifiable detection.** Each flag follows a stated rule, so it can be tested, challenged and reproduced.
2. **Public data only.** No private order-flow, account or identity data is used.
3. **Evidentiary integrity.** Exports are timestamped and hashed so records are tamper-evident.
4. **No fabricated data.** A feed that is not connected shows as unavailable and is never filled with sample values.
5. **Calibrated claims.** Outputs are candidate patterns, not findings of fact.

## Limitations and responsible use

Detection output is heuristic. Candidate flags describe observable patterns in public market data only. They are not proof of an order type, an identity, an intent or a market-abuse offence, and they are not legal or financial advice. Establishing manipulation requires evidence of intent and account-level data that public feeds do not contain. Detection rules have not been independently validated, and this is stated openly as a limitation of the current version.

## Ownership and permitted use

This repository and the live application are the exclusive intellectual property of Faizan Rehan and are not open source. No licence is granted to any other person. Use for machine-learning training or automated scraping is prohibited. Permission requests and research enquiries may be sent to faizan.tabassumrehan@gmail.com.

## How to cite

Rehan, F. (2026). *Fz Market Intelligence: a research instrument for crypto market microstructure and market-integrity analysis* [Software]. https://github.com/tabassumrehanfaiz786-gif/fz-market-intelligence