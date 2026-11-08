import { DrawingManager, makeCoords, OVERLAY_SPECS } from "./vendor/lightweight-charts-drawing.es.js";
import { CHART_THEME, createTradingViewMobileChart, hideCandleBordersWhenNarrow, lastBarColour, makePriceFormatter, pricePrecisionFromBars } from "./tv_chart_setup.js";
import { BOLLINGER_LENGTH, BOLLINGER_MULTIPLIER, computeBollingerBands, makeBandFillPrimitive } from "./tv_bollinger_band.js";
import { installPriceAxisOverlay } from "./tv_price_axis_overlay.js";
import { installTouchOffsetLayer } from "./tv_touch_offset_layer.js";
import { createDrawingToolbar } from "./tv_drawing_toolbar.js";
import { createSelectionBar } from "./tv_selection_bar.js";
import { createBottomBar, storedMagnetMode } from "./tv_bottom_bar.js";
import { openLayersSheet } from "./tv_layers_sheet.js";
import { createDrawingPersistence } from "./tv_drawing_persistence.js";
import { createInstrumentHeader, timeframeSeconds } from "./tv_symbol_search.js";
import { ICONS } from "./tv_icons.js";
import { createLegend } from "./tv_legend.js";
import { createLiveBarFeed } from "./tv_live.js";

const BAR_WINDOW = 3000;
const BAR_SPACING_ON_OPEN = 6;
const EMPTY_BARS_RIGHT_OF_LAST = 8;
const DEFAULT_INSTRUMENT = { venue: "oanda", symbol: "XAU_USD", tf: "H1" };
const LAST_INSTRUMENT_STORAGE_KEY = "tv.lastInstrument";

const stageElement = document.getElementById("chart-stage");
const chartElementHost = document.getElementById("chart");
const toastElement = document.getElementById("toast");
const placementControls = document.getElementById("placement-controls");
const legendElement = document.getElementById("legend");

const state = { venue: "", symbol: "", tf: "", bars: [], previousClose: null, instruments: [], timeframesByInstrument: new Map(), priceFormatter: (price) => String(price) };

const { chart, candleSeries, upperBandSeries, lowerBandSeries, basisBandSeries } = createTradingViewMobileChart(chartElementHost);
hideCandleBordersWhenNarrow(chart, candleSeries);
const legend = createLegend({ titleElement: document.getElementById("legend-title"), priceElement: document.getElementById("legend-price") });
const bandFill = makeBandFillPrimitive(CHART_THEME.bandFill);
upperBandSeries.attachPrimitive(bandFill);
const priceAxisOverlay = installPriceAxisOverlay({
  candleSeries,
  getLastBar: () => state.bars[state.bars.length - 1],
  getTimeframeSeconds: () => timeframeSeconds(state.tf),
});

const localTimeInfo = () => ({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", intraday: timeframeSeconds(state.tf) < 86400 });
const drawingManager = new DrawingManager(chart, candleSeries, {
  bars: () => state.bars,
  magnet: storedMagnetMode(),
  timeInfo: localTimeInfo,
  fontFamily: CHART_THEME.fontFamily,
});
const coords = makeCoords(chart, candleSeries, () => state.bars, () => [], localTimeInfo);
window.tvDrawingManager = drawingManager;
window.tvChart = chart;
window.tvCandleSeries = candleSeries;

const drawingToolbar = createDrawingToolbar({ hostElement: stageElement, drawingManager });
createSelectionBar({ hostElement: stageElement, drawingManager });
const bottomBar = createBottomBar({
  barElement: document.getElementById("bottom-bar"),
  drawingManager,
  drawingToolbar,
  onOpenLayers: () => openLayersSheet({ drawingManager, getPriceFormatter: () => state.priceFormatter }),
  onToggleFullscreen: toggleFullscreen,
  isFullscreen: () => document.body.classList.contains("is-fullscreen"),
});
installTouchOffsetLayer({
  wrapperElement: stageElement,
  chart,
  candleSeries,
  drawingManager,
  coords,
  getMagnetMode: () => bottomBar.magnetMode(),
  isCrosshairInspectOn: () => bottomBar.isCrosshairInspectOn(),
  crosshairDotElement: document.getElementById("crosshair-dot"),
  onPlacementStep: reflectPlacementControls,
});
const persistence = createDrawingPersistence({ drawingManager, onStatus: showStatus });
const header = createInstrumentHeader({
  symbolButton: document.getElementById("symbol-button"),
  timeframeStrip: document.getElementById("tf-strip"),
  getInstruments: () => state.instruments,
  onPickInstrument: (venue, symbol) => openInstrument(venue, symbol, preferredTimeframe(venue, symbol, state.tf)),
  onPickTimeframe: (tf) => openInstrument(state.venue, state.symbol, tf),
});

function showStatus(message, isError) {
  if (!isError) { toastElement.hidden = true; return; }
  toastElement.textContent = message;
  toastElement.hidden = false;
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => { toastElement.hidden = true; }, 6000);
}

function pendingPointCount() {
  return Array.isArray(drawingManager.pending) ? drawingManager.pending.length : 0;
}

function reflectPlacementControls() {
  const armed = drawingManager.tool();
  const pending = pendingPointCount();
  placementControls.hidden = !armed || pending === 0;
  const finishButton = placementControls.querySelector("[data-action=finish]");
  finishButton.hidden = !(armed && OVERLAY_SPECS[armed]?.variableLength && pending >= 2);
}

placementControls.innerHTML = `<button class="tv-icon-button" data-action="cancel" aria-label="Cancel this drawing">${ICONS.trash}</button><button class="tv-text-button" data-action="finish" aria-label="Finish this drawing" hidden>Finish</button>`;
placementControls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "cancel") window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  if (button.dataset.action === "finish") chart.chartElement().dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  reflectPlacementControls();
});
for (const type of ["pointerdown", "touchstart"]) placementControls.addEventListener(type, (event) => event.stopPropagation());
drawingManager.on("tool", reflectPlacementControls);
drawingManager.on("gestureEnd", reflectPlacementControls);
chart.chartElement().addEventListener("pointerup", () => setTimeout(reflectPlacementControls, 0));

