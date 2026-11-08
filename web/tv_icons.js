const STROKE_ATTRIBUTES = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

function svgIcon(innerMarkup, viewBoxSize = 28) {
  return `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${viewBoxSize}" height="${viewBoxSize}" aria-hidden="true" ${STROKE_ATTRIBUTES}>${innerMarkup}</svg>`;
}

function node(x, y) {
  return `<circle cx="${x}" cy="${y}" r="2.4" fill="none"/>`;
}

export const ICONS = {
  grip: `<svg viewBox="0 0 12 28" width="12" height="28" aria-hidden="true" fill="currentColor"><circle cx="3" cy="8" r="1.6"/><circle cx="9" cy="8" r="1.6"/><circle cx="3" cy="14" r="1.6"/><circle cx="9" cy="14" r="1.6"/><circle cx="3" cy="20" r="1.6"/><circle cx="9" cy="20" r="1.6"/></svg>`,
  "trend-line": svgIcon(`${node(6, 22)}${node(22, 6)}<path d="M7.7 20.3 20.3 7.7"/>`),
  ray: svgIcon(`${node(6, 20)}<path d="M8 18.8 25 9"/>${node(15, 14.6)}`),
  "horizontal-ray": svgIcon(`${node(7, 14)}<path d="M9.4 14H26"/>`),
  "horizontal-line": svgIcon(`<path d="M2 14h9.6M16.4 14H26"/>${node(14, 14)}`),
  "parallel-channel": svgIcon(`${node(5, 15)}${node(16, 6)}<path d="M6.9 13.5 14.1 7.5"/><path d="M11.9 21.5 23 12.5"/>${node(10, 23)}<path d="M5 25 2 27"/>`),
  "fib-retracement": svgIcon(`<path d="M8 6h17M3 11h22M3 16h22M8 21h17"/>${node(5, 6)}${node(5, 21)}`),
  pitchfork: svgIcon(`${node(5, 14)}<path d="M7.4 14H14"/><path d="M14 7v14M14 7h11M14 14h11M14 21h11"/>${node(14, 7)}${node(14, 21)}`),
  more: svgIcon(`<circle cx="7" cy="14" r="1.6" fill="currentColor" stroke="none"/><circle cx="14" cy="14" r="1.6" fill="currentColor" stroke="none"/><circle cx="21" cy="14" r="1.6" fill="currentColor" stroke="none"/>`),
  crosshair: svgIcon(`<path d="M4 14h7.5M16.5 14H24"/>${node(14, 14)}`),
  magnet: svgIcon(`<path d="M8 6v9a6 6 0 0 0 12 0V6"/><path d="M8 6h4v9a2 2 0 0 0 4 0V6h4"/><path d="M8 10h4M16 10h4"/>`),
  pencil: svgIcon(`<path d="M5 23l1.2-5L18 6.2a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8L10 21.8 5 23z"/><path d="M16 8.2l3.8 3.8"/>`),
  lock: svgIcon(`<rect x="7" y="13" width="14" height="10" rx="2"/><path d="M10 13V9.5a4 4 0 0 1 8 0V13"/>`),
  unlock: svgIcon(`<rect x="7" y="13" width="14" height="10" rx="2"/><path d="M10 13V9.5a4 4 0 0 1 7.6-1.7"/>`),
  eye: svgIcon(`<path d="M3 14s4-7 11-7 11 7 11 7-4 7-11 7S3 14 3 14z"/><circle cx="14" cy="14" r="3.4"/>`),
  "eye-off": svgIcon(`<path d="M3 14s4-7 11-7 11 7 11 7-4 7-11 7S3 14 3 14z"/><circle cx="14" cy="14" r="3.4"/><path d="M5 23 23 5"/>`),
  layers: svgIcon(`<path d="M14 5 25 11 14 17 3 11z"/><path d="M3 16l11 6 11-6"/>`),
  fullscreen: svgIcon(`<path d="M5 10V5h5M18 5h5v5M23 18v5h-5M10 23H5v-5"/>`),
  "exit-fullscreen": svgIcon(`<path d="M10 5v5H5M23 10h-5V5M18 23v-5h5M5 18h5v5"/>`),
  trash: svgIcon(`<path d="M5 8h18M11 8V5.5h6V8M7.5 8l1 15h11l1-15"/><path d="M12 12v7M16 12v7"/>`),
  close: svgIcon(`<path d="M7 7l14 14M21 7 7 21"/>`),
  "chevron-up": svgIcon(`<path d="M8 17l6-6 6 6"/>`),
  "chevron-down": svgIcon(`<path d="M8 11l6 6 6-6"/>`),
  search: svgIcon(`<circle cx="12.5" cy="12.5" r="6.5"/><path d="M17.5 17.5 23 23"/>`),
};

export function iconFor(kind) {
  return ICONS[kind] || svgIcon(`${node(6, 22)}${node(22, 6)}<path d="M7.7 20.3 20.3 7.7"/>`);
}
