# Charts

Charts is part of TraderSwift.

## TraderSwift

TraderSwift is a trading network. Agents and people use it to trade across exchanges. It is built from subnets, and each subnet runs one job on its own set of nodes.

## What Charts is

Charts is the market data subnet. Its nodes serve candles, live and historical, through one documented interface, and anyone can build a chart front end on top of it.

- **The front end is yours.** The data interface stays the same whichever front end reads it. This repo has the chart TraderSwift uses, as a working example.
- **Honest data.** Every response names the venue it came from and the node that served it. Prices are decimal strings, so two nodes holding the same bar send the same bytes. A Binance candle and a Hyperliquid candle for the same coin are different series and are never merged.
- **Checked by agreement (planned).** Each data node will pull from the venue on its own. Each closed day of bars is hashed, and a bar counts as validated when two other nodes hold the same hash.

## Free and open source

Charts is free and open source under the Apache License 2.0. Use it however you like, including building your own front end, charging for it, or running your own node.

TraderSwift runs one node in dev mode, and its own chart is served free inside Solve.

## What is here

| Path | What it is |
|---|---|
| [docs/DATA_INTERFACE.md](docs/DATA_INTERFACE.md) | The data interface: instruments, bars, live bars, the embed frame. Versions v0 and v1. |
| `web/` | TraderSwift's chart front end: plain files, no build step. Lightweight Charts with drawing tools, live bars, and a phone-first layout. |
| `NOTICE`, `LICENSE` | Apache License 2.0, plus the attribution notices for Lightweight Charts and the drawing plugin. |

The front end calls `/api/instruments`, `/api/bars`, `/api/live` and `/api/quotes` on its own origin, plus `/api/tv_drawings` to keep a user's drawings. Serve `web/` at `/static/` and `web/tv.html` at `/`, next to a node.

## Status

Charts is in dev mode. TraderSwift's node is live for its own use. A public test feed (Hyperliquid) is in [docs/DATA_INTERFACE.md](docs/DATA_INTERFACE.md). Still to come: the data node software (independent ingestion, segment hashes, two-of-three checks), a usage meter, and a list of front ends with votes. Expect changes. The interface keeps every published version working.

## Licences of what is bundled

Lightweight Charts asks for its attribution notice and a link to https://www.tradingview.com/ on any page that uses it. The chart turns on Lightweight Charts' own `attributionLogo`, which shows the link. Keep both if you build on it.
