export function createLiveBarFeed({ onBar, onReconnected }) {
  let source = null;

  function follow(venue, symbol, tf) {
    if (source) source.close();
    const params = new URLSearchParams({ venue, symbol, tf });
    const current = new EventSource(`/api/live?${params}`);
    let droppedSinceLastOpen = false;
    source = current;
    current.addEventListener("bar", (event) => onBar(JSON.parse(event.data)));
    current.onerror = () => { droppedSinceLastOpen = true; };
    current.onopen = () => {
      if (!droppedSinceLastOpen) return;
      droppedSinceLastOpen = false;
      onReconnected();
    };
  }

  return { follow };
}
