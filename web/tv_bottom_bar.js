import { ICONS } from "./tv_icons.js";

const MAGNET_MODES = ["off", "weak", "strong"];
const MAGNET_STORAGE_KEY = "tv.magnetMode";

function barButton(action, label, icon) {
  const button = document.createElement("button");
  button.className = "tv-bar-button";
  button.dataset.action = action;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = `${icon}<span class="tv-bar-badge"></span>`;
  return button;
}

export function storedMagnetMode() {
  const stored = localStorage.getItem(MAGNET_STORAGE_KEY);
  return MAGNET_MODES.includes(stored) ? stored : "weak";
}

export function createBottomBar({ barElement, drawingManager, drawingToolbar, onOpenLayers, onToggleFullscreen, isFullscreen }) {
  let magnetMode = storedMagnetMode();
  let crosshairInspectOn = false;
  const buttons = {
    crosshair: barButton("crosshair", "Crosshair: drag to read prices", ICONS.crosshair),
    magnet: barButton("magnet", "Magnet", ICONS.magnet),
    draw: barButton("draw", "Drawing toolbar", ICONS.pencil),
    lock: barButton("lock", "Lock all drawings", ICONS.lock),
    eye: barButton("eye", "Hide all drawings", ICONS.eye),
    layers: barButton("layers", "Drawings list", ICONS.layers),
    fullscreen: barButton("fullscreen", "Full screen", ICONS.fullscreen),
  };
  const divider = document.createElement("span");
  divider.className = "tv-bar-divider";
  barElement.append(buttons.crosshair, buttons.magnet, buttons.draw, buttons.lock, buttons.eye, divider, buttons.layers, buttons.fullscreen);
  drawingManager.setMagnet(magnetMode);

  function allDrawingsLocked() {
    const drawings = drawingManager.drawings();
    return drawings.length > 0 && drawings.every((drawing) => drawing.locked);
  }

  let reflectedStateKey = "";

  function reflectState() {
    const locked = allDrawingsLocked();
    const hidden = !drawingManager.drawingsVisible();
    const fullscreen = isFullscreen();
    const stateKey = [crosshairInspectOn, magnetMode, drawingToolbar.isVisible(), locked, hidden, fullscreen].join();
    if (stateKey === reflectedStateKey) return;
    reflectedStateKey = stateKey;
    buttons.crosshair.classList.toggle("is-pressed", crosshairInspectOn);
    buttons.magnet.classList.toggle("is-on", magnetMode !== "off");
    buttons.magnet.querySelector(".tv-bar-badge").textContent = magnetMode === "strong" ? "S" : magnetMode === "weak" ? "W" : "";
    buttons.magnet.setAttribute("aria-label", `Magnet: ${magnetMode}`);
    buttons.draw.classList.toggle("is-on", drawingToolbar.isVisible());
    buttons.lock.classList.toggle("is-on", locked);
    buttons.lock.innerHTML = `${locked ? ICONS.lock : ICONS.unlock}<span class="tv-bar-badge"></span>`;
    buttons.lock.setAttribute("aria-label", locked ? "Unlock all drawings" : "Lock all drawings");
    buttons.eye.classList.toggle("is-on", hidden);
    buttons.eye.innerHTML = `${hidden ? ICONS["eye-off"] : ICONS.eye}<span class="tv-bar-badge"></span>`;
    buttons.eye.setAttribute("aria-label", hidden ? "Show all drawings" : "Hide all drawings");
    buttons.fullscreen.innerHTML = `${fullscreen ? ICONS["exit-fullscreen"] : ICONS.fullscreen}<span class="tv-bar-badge"></span>`;
  }

  barElement.addEventListener("click", (event) => {
    const button = event.target.closest(".tv-bar-button");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "crosshair") crosshairInspectOn = !crosshairInspectOn;
    if (action === "magnet") {
      magnetMode = MAGNET_MODES[(MAGNET_MODES.indexOf(magnetMode) + 1) % MAGNET_MODES.length];
      drawingManager.setMagnet(magnetMode);
      localStorage.setItem(MAGNET_STORAGE_KEY, magnetMode);
    }
    if (action === "draw") drawingToolbar.setVisible(!drawingToolbar.isVisible());
    if (action === "lock") {
      const lockEverything = !allDrawingsLocked();
      for (const drawing of [...drawingManager.drawings()]) {
        if (!!drawing.locked !== lockEverything) drawingManager.update({ ...drawing, locked: lockEverything });
      }
    }
    if (action === "eye") drawingManager.setDrawingsVisible(!drawingManager.drawingsVisible());
    if (action === "layers") onOpenLayers();
    if (action === "fullscreen") onToggleFullscreen();
    reflectState();
  });

  drawingManager.on("change", reflectState);
  drawingManager.on("visibility", reflectState);
  reflectState();

  return {
    magnetMode: () => magnetMode,
    isCrosshairInspectOn: () => crosshairInspectOn,
    reflectState,
  };
}
