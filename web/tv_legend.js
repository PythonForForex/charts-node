import { timeframeLabel } from "./tv_symbol_search.js";

const READABLE_NAME_BY_CODE = {
  XAU: "Gold Spot", XAG: "Silver Spot", XPT: "Platinum Spot", XPD: "Palladium Spot", XCU: "Copper",
  USD: "U.S. Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen", CHF: "Swiss Franc",
  AUD: "Australian Dollar", NZD: "New Zealand Dollar", CAD: "Canadian Dollar", CNH: "Chinese Yuan",
  HKD: "Hong Kong Dollar", SGD: "Singapore Dollar", THB: "Thai Baht", SEK: "Swedish Krona",
  NOK: "Norwegian Krone", DKK: "Danish Krone", MXN: "Mexican Peso", ZAR: "South African Rand",
  TRY: "Turkish Lira", PLN: "Polish Zloty", HUF: "Hungarian Forint", CZK: "Czech Koruna",
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", USDT: "Tether", USDC: "USD Coin",
  SPX500: "S&P 500", NAS100: "US Nas 100", US30: "US Wall St 30", US2000: "US Russell 2000",
  DE30: "Germany 30", DE40: "Germany 40", UK100: "UK 100", JP225: "Japan 225", HK33: "Hong Kong 33",
  BCO: "Brent Crude Oil", WTICO: "WTI Crude Oil", NATGAS: "Natural Gas",
};

const QUOTE_CODES_FOR_GLUED_SYMBOLS = ["USDT", "USDC", "USD", "THB", "BTC", "ETH"];
const MINUS_SIGN = "−";

function splitSymbolIntoCodes(symbol) {
  const separated = symbol.toUpperCase().split(/[_/:-]/).filter(Boolean);
  if (separated.length > 1) return separated.slice(-2);
  const glued = separated[0] || "";
  const quote = QUOTE_CODES_FOR_GLUED_SYMBOLS.find((code) => glued.endsWith(code) && glued.length > code.length);
  return quote ? [glued.slice(0, -quote.length), quote] : [glued];
}

export function readableInstrumentName(symbol) {
  const codes = splitSymbolIntoCodes(symbol);
  const names = codes.map((code) => READABLE_NAME_BY_CODE[code]);
  if (!names[0]) return symbol;
  if (codes.length === 1) return names[0];
  return `${names[0]} / ${names[1] || codes[1]}`;
}

function signedText(value, text) {
  return value < 0 ? `${MINUS_SIGN}${text.replace("-", "")}` : `+${text}`;
}

export function createLegend({ titleElement, priceElement }) {
  return {
    showInstrument(symbol, timeframe) {
      titleElement.textContent = `${readableInstrumentName(symbol)} · ${timeframeLabel(timeframe)}`;
      priceElement.textContent = "";
    },
    showQuote(lastPrice, previousClose, formatPrice) {
      if (!Number.isFinite(lastPrice)) { priceElement.textContent = ""; return; }
      if (!Number.isFinite(previousClose) || previousClose === 0) { priceElement.textContent = formatPrice(lastPrice); return; }
      const change = lastPrice - previousClose;
      const changePercent = ((change / previousClose) * 100).toFixed(2);
      priceElement.textContent = `${formatPrice(lastPrice)}  ${signedText(change, formatPrice(change))} (${signedText(change, changePercent)}%)`;
    },
  };
}
