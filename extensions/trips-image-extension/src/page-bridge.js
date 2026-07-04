/** @typedef {import("./types").TripsImageSearchDetail} TripsImageSearchDetail */

const EVENT_IMAGE_SEARCH = "trips-image-search";
const MESSAGE_SOURCE = "trips-image-extension";

window.addEventListener(EVENT_IMAGE_SEARCH, (event) => {
  if (!(event instanceof CustomEvent)) return;

  /** @type {TripsImageSearchDetail} */
  const detail = event.detail;

  window.postMessage(
    { source: MESSAGE_SOURCE, type: EVENT_IMAGE_SEARCH, detail },
    window.location.origin,
  );
});
