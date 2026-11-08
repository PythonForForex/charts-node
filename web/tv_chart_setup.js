export const CHART_THEME = {
  background: "#adadad",
  axisText: "#ffffff",
  axisBorder: "#ffffff",
  candleUpBody: "#339e42",
  candleDownBody: "#cc1c17",
  candleUpBorder: "#1a3014",
  candleDownBorder: "#080504",
  candleWick: "#282829",
  crosshairLine: "#758696",
  crosshairLabelBackground: "#000000",
  bandBasisLine: "rgba(70, 70, 70, 1)",
  bandEdgeLine: "rgba(156, 156, 156, 1)",
  bandFill: "rgba(156, 156, 156, 0.4284)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
  axisFontSize: 12,
};

const CANDLE_BORDER_MINIMUM_BAR_SPACING = 6;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function twoDigits(number) {
  return String(number).padStart(2, "0");
}

export function crosshairTimeLabel(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  const year = String(date.getFullYear()).slice(2);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} '${year}  ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

function tickMarkLabel(epochSeconds, tickMarkType) {
  const date = new Date(epochSeconds * 1000);
  if (tickMarkType === 0) return String(date.getFullYear());
  if (tickMarkType === 1) return MONTH_NAMES[date.getMonth()];
  if (tickMarkType === 2) return String(date.getDate());
  return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}

export function pricePrecisionFromBars(bars) {
  let precision = 0;
  for (const bar of bars.slice(-300)) {
    for (const value of [bar.open, bar.high, bar.low, bar.close]) {
      const text = String(value);
      const dot = text.indexOf(".");
      if (dot >= 0) precision = Math.max(precision, text.length - dot - 1);
    }
  }
  return Math.min(precision, 8);
}

const THOUSANDS_SEPARATOR_PATTERN = /\B(?=(\d{3})+(?!\d))/g;

export function makePriceFormatter(precision) {
  return (price) => {
    const fixed = Math.abs(price).toFixed(precision);
    const dot = fixed.indexOf(".");
    const wholePart = (dot < 0 ? fixed : fixed.slice(0, dot)).replace(THOUSANDS_SEPARATOR_PATTERN, ",");
    const sign = price < 0 && Number(fixed) !== 0 ? "-" : "";
    return dot < 0 ? sign + wholePart : sign + wholePart + fixed.slice(dot);
  };
}

export function createTradingViewMobileChart(containerElement) {
  const LightweightCharts = window.LightweightCharts;
  const chart = LightweightCharts.createChart(containerElement, {
    autoSize: true,
    layout: {
      background: { type: "solid", color: CHART_THEME.background },
      textColor: CHART_THEME.axisText,
      fontSize: CHART_THEME.axisFontSize,
      fontFamily: CHART_THEME.fontFamily,
      attributionLogo: true,
    },
    grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    rightPriceScale: { borderColor: CHART_THEME.axisBorder, scaleMargins: { top: 0.08, bottom: 0.08 }, minimumWidth: 74 },
    timeScale: { borderColor: CHART_THEME.axisBorder, rightOffset: 8, barSpacing: 6, timeVisible: true, secondsVisible: false, tickMarkFormatter: tickMarkLabel },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: CHART_THEME.crosshairLine, style: LightweightCharts.LineStyle.Dashed, width: 1, labelBackgroundColor: CHART_THEME.crosshairLabelBackground },
      horzLine: { color: CHART_THEME.crosshairLine, style: LightweightCharts.LineStyle.Dashed, width: 1, labelBackgroundColor: CHART_THEME.crosshairLabelBackground },
    },
    localization: { timeFormatter: crosshairTimeLabel },
    kineticScroll: { touch: true, mouse: false },
  });
  const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
    upColor: CHART_THEME.candleUpBody,
    downColor: CHART_THEME.candleDownBody,
    borderUpColor: CHART_THEME.candleUpBorder,
    borderDownColor: CHART_THEME.candleDownBorder,
    wickUpColor: CHART_THEME.candleWick,
    wickDownColor: CHART_THEME.candleWick,
    lastValueVisible: false,
    priceLineVisible: true,
    priceLineSource: LightweightCharts.PriceLineSource.LastBar,
    priceLineColor: CHART_THEME.candleUpBody,
    priceLineStyle: LightweightCharts.LineStyle.Dotted,
    priceLineWidth: 1,
  });
  const lowerBandSeries = chart.addSeries(LightweightCharts.LineSeries, bandLineOptions(CHART_THEME.bandEdgeLine));
  const upperBandSeries = chart.addSeries(LightweightCharts.LineSeries, bandLineOptions(CHART_THEME.bandEdgeLine));
  const basisBandSeries = chart.addSeries(LightweightCharts.LineSeries, bandLineOptions(CHART_THEME.bandBasisLine));
  return { chart, candleSeries, upperBandSeries, lowerBandSeries, basisBandSeries };
}

export function hideCandleBordersWhenNarrow(chart, candleSeries) {
  let bordersVisible = true;
  chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
    const wide = chart.timeScale().options().barSpacing >= CANDLE_BORDER_MINIMUM_BAR_SPACING;
    if (wide === bordersVisible) return;
    bordersVisible = wide;
    candleSeries.applyOptions({ borderVisible: wide });
  });
}

export function lastBarColour(bar) {
  return bar && bar.close < bar.open ? CHART_THEME.candleDownBody : CHART_THEME.candleUpBody;
}

function bandLineOptions(colour) {
  return {
    color: colour,
    lineWidth: 1,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  };
}
