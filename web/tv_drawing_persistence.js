const AUTOSAVE_DEBOUNCE_MILLISECONDS = 600;

export function createDrawingPersistence({ drawingManager, onStatus }) {
  let currentInstrument = null;
  let importing = false;
  let debounceTimer = null;
  let saveInFlight = null;
  let queuedSave = null;
  let saveSequence = 0;
  const pageSessionId = Math.random().toString(36).slice(2, 10);

  async function postSave(save) {
    const response = await fetch("/api/tv_drawings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue: save.venue, symbol: save.symbol, correlation_id: save.correlation_id, drawings: save.drawings }),
      keepalive: save.body_bytes < 60000,
    });
    if (!response.ok) throw new Error(`save failed ${response.status}: ${await response.text()}`);
    return response.json();
  }

  async function drainQueue() {
    if (saveInFlight) return;
    while (queuedSave) {
      const save = queuedSave;
      queuedSave = null;
      saveInFlight = save;
      try {
        await postSave(save);
        onStatus(`saved ${save.drawings.length}`, false);
      } catch (error) {
        onStatus(String(error.message || error), true);
      }
      saveInFlight = null;
    }
  }

  function snapshotNow() {
    if (!currentInstrument) return;
    const exported = drawingManager.exportJSON();
    saveSequence += 1;
    queuedSave = {
      venue: currentInstrument.venue,
      symbol: currentInstrument.symbol,
      correlation_id: `tv:${pageSessionId}:${saveSequence}`,
      drawings: JSON.parse(exported),
      body_bytes: exported.length,
    };
    drainQueue();
  }

  function flushPendingSave() {
    if (!debounceTimer) return;
    clearTimeout(debounceTimer);
    debounceTimer = null;
    snapshotNow();
  }

  drawingManager.on("change", () => {
    if (importing || !currentInstrument) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { debounceTimer = null; snapshotNow(); }, AUTOSAVE_DEBOUNCE_MILLISECONDS);
  });
  window.addEventListener("pagehide", flushPendingSave);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushPendingSave(); });

  return {
    async fetchSaved(venue, symbol) {
      const response = await fetch(`/api/tv_drawings?venue=${encodeURIComponent(venue)}&symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error(`drawings load failed ${response.status}`);
      return response.json();
    },
    async loadInstrument(venue, symbol, savedPromise) {
      flushPendingSave();
      currentInstrument = null;
      const saved = await savedPromise;
      importing = true;
      try {
        drawingManager.importJSON(saved.drawings || []);
      } finally {
        importing = false;
      }
      currentInstrument = { venue, symbol };
      return drawingManager.drawings().length;
    },
    flushPendingSave,
  };
}
