export const DRAWING_TOOL_GROUPS = [
  { title: "Trend tools / Lines", tools: [
    { kind: "trend-line", name: "Trendline" },
    { kind: "ray", name: "Ray" },
    { kind: "info-line", name: "Info line" },
    { kind: "extended-line", name: "Extended line" },
    { kind: "trend-angle", name: "Trend angle" },
    { kind: "horizontal-line", name: "Horizontal line" },
    { kind: "horizontal-ray", name: "Horizontal ray" },
    { kind: "vertical-line", name: "Vertical line" },
    { kind: "cross-line", name: "Cross line" },
  ] },
  { title: "Trend tools / Channels", tools: [
    { kind: "parallel-channel", name: "Parallel channel" },
    { kind: "regression-trend", name: "Regression trend" },
    { kind: "flat-top-bottom", name: "Flat top/bottom" },
    { kind: "disjoint-channel", name: "Disjoint channel" },
  ] },
  { title: "Trend tools / Pitchforks", tools: [
    { kind: "pitchfork", name: "Pitchfork" },
    { kind: "schiff-pitchfork", name: "Schiff pitchfork" },
    { kind: "modified-schiff-pitchfork", name: "Modified Schiff pitchfork" },
    { kind: "inside-pitchfork", name: "Inside pitchfork" },
  ] },
  { title: "Gann and Fibonacci tools / Fibonacci", tools: [
    { kind: "fib-retracement", name: "Fib retracement" },
    { kind: "trend-based-fib-extension", name: "Trend-based fib extension" },
    { kind: "fib-channel", name: "Fib channel" },
    { kind: "fib-time-zone", name: "Fib time zone" },
    { kind: "fib-speed-resistance-fan", name: "Fib speed resistance fan" },
    { kind: "trend-based-fib-time", name: "Trend-based fib time" },
    { kind: "fib-circles", name: "Fib circles" },
    { kind: "fib-spiral", name: "Fib spiral" },
    { kind: "fib-speed-resistance-arcs", name: "Fib speed resistance arcs" },
    { kind: "fib-wedge", name: "Fib wedge" },
    { kind: "pitchfan", name: "Pitchfan" },
  ] },
  { title: "Gann and Fibonacci tools / Gann", tools: [
    { kind: "gann-box", name: "Gann box" },
    { kind: "gann-square-fixed", name: "Gann square fixed" },
    { kind: "gann-square", name: "Gann square" },
    { kind: "gann-fan", name: "Gann fan" },
  ] },
  { title: "Patterns / Chart patterns", tools: [
    { kind: "xabcd-pattern", name: "XABCD pattern" },
    { kind: "cypher-pattern", name: "Cypher pattern" },
    { kind: "head-and-shoulders", name: "Head and shoulders" },
    { kind: "abcd-pattern", name: "ABCD pattern" },
    { kind: "triangle-pattern", name: "Triangle pattern" },
    { kind: "three-drives-pattern", name: "Three drives pattern" },
  ] },
  { title: "Patterns / Elliott waves", tools: [
    { kind: "elliott-impulse", name: "Elliott impulse wave (1·2·3·4·5)" },
    { kind: "elliott-correction", name: "Elliott correction wave (A·B·C)" },
    { kind: "elliott-triangle", name: "Elliott triangle wave (A·B·C·D·E)" },
    { kind: "elliott-double-combo", name: "Elliott double combo wave (W·X·Y)" },
    { kind: "elliott-triple-combo", name: "Elliott triple combo wave (W·X·Y·X·Z)" },
  ] },
  { title: "Patterns / Cycles", tools: [
    { kind: "cyclic-lines", name: "Cyclic lines" },
    { kind: "time-cycles", name: "Time cycles" },
    { kind: "sine-line", name: "Sine line" },
  ] },
  { title: "Forecasting and measurement tools / Forecasting", tools: [
    { kind: "long-position", name: "Long position" },
    { kind: "short-position", name: "Short position" },
    { kind: "position-forecast", name: "Position forecast" },
    { kind: "bar-pattern", name: "Bars pattern" },
    { kind: "ghost-feed", name: "Ghost feed" },
    { kind: "sector", name: "Sector" },
  ] },
  { title: "Forecasting and measurement tools / Volume-based", tools: [
    { kind: "anchored-vwap", name: "Anchored VWAP" },
    { kind: "fixed-range-volume-profile", name: "Fixed range volume profile" },
    { kind: "anchored-volume-profile", name: "Anchored volume profile" },
  ] },
  { title: "Forecasting and measurement tools / Measurers", tools: [
    { kind: "price-range", name: "Price range" },
    { kind: "date-range", name: "Date range" },
    { kind: "date-and-price-range", name: "Date and price range" },
  ] },
  { title: "Geometric shapes / Brushes", tools: [
    { kind: "brush", name: "Brush" },
    { kind: "highlighter", name: "Highlighter" },
  ] },
  { title: "Geometric shapes / Arrows", tools: [
    { kind: "arrow-marker", name: "Arrow marker" },
    { kind: "arrow", name: "Arrow" },
    { kind: "arrow-mark-up", name: "Arrow mark up" },
    { kind: "arrow-mark-down", name: "Arrow mark down" },
  ] },
  { title: "Geometric shapes / Shapes", tools: [
    { kind: "rectangle", name: "Rectangle" },
    { kind: "rotated-rectangle", name: "Rotated rectangle" },
    { kind: "path", name: "Path" },
    { kind: "circle", name: "Circle" },
    { kind: "ellipse", name: "Ellipse" },
    { kind: "polyline", name: "Polyline" },
    { kind: "triangle", name: "Triangle" },
    { kind: "arc", name: "Arc" },
    { kind: "curve", name: "Curve" },
    { kind: "double-curve", name: "Double curve" },
  ] },
  { title: "Annotation tools / Text and notes", tools: [
    { kind: "text", name: "Text" },
    { kind: "note", name: "Note" },
    { kind: "price-note", name: "Price note" },
    { kind: "pin", name: "Pin" },
    { kind: "table", name: "Table" },
    { kind: "callout", name: "Callout" },
    { kind: "comment", name: "Comment" },
    { kind: "price-label", name: "Price label" },
    { kind: "signpost", name: "Signpost" },
    { kind: "flag-mark", name: "Flag mark" },
  ] },
  { title: "Annotation tools / Content", tools: [
    { kind: "image", name: "Image" },
  ] },
  { title: "Not in the TradingView toolbar", tools: [
    { kind: "font-icon", name: "Font icon" },
  ] },
];

export const TOOLS_THE_HOST_CANNOT_PLACE = new Set(["image"]);

export function drawingToolName(kind) {
  for (const group of DRAWING_TOOL_GROUPS) for (const tool of group.tools) if (tool.kind === kind) return tool.name;
  return kind;
}
