import { OVERLAY_SPECS, hitTestKind } from "./vendor/lightweight-charts-drawing.es.js";

export const FINGER_OFFSET_PIXELS = 70;
const DRAWING_PROBE_RADII = [0, 6, 12, 18, 24];
const PROBE_DIRECTIONS = 8;
const ANCHOR_LIFT_TRAVEL_PIXELS = 40;
const MAGNET_WEAK_RADIUS_PIXELS = 50;
const SYNTHETIC_POINTER_ID = 7001;

const syntheticPointerEvents = new WeakSet();

function probeOffsets() {
  const offsets = [];
  for (const radius of DRAWING_PROBE_RADII) {
    if (radius === 0) { offsets.push({ x: 0, y: 0 }); continue; }
    for (let step = 0; step < PROBE_DIRECTIONS; step++) {
      const angle = (step / PROBE_DIRECTIONS) * Math.PI * 2;
      offsets.push({ x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) });
    }
  }
  return offsets;
}

const PROBE_OFFSETS = probeOffsets();

export function installTouchOffsetLayer({ wrapperElement, chart, candleSeries, drawingManager, coords, getMagnetMode, isCrosshairInspectOn, crosshairDotElement, onPlacementStep }) {
  const chartElement = chart.chartElement();
  let gesture = null;
  let swallowTouchSequence = false;
  let savedPanZoomOptions = null;

  function paneGeometry() {
    const paneElement = candleSeries.getPane().getHTMLElement();
    const chartRect = chartElement.getBoundingClientRect();
    const paneRect = (paneElement || chartElement).getBoundingClientRect();
    const wrapperRect = wrapperElement.getBoundingClientRect();
    const size = chart.paneSize(0);
    return { left: chartRect.left + chart.priceScale("left").width(), top: paneRect.top, width: size.width, height: size.height, wrapperLeft: wrapperRect.left, wrapperTop: wrapperRect.top };
  }

  function toPanePoint(clientX, clientY, geometry) {
    return { x: clientX - geometry.left, y: clientY - geometry.top };
  }

  function toClientPoint(panePoint, geometry) {
    return { x: panePoint.x + geometry.left, y: panePoint.y + geometry.top };
  }

  function insidePane(panePoint, geometry) {
    return panePoint.x >= 0 && panePoint.x <= geometry.width && panePoint.y >= 0 && panePoint.y <= geometry.height;
  }

  function clampToPane(panePoint, geometry) {
    return { x: Math.min(Math.max(panePoint.x, 0), geometry.width - 1), y: Math.min(Math.max(panePoint.y, 0), geometry.height - 1) };
  }

  function dispatchSyntheticPointer(type, clientPoint, buttons) {
    const event = new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true,
      clientX: clientPoint.x, clientY: clientPoint.y,
      pointerId: SYNTHETIC_POINTER_ID, pointerType: "mouse", isPrimary: true,
      button: type === "pointermove" ? -1 : 0, buttons,
    });
    syntheticPointerEvents.add(event);
    chartElement.dispatchEvent(event);
  }

  function magnetSnappedPoint(panePoint, magnetMode) {
    const time = coords.xToTime(panePoint.x);
    const bar = time === null ? null : coords.barAt(time);
    const freePrice = coords.yToPrice(panePoint.y);
    if (!bar || magnetMode === "off") return { panePoint, price: freePrice, barTime: bar ? bar.time : null };
    let bestPrice = bar.open;
    let bestDistance = Infinity;
    for (const candidate of [bar.open, bar.high, bar.low, bar.close]) {
      const candidateY = coords.priceToY(candidate);
      const distance = candidateY === null ? Infinity : Math.abs(candidateY - panePoint.y);
      if (distance < bestDistance) { bestDistance = distance; bestPrice = candidate; }
    }
    if (magnetMode === "weak" && bestDistance >= MAGNET_WEAK_RADIUS_PIXELS) return { panePoint, price: freePrice, barTime: bar.time };
    const snappedY = coords.priceToY(bestPrice);
    const snappedX = coords.timeToX(time);
    return { panePoint: { x: snappedX ?? panePoint.x, y: snappedY ?? panePoint.y }, price: bestPrice, barTime: bar.time };
  }

  function showCrosshairAt(panePoint, geometry, applyMagnet) {
    const snapped = magnetSnappedPoint(panePoint, applyMagnet ? getMagnetMode() : "off");
    if (snapped.price !== null && snapped.barTime !== null) chart.setCrosshairPosition(snapped.price, snapped.barTime, candleSeries);
    const client = toClientPoint(snapped.panePoint, geometry);
    crosshairDotElement.style.transform = `translate(${client.x - geometry.wrapperLeft}px, ${client.y - geometry.wrapperTop}px)`;
    if (crosshairDotElement.hidden) crosshairDotElement.hidden = false;
  }

  function hideCrosshair() {
    crosshairDotElement.hidden = true;
    chart.clearCrosshairPosition();
  }

  function suspendPanZoom() {
    if (savedPanZoomOptions) return;
    const options = chart.options();
    savedPanZoomOptions = { handleScroll: structuredClone(options.handleScroll), handleScale: structuredClone(options.handleScale) };
    chart.applyOptions({ handleScroll: false, handleScale: false });
  }

  function restorePanZoom() {
    if (!savedPanZoomOptions) return;
    chart.applyOptions(savedPanZoomOptions);
    savedPanZoomOptions = null;
  }

  function screenPointsOf(drawing) {
    const points = [];
    for (const dataPoint of drawing.points || []) {
      const x = coords.timeToX(dataPoint.time);
      const y = coords.priceToY(dataPoint.price);
      if (x === null || y === null) return null;
      points.push({ x, y });
    }
    return points;
  }

  function findDrawingUnderFinger(fingerPanePoint, geometry) {
    if (!drawingManager.drawingsVisible()) return null;
    const selectedIds = drawingManager.selection();
    const candidates = [];
    const all = drawingManager.drawings();
    for (let index = all.length - 1; index >= 0; index--) {
      const drawing = all[index];
      if (drawing.hidden || drawing.anchored) continue;
      const points = screenPointsOf(drawing);
      if (points) candidates.push({ drawing, points, selected: selectedIds.includes(drawing.id) });
    }
    const hitAt = (probe, candidate) => {
      if (!insidePane(probe, geometry)) return null;
      return hitTestKind(candidate.drawing, candidate.points, probe, geometry.width, geometry.height, coords, candidate.selected);
    };
    let bodyHit = null;
    for (const offset of PROBE_OFFSETS) {
      const probe = { x: fingerPanePoint.x + offset.x, y: fingerPanePoint.y + offset.y };
      for (const candidate of candidates) {
        const hit = hitAt(probe, candidate);
        if (hit && hit.hit === "handle") return { drawing: candidate.drawing, probe, isHandle: true };
        if (hit && !bodyHit) bodyHit = { drawing: candidate.drawing, probe, isHandle: false };
      }
    }
    for (const offset of PROBE_OFFSETS) {
      const probe = { x: fingerPanePoint.x + offset.x, y: fingerPanePoint.y - FINGER_OFFSET_PIXELS + offset.y };
      for (const candidate of candidates) {
        if (!candidate.selected) continue;
        const hit = hitAt(probe, candidate);
        if (hit && hit.hit === "handle") return { drawing: candidate.drawing, probe, isHandle: true };
      }
    }
    return bodyHit;
  }

  function aimedPanePoint(fingerPanePoint, geometry) {
    return clampToPane({ x: fingerPanePoint.x, y: fingerPanePoint.y - FINGER_OFFSET_PIXELS }, geometry);
  }

  function dragTargetPanePoint(fingerPanePoint, fingerClient) {
    const travel = Math.hypot(fingerClient.x - gesture.startClient.x, fingerClient.y - gesture.startClient.y);
    let delta = gesture.initialDelta;
    if (gesture.isHandle) {
      const lift = Math.min(1, travel / ANCHOR_LIFT_TRAVEL_PIXELS);
      delta = { x: delta.x * (1 - lift), y: delta.y + (-FINGER_OFFSET_PIXELS - delta.y) * lift };
    }
    return clampToPane({ x: fingerPanePoint.x + delta.x, y: fingerPanePoint.y + delta.y }, gesture.geometry);
  }

  function swallow(event) {
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
  }

  function onPointerDown(event) {
    if (syntheticPointerEvents.has(event)) return;
    if (gesture) { if (event.pointerType === "touch") swallow(event); return; }
    if (event.pointerType !== "touch" || !chartElement.contains(event.target)) return;
    const geometry = paneGeometry();
    const finger = toPanePoint(event.clientX, event.clientY, geometry);
    if (!insidePane(finger, geometry)) return;
    const armedTool = drawingManager.tool();
    const startClient = { x: event.clientX, y: event.clientY };
    if (armedTool) {
      const freehand = !!OVERLAY_SPECS[armedTool]?.freehand;
      const target = aimedPanePoint(finger, geometry);
      gesture = { mode: "place", pointerId: event.pointerId, geometry, startClient, target, freehand };
      if (freehand) dispatchSyntheticPointer("pointerdown", toClientPoint(target, geometry), 1);
      else dispatchSyntheticPointer("pointermove", toClientPoint(target, geometry), 0);
      showCrosshairAt(target, geometry, !freehand);
    } else if (isCrosshairInspectOn()) {
      const target = aimedPanePoint(finger, geometry);
      gesture = { mode: "inspect", pointerId: event.pointerId, geometry, startClient, target };
      showCrosshairAt(target, geometry, true);
    } else {
      const hit = findDrawingUnderFinger(finger, geometry);
      if (!hit) return;
      const initialDelta = { x: hit.probe.x - finger.x, y: hit.probe.y - finger.y };
      gesture = { mode: "drag", pointerId: event.pointerId, geometry, startClient, target: hit.probe, initialDelta, isHandle: hit.isHandle };
      dispatchSyntheticPointer("pointerdown", toClientPoint(hit.probe, geometry), 1);
      if (hit.isHandle) showCrosshairAt(hit.probe, geometry, true);
    }
    swallowTouchSequence = true;
    suspendPanZoom();
    swallow(event);
  }

  function onPointerMove(event) {
    if (syntheticPointerEvents.has(event) || !gesture) return;
    if (event.pointerType === "touch") swallow(event);
    if (event.pointerId !== gesture.pointerId) return;
    const finger = toPanePoint(event.clientX, event.clientY, gesture.geometry);
    if (gesture.mode === "drag") {
      gesture.target = dragTargetPanePoint(finger, { x: event.clientX, y: event.clientY });
      dispatchSyntheticPointer("pointermove", toClientPoint(gesture.target, gesture.geometry), 1);
      if (gesture.isHandle) showCrosshairAt(gesture.target, gesture.geometry, true);
      return;
    }
    gesture.target = aimedPanePoint(finger, gesture.geometry);
    if (gesture.mode === "place") dispatchSyntheticPointer("pointermove", toClientPoint(gesture.target, gesture.geometry), gesture.freehand ? 1 : 0);
    showCrosshairAt(gesture.target, gesture.geometry, !gesture.freehand);
  }

  function finishGesture(event, committed) {
    if (syntheticPointerEvents.has(event) || !gesture) return;
    if (event.pointerType === "touch") swallow(event);
    if (event.pointerId !== gesture.pointerId) return;
    const finished = gesture;
    gesture = null;
    const targetClient = toClientPoint(finished.target, finished.geometry);
    if (finished.mode === "place" && finished.freehand) dispatchSyntheticPointer("pointerup", targetClient, 0);
    else if (finished.mode === "place" && committed) {
      dispatchSyntheticPointer("pointerdown", targetClient, 1);
      dispatchSyntheticPointer("pointerup", targetClient, 0);
    } else if (finished.mode === "drag") dispatchSyntheticPointer("pointerup", targetClient, 0);
    hideCrosshair();
    restorePanZoom();
    if (finished.mode === "place") onPlacementStep();
  }

  function onTouchEvent(event) {
    if (!swallowTouchSequence) return;
    swallow(event);
    if ((event.type === "touchend" || event.type === "touchcancel") && event.touches.length === 0) swallowTouchSequence = false;
  }

  wrapperElement.addEventListener("pointerdown", onPointerDown, { capture: true });
  wrapperElement.addEventListener("pointermove", onPointerMove, { capture: true });
  wrapperElement.addEventListener("pointerup", (event) => finishGesture(event, true), { capture: true });
  wrapperElement.addEventListener("pointercancel", (event) => finishGesture(event, false), { capture: true });
  for (const type of ["touchstart", "touchmove", "touchend", "touchcancel"]) {
    wrapperElement.addEventListener(type, onTouchEvent, { capture: true, passive: false });
  }

  return {
    isPlacing: () => gesture?.mode === "place",
  };
}
