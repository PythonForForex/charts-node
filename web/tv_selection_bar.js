import { ICONS } from "./tv_icons.js";

const DRAWING_COLOURS = ["#2962ff", "#f23645", "#089981", "#ff9800", "#9c27b0", "#000000", "#ffffff"];

export function createSelectionBar({ hostElement, drawingManager }) {
  const bar = document.createElement("div");
  bar.className = "tv-selection-bar";
  bar.hidden = true;
  for (const colour of DRAWING_COLOURS) {
    const swatch = document.createElement("button");
    swatch.className = "tv-colour-swatch";
    swatch.dataset.colour = colour;
    swatch.style.setProperty("--swatch", colour);
    swatch.setAttribute("aria-label", `Colour ${colour}`);
    bar.append(swatch);
  }
  const deleteButton = document.createElement("button");
  deleteButton.className = "tv-icon-button tv-selection-delete";
  deleteButton.setAttribute("aria-label", "Delete drawing");
  deleteButton.innerHTML = ICONS.trash;
  bar.append(deleteButton);
  hostElement.append(bar);
  for (const type of ["pointerdown", "touchstart"]) bar.addEventListener(type, (event) => event.stopPropagation());

  bar.addEventListener("click", (event) => {
    const selectedIds = [...drawingManager.selection()];
    if (!selectedIds.length) return;
    if (event.target.closest(".tv-selection-delete")) {
      for (const id of selectedIds) drawingManager.remove(id);
      return;
    }
    const swatch = event.target.closest(".tv-colour-swatch");
    if (!swatch) return;
    for (const id of selectedIds) {
      const drawing = drawingManager.get(id);
      if (drawing) drawingManager.update({ ...drawing, style: { ...drawing.style, color: swatch.dataset.colour } });
    }
    reflectSelection(drawingManager.selection());
  });

  function reflectSelection(selectedIds) {
    bar.hidden = selectedIds.length === 0;
    const first = selectedIds.length ? drawingManager.get(selectedIds[0]) : null;
    for (const swatch of bar.querySelectorAll(".tv-colour-swatch")) {
      swatch.classList.toggle("is-active", !!first && first.style?.color?.toLowerCase() === swatch.dataset.colour);
    }
  }
  drawingManager.on("selection", reflectSelection);
  return { element: bar };
}
