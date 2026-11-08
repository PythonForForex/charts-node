import { ICONS, iconFor } from "./tv_icons.js";
import { DRAWING_TOOL_GROUPS, TOOLS_THE_HOST_CANNOT_PLACE, drawingToolName } from "./tv_tool_catalogue.js";
import { openBottomSheet, closeAnySheet } from "./tv_sheet.js";

export const FAVOURITE_TOOLS = ["trend-line", "ray", "horizontal-ray", "horizontal-line", "parallel-channel", "fib-retracement", "pitchfork"];
const TOOLBAR_POSITION_STORAGE_KEY = "tv.drawingToolbarPosition";

function toolButton(kind, label, html) {
  const button = document.createElement("button");
  button.className = "tv-drawbar-tool";
  button.dataset.kind = kind;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = html;
  return button;
}

function restoredPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOOLBAR_POSITION_STORAGE_KEY) || "null");
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) return saved;
  } catch (error) {
    return null;
  }
  return null;
}

export function createDrawingToolbar({ hostElement, drawingManager }) {
  const toolbar = document.createElement("div");
  toolbar.className = "tv-drawbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Drawing tools");
  const grip = document.createElement("div");
  grip.className = "tv-drawbar-grip";
  grip.setAttribute("aria-label", "Move toolbar");
  grip.innerHTML = ICONS.grip;
  toolbar.append(grip);
  for (const kind of FAVOURITE_TOOLS) toolbar.append(toolButton(kind, drawingToolName(kind), iconFor(kind)));
  const moreButton = toolButton("__more__", "All drawing tools", ICONS.more);
  toolbar.append(moreButton);
  hostElement.append(toolbar);

  const saved = restoredPosition();
  if (saved) placeToolbar(saved.left, saved.top);

  function placeToolbar(left, top) {
    const hostRect = hostElement.getBoundingClientRect();
    const maxLeft = Math.max(0, hostRect.width - toolbar.offsetWidth);
    const maxTop = Math.max(0, hostRect.height - toolbar.offsetHeight);
    toolbar.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
    toolbar.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
  }

  let gripDrag = null;
  grip.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    grip.setPointerCapture(event.pointerId);
    gripDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: toolbar.offsetLeft, top: toolbar.offsetTop };
  });
  grip.addEventListener("pointermove", (event) => {
    if (!gripDrag || event.pointerId !== gripDrag.pointerId) return;
    event.stopPropagation();
    placeToolbar(gripDrag.left + event.clientX - gripDrag.startX, gripDrag.top + event.clientY - gripDrag.startY);
  });
  const endGripDrag = (event) => {
    if (!gripDrag || event.pointerId !== gripDrag.pointerId) return;
    gripDrag = null;
    localStorage.setItem(TOOLBAR_POSITION_STORAGE_KEY, JSON.stringify({ left: toolbar.offsetLeft, top: toolbar.offsetTop }));
  };
  grip.addEventListener("pointerup", endGripDrag);
  grip.addEventListener("pointercancel", endGripDrag);
  for (const type of ["pointerdown", "touchstart", "touchmove"]) toolbar.addEventListener(type, (event) => event.stopPropagation());

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest(".tv-drawbar-tool");
    if (!button) return;
    if (button.dataset.kind === "__more__") { openAllToolsSheet(); return; }
    armOrDisarm(button.dataset.kind);
  });

  function armOrDisarm(kind) {
    drawingManager.setTool(drawingManager.tool() === kind ? null : kind);
  }

  function openAllToolsSheet() {
    const content = document.createElement("div");
    content.className = "tv-tool-groups";
    for (const group of DRAWING_TOOL_GROUPS) {
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      const list = document.createElement("div");
      list.className = "tv-tool-list";
      for (const tool of group.tools) {
        const item = document.createElement("button");
        item.className = "tv-tool-item";
        item.dataset.kind = tool.kind;
        item.innerHTML = `<span class="tv-tool-item-icon">${iconFor(tool.kind)}</span><span>${tool.name}</span>`;
        if (TOOLS_THE_HOST_CANNOT_PLACE.has(tool.kind)) { item.disabled = true; item.title = "Needs an image upload; not available here"; }
        if (drawingManager.tool() === tool.kind) item.classList.add("is-active");
        list.append(item);
      }
      content.append(heading, list);
    }
    content.addEventListener("click", (event) => {
      const item = event.target.closest(".tv-tool-item");
      if (!item || item.disabled) return;
      drawingManager.setTool(item.dataset.kind);
      closeAnySheet();
    });
    openBottomSheet("Drawing tools", content);
  }

  function reflectArmedTool(kind) {
    for (const button of toolbar.querySelectorAll(".tv-drawbar-tool")) {
      const isFavouriteActive = button.dataset.kind === kind;
      const isMoreActive = button.dataset.kind === "__more__" && kind && !FAVOURITE_TOOLS.includes(kind);
      button.classList.toggle("is-active", isFavouriteActive || !!isMoreActive);
    }
  }
  drawingManager.on("tool", reflectArmedTool);

  return {
    element: toolbar,
    setVisible(visible) {
      toolbar.hidden = !visible;
      if (visible) { const position = restoredPosition(); if (position) placeToolbar(position.left, position.top); }
      if (!visible && drawingManager.tool()) drawingManager.setTool(null);
    },
    isVisible: () => !toolbar.hidden,
  };
}