drawingManager.on("textEdit", (drawing) => {
  const text = window.prompt("Text", drawing.text || "");
  if (text === null) return;
  const current = drawingManager.get(drawing.id);
  if (current) drawingManager.update({ ...current, text });
});

document.getElementById("legend-toggle").addEventListener("click", (event) => {
  const collapsed = legendElement.classList.toggle("is-collapsed");
  event.currentTarget.innerHTML = collapsed ? ICONS["chevron-down"] : ICONS["chevron-up"];
});
document.getElementById("legend-toggle").innerHTML = ICONS["chevron-up"];
legendElement.textContent = `BB ${BOLLINGER_LENGTH} SMA close ${BOLLINGER_MULTIPLIER}`;

function toggleFullscreen() {
  const entering = !document.body.classList.contains("is-fullscreen");
  document.body.classList.toggle("is-fullscreen", entering);
  const root = document.documentElement;
  if (entering && root.requestFullscreen) root.requestFullscreen().catch(() => {});
  if (!entering && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  bottomBar.reflectState();
}

function preferredTimeframe(venue, symbol, wanted) {
  const timeframes = state.timeframesByInstrument.get(`${venue}/${symbol}`) || [];
  if (timeframes.includes(wanted)) return wanted;
  const wantedSeconds = timeframeSeconds(wanted) || 3600;
  return [...timeframes].sort((a, b) => Math.abs(timeframeSeconds(a) - wantedSeconds) - Math.abs(timeframeSeconds(b) - wantedSeconds))[0] || wanted;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> ${response.status} ${await response.text()}`);
  return response.json();
}

function fetchBars(venue, symbol, tf) {
  return fetchJson(`/api/bars?venue=${encodeURIComponent(venue)}&symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}&bars=${BAR_WINDOW}`);
}

async function showDayChangeInLegend(venue, symbol) {
  try {
    const { quotes } = await fetchJson(`/api/quotes?items=${encodeURIComponent(`${venue}/${symbol}`)}`);
    const quote = quotes && quotes[0];
    if (!quote || venue !== state.venue || symbol !== state.symbol) return;
    state.previousClose = quote.previous_close;
    const lastBar = state.bars[state.bars.length - 1];
    legend.showQuote(lastBar ? lastBar.close : quote.last, quote.previous_close, state.priceFormatter);
  } catch (error) {
    legend.showQuote(state.bars[state.bars.length - 1]?.close, null, state.priceFormatter);
  }
}

function paintBars(bars) {
  candleSeries.setData(bars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
  candleSeries.applyOptions({ priceLineColor: lastBarColour(bars[bars.length - 1]) });
  const band = computeBollingerBands(bars);
  upperBandSeries.setData(band.upper);
  lowerBandSeries.setData(band.lower);
  basisBandSeries.setData(band.basis);
  bandFill.setBand(band.upper, band.lower);
}

function applyLiveBar(bar) {
  const last = state.bars[state.bars.length - 1];
  if (!last || bar.time < last.time) return;
  if (bar.time === last.time) state.bars[state.bars.length - 1] = bar;
  else state.bars.push(bar);
  candleSeries.update({ time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
  candleSeries.applyOptions({ priceLineColor: lastBarColour(bar) });
  const band = computeBollingerBands(state.bars);
  if (band.upper.length) {
    upperBandSeries.update(band.upper[band.upper.length - 1]);
    lowerBandSeries.update(band.lower[band.lower.length - 1]);
    basisBandSeries.update(band.basis[band.basis.length - 1]);
    bandFill.setBand(band.upper, band.lower);
  }
  legend.showQuote(bar.close, state.previousClose, state.priceFormatter);
  priceAxisOverlay.redraw();
}

async function reloadBarsAfterGap() {
  const { venue, symbol, tf } = state;
  if (!venue) return;
  const payload = await fetchBars(venue, symbol, tf);
  if (venue !== state.venue || symbol !== state.symbol || tf !== state.tf) return;
  state.bars = payload.bars.slice(-BAR_WINDOW);
  paintBars(state.bars);
  drawingManager.redraw();
  priceAxisOverlay.redraw();
}

const liveFeed = createLiveBarFeed({ onBar: applyLiveBar, onReconnected: () => reloadBarsAfterGap().catch(() => {}) });

// why: a phone suspends the tab and the browser may give up on the stream without telling the page.
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !state.venue) return;
  liveFeed.follow(state.venue, state.symbol, state.tf);
  reloadBarsAfterGap().catch(() => {});
});

async function openInstrument(venue, symbol, tf, prefetchedBars) {
  const instrumentChanged = venue !== state.venue || symbol !== state.symbol;
  if (drawingManager.tool()) drawingManager.setTool(null);
  if (instrumentChanged) persistence.flushPendingSave();
  const savedDrawingsPromise = instrumentChanged ? persistence.fetchSaved(venue, symbol) : null;
  savedDrawingsPromise?.catch(() => {});
  const payload = await (prefetchedBars || fetchBars(venue, symbol, tf));
  const bars = payload.bars.slice(-BAR_WINDOW);
  Object.assign(state, { venue, symbol, tf: payload.tf, bars });
  const precision = pricePrecisionFromBars(bars);
  state.priceFormatter = makePriceFormatter(precision);
  priceAxisOverlay.setPricePrecision(precision, state.priceFormatter);
  state.previousClose = null;
  paintBars(bars);
  liveFeed.follow(venue, symbol, payload.tf);
  chart.timeScale().applyOptions({ barSpacing: BAR_SPACING_ON_OPEN });
  chart.timeScale().scrollToPosition(EMPTY_BARS_RIGHT_OF_LAST, false);
  header.show(venue, symbol, state.timeframesByInstrument.get(`${venue}/${symbol}`) || [payload.tf], payload.tf);
  legend.showInstrument(symbol, payload.tf);
  showDayChangeInLegend(venue, symbol);
  document.title = `${symbol} ${payload.tf} · charts`;
  const embedded = document.documentElement.classList.contains("embed");
  if (!embedded) localStorage.setItem(LAST_INSTRUMENT_STORAGE_KEY, JSON.stringify({ venue, symbol, tf: payload.tf }));
  const url = new URL(location.href);
  url.search = new URLSearchParams(embedded ? { venue, symbol, tf: payload.tf, view: "embed" } : { venue, symbol, tf: payload.tf }).toString();
  history.replaceState(null, "", url);
  if (savedDrawingsPromise) await persistence.loadInstrument(venue, symbol, savedDrawingsPromise);
  drawingManager.redraw();
  priceAxisOverlay.redraw();
  document.body.dataset.ready = "true";
}

function startingInstrument() {
  const query = new URLSearchParams(location.search);
  if (query.get("venue") && query.get("symbol")) return { venue: query.get("venue"), symbol: query.get("symbol"), tf: query.get("tf") || DEFAULT_INSTRUMENT.tf };
  try {
    const stored = JSON.parse(localStorage.getItem(LAST_INSTRUMENT_STORAGE_KEY) || "null");
    if (stored && stored.venue && stored.symbol && stored.tf) return stored;
  } catch (error) {
    return DEFAULT_INSTRUMENT;
  }
  return DEFAULT_INSTRUMENT;
}

async function boot() {
  const start = startingInstrument();
  const speculativeBars = fetchBars(start.venue, start.symbol, start.tf);
  speculativeBars.catch(() => {});
  const instrumentsPromise = fetchJson("/api/instruments").then((instruments) => {
    state.instruments = instruments;
    for (const instrument of instruments) state.timeframesByInstrument.set(`${instrument.venue}/${instrument.symbol}`, instrument.tfs);
  });
  try {
    await instrumentsPromise;
    const startIsKnown = state.timeframesByInstrument.has(`${start.venue}/${start.symbol}`);
    const requestedTimeframe = start.tf;
    if (!startIsKnown) Object.assign(start, DEFAULT_INSTRUMENT);
    const timeframe = preferredTimeframe(start.venue, start.symbol, start.tf);
    await openInstrument(start.venue, start.symbol, timeframe, startIsKnown && timeframe === requestedTimeframe ? speculativeBars : null);
  } catch (error) {
    showStatus(String(error.message || error), true);
  }
}

boot();
