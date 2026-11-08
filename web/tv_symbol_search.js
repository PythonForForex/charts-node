import { ICONS } from "./tv_icons.js";
import { openBottomSheet, closeAnySheet } from "./tv_sheet.js";

const SEARCH_RESULT_LIMIT = 80;

const TIMEFRAME_SECONDS_BY_NAME = {
  S5: 5, "5s": 5, "1m": 60, M1: 60, "5m": 300, M5: 300, "15m": 900, M15: 900, "30m": 1800, M30: 1800,
  H1: 3600, "1h": 3600, "4h": 14400, H4: 14400, D: 86400, "1d": 86400, "1w": 604800, W: 604800, "1mo": 2592000, M: 2592000,
};

const TIMEFRAME_LABEL_BY_NAME = {
  S5: "5s", "5s": "5s", "1m": "1m", M1: "1m", "5m": "5m", M5: "5m", "15m": "15m", M15: "15m", "30m": "30m", M30: "30m",
  H1: "1h", "1h": "1h", "4h": "4h", H4: "4h", D: "1D", "1d": "1D", "1w": "1W", W: "1W", "1mo": "1M", M: "1M",
};

export function timeframeSeconds(name) {
  return TIMEFRAME_SECONDS_BY_NAME[name] || 0;
}

export function timeframeLabel(name) {
  return TIMEFRAME_LABEL_BY_NAME[name] || name;
}

export function sortedTimeframes(names) {
  return [...names].sort((a, b) => timeframeSeconds(a) - timeframeSeconds(b));
}

function searchRank(instrument, query) {
  const symbol = instrument.symbol.toLowerCase();
  const venue = instrument.venue.toLowerCase();
  const compactSymbol = symbol.replace(/[^a-z0-9]/g, "");
  const compactQuery = query.replace(/[^a-z0-9]/g, "");
  let rank = -1;
  if (symbol === query || compactSymbol === compactQuery) rank = 0;
  else if (symbol.startsWith(query) || compactSymbol.startsWith(compactQuery)) rank = 1;
  else if (symbol.includes(query) || (compactQuery && compactSymbol.includes(compactQuery))) rank = 2;
  else if (`${venue}/${symbol}`.includes(query)) rank = 3;
  if (rank >= 0 && venue.startsWith("syn_")) rank += 4;
  return rank;
}

export function createInstrumentHeader({ symbolButton, timeframeStrip, getInstruments, onPickInstrument, onPickTimeframe }) {
  symbolButton.addEventListener("click", openSearch);

  function openSearch() {
    const content = document.createElement("div");
    content.className = "tv-search";
    const inputRow = document.createElement("label");
    inputRow.className = "tv-search-input";
    inputRow.innerHTML = ICONS.search;
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Symbol, e.g. XAU_USD, BTC, EUR";
    input.autocapitalize = "characters";
    input.autocomplete = "off";
    input.spellcheck = false;
    inputRow.append(input);
    const results = document.createElement("div");
    results.className = "tv-search-results";
    content.append(inputRow, results);

    function render() {
      const query = input.value.trim().toLowerCase();
      results.replaceChildren();
      const instruments = getInstruments();
      const matches = [];
      for (const instrument of instruments) {
        const rank = query ? searchRank(instrument, query) : (instrument.venue === "oanda" ? 0 : -1);
        if (rank >= 0) matches.push({ instrument, rank });
      }
      matches.sort((a, b) => a.rank - b.rank || a.instrument.symbol.localeCompare(b.instrument.symbol));
      for (const { instrument } of matches.slice(0, SEARCH_RESULT_LIMIT)) {
        const row = document.createElement("button");
        row.className = "tv-search-row";
        row.dataset.venue = instrument.venue;
        row.dataset.symbol = instrument.symbol;
        row.innerHTML = `<span class="tv-search-symbol"></span><span class="tv-search-venue"></span>`;
        row.querySelector(".tv-search-symbol").textContent = instrument.symbol;
        row.querySelector(".tv-search-venue").textContent = instrument.venue;
        results.append(row);
      }
      if (!matches.length) results.textContent = "No match.";
    }

    input.addEventListener("input", render);
    results.addEventListener("click", (event) => {
      const row = event.target.closest(".tv-search-row");
      if (!row) return;
      closeAnySheet();
      onPickInstrument(row.dataset.venue, row.dataset.symbol);
    });
    render();
    openBottomSheet("Symbol search", content);
    input.focus();
  }

  timeframeStrip.addEventListener("click", (event) => {
    const chip = event.target.closest(".tv-tf-chip");
    if (chip) onPickTimeframe(chip.dataset.tf);
  });

  return {
    show(venue, symbol, timeframes, activeTimeframe) {
      symbolButton.innerHTML = `<span class="tv-symbol-name"></span><span class="tv-symbol-venue"></span>`;
      symbolButton.querySelector(".tv-symbol-name").textContent = symbol;
      symbolButton.querySelector(".tv-symbol-venue").textContent = venue;
      timeframeStrip.replaceChildren();
      for (const name of sortedTimeframes(timeframes)) {
        const chip = document.createElement("button");
        chip.className = "tv-tf-chip";
        chip.dataset.tf = name;
        chip.textContent = timeframeLabel(name);
        chip.classList.toggle("is-active", name === activeTimeframe);
        timeframeStrip.append(chip);
      }
      timeframeStrip.querySelector(".is-active")?.scrollIntoView({ inline: "center", block: "nearest" });
    },
  };
}
