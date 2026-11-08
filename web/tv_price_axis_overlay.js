import { CHART_THEME, lastBarColour } from "./tv_chart_setup.js";

const AXIS_LABEL_LEFT_PADDING = 9.5;
const TAG_VERTICAL_PADDING = 4;
const TAG_LINE_GAP = 3;
const ROUND_NUMBER_EPSILON = 1e-7;

function majorStepFor(tickStep) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(tickStep)));
  const leading = Math.round((tickStep / magnitude) * 10) / 10;
  if (leading === 1) return tickStep * 5;
  if (leading === 2 || leading === 2.5) return magnitude * 10;
  if (leading === 5) return tickStep * 2;
  return tickStep * 5;
}

function isMultipleOf(value, step) {
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < ROUND_NUMBER_EPSILON * Math.max(1, Math.abs(ratio));
}

function twoDigits(number) {
  return String(number).padStart(2, "0");
}

export function countdownText(secondsRemaining) {
  const seconds = Math.max(0, Math.floor(secondsRemaining));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${twoDigits(hours)}h`;
  if (hours > 0) return `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds % 60)}`;
  return `${twoDigits(minutes)}:${twoDigits(seconds % 60)}`;
}

export function secondsUntilBarClose(lastBarTime, timeframeSeconds, nowSeconds) {
  if (!timeframeSeconds) return 0;
  if (timeframeSeconds >= 28 * 86400) {
    const close = new Date(lastBarTime * 1000);
    close.setUTCMonth(close.getUTCMonth() + 1);
    while (close.getTime() / 1000 <= nowSeconds) close.setUTCMonth(close.getUTCMonth() + 1);
    return close.getTime() / 1000 - nowSeconds;
  }
  let closeTime = lastBarTime + timeframeSeconds;
  if (closeTime <= nowSeconds) closeTime += Math.ceil((nowSeconds - closeTime + 1) / timeframeSeconds) * timeframeSeconds;
  return closeTime - nowSeconds;
}

export function installPriceAxisOverlay({ candleSeries, getLastBar, getTimeframeSeconds }) {
  const fontSize = CHART_THEME.axisFontSize;
  const tagHeight = fontSize * 2 + TAG_LINE_GAP + TAG_VERTICAL_PADDING * 2;
  let formatPrice = (price) => String(price);
  let boldTickPrices = [];
  let attachedHost = null;
  let drawnCountdown = "";

  function currentCountdownText(lastBar) {
    return countdownText(secondsUntilBarClose(lastBar.time, getTimeframeSeconds(), Date.now() / 1000));
  }

  function repaintWhenCountdownTicks() {
    const lastBar = getLastBar();
    if (document.hidden || !lastBar || currentCountdownText(lastBar) === drawnCountdown) return;
    attachedHost?.requestUpdate();
  }

  function lastPriceY() {
    const lastBar = getLastBar();
    return lastBar ? candleSeries.priceToCoordinate(lastBar.close) : null;
  }

  function tagSpan(y) {
    const top = y - fontSize / 2 - TAG_VERTICAL_PADDING;
    return { top, bottom: top + tagHeight };
  }

  function tickLabels(prices) {
    const tagY = lastPriceY();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    let tickStep = 0;
    for (let index = 1; index < sortedPrices.length; index++) {
      const gap = sortedPrices[index] - sortedPrices[index - 1];
      if (gap > 0 && (!tickStep || gap < tickStep)) tickStep = gap;
    }
    const majorStep = tickStep ? majorStepFor(tickStep) : 0;
    boldTickPrices = [];
    return prices.map((price) => {
      const y = candleSeries.priceToCoordinate(price);
      if (tagY !== null && y !== null) {
        const span = tagSpan(tagY);
        if (y > span.top - fontSize / 2 - 1 && y < span.bottom + fontSize / 2 + 1) return "";
      }
      if (majorStep && isMultipleOf(price, majorStep)) {
        boldTickPrices.push(price);
        return "";
      }
      return formatPrice(price);
    });
  }

  function drawOnPriceAxis(target) {
    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      context.save();
      context.textBaseline = "middle";
      context.textAlign = "left";
      context.fillStyle = CHART_THEME.axisText;
      context.font = `bold ${fontSize}px ${CHART_THEME.fontFamily}`;
      for (const price of boldTickPrices) {
        const y = candleSeries.priceToCoordinate(price);
        if (y !== null) context.fillText(formatPrice(price), AXIS_LABEL_LEFT_PADDING, y);
      }
      const lastBar = getLastBar();
      const tagY = lastPriceY();
      if (lastBar && tagY !== null) {
        const span = tagSpan(tagY);
        context.fillStyle = lastBarColour(lastBar);
        context.fillRect(0, span.top, mediaSize.width, tagHeight);
        context.fillStyle = "#ffffff";
        context.font = `${fontSize}px ${CHART_THEME.fontFamily}`;
        context.fillText(formatPrice(lastBar.close), AXIS_LABEL_LEFT_PADDING, tagY);
        drawnCountdown = currentCountdownText(lastBar);
        context.fillText(drawnCountdown, AXIS_LABEL_LEFT_PADDING, tagY + fontSize + TAG_LINE_GAP);
      }
      context.restore();
    });
  }

  const axisPaneView = { zOrder: () => "normal", renderer: () => ({ draw: drawOnPriceAxis }) };
  const primitive = {
    attached(host) { attachedHost = host; },
    detached() { attachedHost = null; },
    updateAllViews() {},
    paneViews: () => [],
    priceAxisPaneViews: () => [axisPaneView],
  };
  candleSeries.attachPrimitive(primitive);
  window.setInterval(repaintWhenCountdownTicks, 1000);

  return {
    setPricePrecision(precision, formatter) {
      formatPrice = formatter;
      const minMove = Number((1 / Math.pow(10, precision)).toFixed(precision));
      candleSeries.applyOptions({ priceFormat: { type: "custom", minMove, formatter, tickmarksFormatter: tickLabels } });
    },
    redraw() { attachedHost?.requestUpdate(); },
  };
}
