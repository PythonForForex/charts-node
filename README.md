# Time series

Time series is part of TraderSwift. This repo was called charts-node; the subnet was renamed on 9 Nov 2026.

## TraderSwift

TraderSwift is a trading network. Agents and people use it to trade across exchanges. It is built from subnets, and each subnet runs one job on its own set of nodes.

## What Time series is

Time series is TraderSwift's decentralized time series database. Its nodes hold market series, live and historical, serve them through one documented interface, and are paid for what they serve.

- **Two kinds of node work.** A `store` node holds the series, pulls from the venue on its own, and serves other nodes in bulk. A `serve` node answers users and front ends and records every request in a meter. The meter says which node stored and which node served each answer, so the fee is split between them from day one. Today one process does both.
- **Front ends are tools, and yours.** Chart front ends read the interface and are not part of the subnet. The interface does not change to suit one front end. This repo carries the chart TraderSwift uses, as the first chart tool and a working example.
- **Honest data.** Every response names the venue it came from and the node that served it. Prices are decimal strings, so two nodes holding the same bar send the same bytes. A Binance candle and a Hyperliquid candle for the same coin are different series and are never merged.
- **Checked by agreement.** Each closed day of bars is hashed by a fixed rule anyone can recompute from the venue's own API (live now for Hyperliquid). A day counts as validated when two store nodes publish the same hash on the TraderSwift chain (coming).

## Free and open source

Time series is free and open source under the Apache License 2.0. Use it however you like, including building your own front end, charging for it, or running your own node.

TraderSwift runs one node in dev mode, and its own chart is served free inside Solve.

## What is here

| Path | What it is |
|---|---|
| [docs/DATA_INTERFACE.md](docs/DATA_INTERFACE.md) | The data interface: instruments, bars, live bars, segment hashes, the embed frame. Versions v0 and v1. |
| `web/` | The first chart tool: TraderSwift's chart front end, plain files, no build step. Lightweight Charts with drawing tools, live bars, and a phone-first layout. |
| `NOTICE`, `LICENSE` | Apache License 2.0, plus the attribution notices for Lightweight Charts and the drawing plugin. |

The chart calls `/api/instruments`, `/api/bars`, `/api/live` and `/api/quotes` on its own origin, plus `/api/tv_drawings` to keep a user's drawings. Serve `web/` at `/static/` and `web/tv.html` at `/`, next to a node.

## Status

Time series is in dev mode. TraderSwift's node is live for its own use. A public test feed (Hyperliquid) and the daily segment hashes are in [docs/DATA_INTERFACE.md](docs/DATA_INTERFACE.md). Still to come: separate store and serve node software, two-of-three checks on the chain, the usage meter and fee split, and a list of front ends with votes. Expect changes. The interface keeps every published version working.

## Licences of what is bundled

Lightweight Charts asks for its attribution notice and a link to https://www.tradingview.com/ on any page that uses it. The chart turns on Lightweight Charts' own `attributionLogo`, which shows the link. Keep both if you build on it.
