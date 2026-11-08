import { ICONS } from "./tv_icons.js";

let closeOpenSheet = null;

export function openBottomSheet(title, contentElement, { onClose } = {}) {
  if (closeOpenSheet) closeOpenSheet();
  const backdrop = document.createElement("div");
  backdrop.className = "tv-sheet-backdrop";
  const sheet = document.createElement("section");
  sheet.className = "tv-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", title);
  const header = document.createElement("header");
  header.className = "tv-sheet-header";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const closeButton = document.createElement("button");
  closeButton.className = "tv-icon-button";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.innerHTML = ICONS.close;
  header.append(heading, closeButton);
  const body = document.createElement("div");
  body.className = "tv-sheet-body";
  body.append(contentElement);
  sheet.append(header, body);
  document.body.append(backdrop, sheet);
  function close() {
    backdrop.remove();
    sheet.remove();
    closeOpenSheet = null;
    if (onClose) onClose();
  }
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  closeOpenSheet = close;
  return { close, body };
}

export function closeAnySheet() {
  if (closeOpenSheet) closeOpenSheet();
}
