import { ICONS } from "./tv_icons.js";
import { openBottomSheet } from "./tv_sheet.js";
import { drawingToolName } from "./tv_tool_catalogue.js";

function drawingSummary(drawing, formatPrice) {
  const firstPoint = drawing.points && drawing.points[0];
  const price = firstPoint && Number.isFinite(firstPoint.price) ? ` · ${formatPrice(firstPoint.price)}` : "";
  return `${drawingToolName(drawing.kind)}${price}`;
}

export function openLayersSheet({ drawingManager, getPriceFormatter }) {
  const content = document.createElement("div");
  content.className = "tv-layers";
  let sheet = null;

  function render() {
    content.replaceChildren();
    const drawings = [...drawingManager.drawings()].reverse();
    if (!drawings.length) {
      const empty = document.createElement("p");
      empty.className = "tv-layers-empty";
      empty.textContent = "No drawings on this instrument.";
      content.append(empty);
      return;
    }
    const selectedIds = drawingManager.selection();
    for (const drawing of drawings) {
      const row = document.createElement("div");
      row.className = "tv-layer-row";
      row.dataset.id = drawing.id;
      row.classList.toggle("is-selected", selectedIds.includes(drawing.id));
      row.classList.toggle("is-hidden", !!drawing.hidden);
      const name = document.createElement("button");
      name.className = "tv-layer-name";
      name.dataset.action = "select";
      name.innerHTML = `<span class="tv-layer-swatch" style="background:${drawing.style?.color || "#2962ff"}"></span><span>${drawingSummary(drawing, getPriceFormatter())}</span>${drawing.locked ? `<span class="tv-layer-locked">${ICONS.lock}</span>` : ""}`;
      const hideButton = document.createElement("button");
      hideButton.className = "tv-icon-button";
      hideButton.dataset.action = "hide";
      hideButton.setAttribute("aria-label", drawing.hidden ? "Show drawing" : "Hide drawing");
      hideButton.innerHTML = drawing.hidden ? ICONS["eye-off"] : ICONS.eye;
      const deleteButton = document.createElement("button");
      deleteButton.className = "tv-icon-button";
      deleteButton.dataset.action = "delete";
      deleteButton.setAttribute("aria-label", "Delete drawing");
      deleteButton.innerHTML = ICONS.trash;
      row.append(name, hideButton, deleteButton);
      content.append(row);
    }
  }

  content.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const row = event.target.closest(".tv-layer-row");
    if (!button || !row) return;
    const id = row.dataset.id;
    const drawing = drawingManager.get(id);
    if (!drawing) return;
    if (button.dataset.action === "select") {
      if (drawing.hidden) drawingManager.setHidden(id, false);
      if (!drawingManager.drawingsVisible()) drawingManager.setDrawingsVisible(true);
      drawingManager.select([id]);
      sheet.close();
      return;
    }
    if (button.dataset.action === "hide") drawingManager.setHidden(id, !drawing.hidden);
    if (button.dataset.action === "delete") drawingManager.remove(id);
    render();
  });

  render();
  sheet = openBottomSheet("Drawings", content);
  return sheet;
}
