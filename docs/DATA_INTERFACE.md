# Charts data interface, for builders

What a front end may read from a Charts node. The front end is the builder's business; this interface does not change to suit one front end. Front ends TraderSwift hosts use Lightweight Charts (Apache-2.0).

Versions: **v1, 9 Nov 2026** (add `&v=1`) and **v0, 8 Nov 2026** (no `v`, unchanged). Read-only. A node has other endpoints for one user's own drawings and settings; a builder needs only the four below.

## Reach

- `https://charts.traderswift.io`, behind Cloudflare Access, for the node's own users.
- **Public test feed**, no login, for anyone building a front end: `GET /public/v1/instruments` and `GET /public/v1/bars?venue=hyperliquid&symbol=BTC&tf=1h&bars=300` (optional `end_ts`), in the v1 shape below. Hyperliquid only for now; other venues join once their terms allow passing the data on. `bars` 1 to 1000 (default 300). CORS open (`Access-Control-Allow-Origin: *`). No live stream yet.
- Every `/api/*` call needs an identity. Errors: `400 {"error"}` for bad input, `403 {"error"}` for identity, `404` for a hostname charts does not serve.

## Read

| Call | Answer |
|---|---|
| `GET /api/instruments` | `[{"venue", "symbol", "tfs": [...], "derived": [...]}]`. `derived` timeframes are built on read from a finer stored one (UTC buckets; weeks start Monday 00:00 UTC, months are calendar months). |
| `GET /api/bars?venue=&symbol=&tf=` with optional `&bars=<n>&end_ts=<unix s>` | `{"venue", "symbol", "tf", "bars": [{"time", "open", "high", "low", "close", "volume"}]}`. `time` is the bar's open in unix seconds, ascending. With no `end_ts`, the newest bars are extended from the live 5-second feed. A session built from hourly bars carries `"forming": true`. |
| `GET /api/live?venue=&symbol=&tf=` | Server-sent events. Each `event: bar` carries one bar of the same shape: first the newest bar, then the forming bar on every update, with a finished bar sent once when it closes. `: keepalive` every 20 s while quiet. `204` = this name has no live feed (EventSource stops retrying). |
| Frame `/?venue=&symbol=&tf=&view=embed` | The chart without its header, for a host page that gives the title (Solve's `candles` block). Leaves the full page's last instrument alone. |

Instruments are one series per venue: Binance BTC and Hyperliquid BTC are different names and are never merged. On TraderSwift's node the candles come from its TimescaleDB, with the forming bar from its Redis 5-second streams. The node reads both and never writes them.

## v1: `&v=1` on `/api/bars` and `/api/live`

```
GET /api/bars?venue=binance&symbol=XAUUSDT&tf=1h&bars=3&v=1
{"version": "1", "venue": "binance", "symbol": "XAUUSDT", "tf": "1h",
 "provenance": {"source_venue": "binance", "source_store": "timescaledb", "live_extended": true,
                "node_id": "traderswift-dev-1", "fetched_at": "1794157587665"},
 "bars": [{"time": 1794150000, "open": "4067.27", "high": "4067.27", "low": "4063.69",
           "close": "4065.81", "volume": "5147.8099999999995", "status": "closed"}, ...]}
```

- **Decimal strings.** `open high low close volume` are strings, never JSON numbers. Read them with a decimal type. The rule: the shortest string that gives back the stored value exactly, written out with no exponent and no trailing zeros. Two nodes that hold the same stored value send the same bytes. Volume on a derived timeframe is a sum and may carry a long tail; it is still exact to what is stored.
- **Provenance**, one per response (a response is one series from one node): `source_venue` (the venue the bars came from; Binance and Hyperliquid BTC are different series), `source_store` (`timescaledb` or `files`), `live_extended` (true when the newest bars may come from the venue's live 5-second feed and not the store), `node_id` (which node served it), `fetched_at` (unix ms, as a string, when the node read it).
- **Status per bar**: `closed` (the bar's period has ended) or `live` (still forming). Nothing is `validated` yet; that label comes with segment hashes.
- **`segment_hash` per bar**, on closed bars of a covered series once their UTC day has settled (two hours after it ends): the sha256 of that day's segment. Coverage today: Hyperliquid 1h, BNB BTC DOGE ETH HYPE SOL XRP.
- **`GET /public/v1/segments?day=YYYY-MM-DD`** (no login): the node's segment list for a settled UTC day, `{"version", "day", "charter_version", "node_id", "candle_root", "segments": [{"venue", "symbol", "tf", "segment_hash", "bars"}]}`. Segment bytes: a line `venue,symbol,tf,day`, then one line per stored bar `time,open,high,low,close,volume` in the decimal-string rule, each ending in `\n`; `segment_hash` is its sha256. Root bytes: one line `venue,symbol,tf,segment_hash\n` per segment, sorted; `candle_root` is its sha256. Anyone can recompute both from the venue's own API: on 7 Nov, BTC, HYPE and DOGE from Hyperliquid's `candleSnapshot` gave the same hashes as the node.
- **`/api/live?…&v=1`**: first an `event: provenance` with the same object, then `event: bar` in the v1 bar shape.
- Any other `v` → 400. No `v` is v0, kept as it was.

## Not yet (planned, not built)

| Gap | Why it matters | Lands with |
|---|---|---|
| No `validated` label | A closed segment is validated by matching hashes from two other nodes | Data nodes |
| Only one node, and roots not yet anchored on the chain | Two nodes' anchors must agree for a day to be validated | Data nodes, after the chain's anchor message |
| No portable workspace (layouts, watchlists, drawings belonging to the account) | A user keeps their setup when they change front end | Milestone 1 |
| Usage not recorded | The meter: views per build, bytes per node, votes | Meter |

Changes to this interface are versioned here and never break an earlier version without notice.
