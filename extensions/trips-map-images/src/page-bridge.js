/** @typedef {import("./types").AttractionSelectedDetail} AttractionSelectedDetail */

const EVENT_SELECTED = "trips-attraction-selected";
const MESSAGE_SOURCE = "trips-map-images";

window.addEventListener(EVENT_SELECTED, (event) => {
  if (!(event instanceof CustomEvent)) return;

  /** @type {AttractionSelectedDetail} */
  const detail = event.detail;

  window.postMessage(
    { source: MESSAGE_SOURCE, type: EVENT_SELECTED, detail },
    window.location.origin,
  );
});
