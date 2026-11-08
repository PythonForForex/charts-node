export const BOLLINGER_LENGTH = 200;
export const BOLLINGER_MULTIPLIER = 2;

export function computeBollingerBands(bars, length = BOLLINGER_LENGTH, multiplier = BOLLINGER_MULTIPLIER) {
  const upper = [];
  const lower = [];
  const basis = [];
  let runningSum = 0;
  let runningSumOfSquares = 0;
  for (let index = 0; index < bars.length; index++) {
    const close = bars[index].close;
    runningSum += close;
    runningSumOfSquares += close * close;
    if (index >= length) {
      const leaving = bars[index - length].close;
      runningSum -= leaving;
      runningSumOfSquares -= leaving * leaving;
    }
    if (index < length - 1) {
      upper.push({ time: bars[index].time });
      lower.push({ time: bars[index].time });
      basis.push({ time: bars[index].time });
      continue;
    }
    const mean = runningSum / length;
    const variance = Math.max(0, runningSumOfSquares / length - mean * mean);
    const deviation = Math.sqrt(variance) * multiplier;
    upper.push({ time: bars[index].time, value: mean + deviation });
    lower.push({ time: bars[index].time, value: mean - deviation });
    basis.push({ time: bars[index].time, value: mean });
  }
  return { upper, lower, basis };
}

export function makeBandFillPrimitive(fillColour) {
  let attachedHost = null;
  let upperPoints = [];
  let lowerPoints = [];

  function drawBackground(target) {
    if (!attachedHost || upperPoints.length < 2) return;
    const timeScale = attachedHost.chart.timeScale();
    const visibleRange = timeScale.getVisibleLogicalRange();
    if (!visibleRange) return;
    const firstIndex = Math.max(0, Math.floor(visibleRange.from) - 1);
    const lastIndex = Math.min(upperPoints.length - 1, Math.ceil(visibleRange.to) + 1);
    const topEdge = [];
    const bottomEdge = [];
    for (let index = firstIndex; index <= lastIndex; index++) {
      const upperValue = upperPoints[index].value;
      const lowerValue = lowerPoints[index].value;
      if (upperValue === undefined || lowerValue === undefined) continue;
      const x = timeScale.logicalToCoordinate(index);
      const upperY = attachedHost.series.priceToCoordinate(upperValue);
      const lowerY = attachedHost.series.priceToCoordinate(lowerValue);
      if (x === null || upperY === null || lowerY === null) continue;
      topEdge.push([x, upperY]);
      bottomEdge.push([x, lowerY]);
    }
    if (topEdge.length < 2) return;
    target.useMediaCoordinateSpace(({ context }) => {
      context.beginPath();
      topEdge.forEach(([x, y], position) => (position ? context.lineTo(x, y) : context.moveTo(x, y)));
      for (let position = bottomEdge.length - 1; position >= 0; position--) context.lineTo(bottomEdge[position][0], bottomEdge[position][1]);
      context.closePath();
      context.fillStyle = fillColour;
      context.fill();
    });
  }

  const paneView = { zOrder: () => "bottom", renderer: () => ({ draw: () => {}, drawBackground }) };
  return {
    attached(host) { attachedHost = host; },
    detached() { attachedHost = null; },
    updateAllViews() {},
    paneViews: () => [paneView],
    setBand(upper, lower) {
      upperPoints = upper;
      lowerPoints = lower;
      attachedHost?.requestUpdate();
    },
  };
}
