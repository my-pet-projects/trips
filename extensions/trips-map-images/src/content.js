/// <reference types="chrome" />

/** @typedef {import("./types").AttractionSelectedDetail} AttractionSelectedDetail */
/** @typedef {import("./types").TripsPageMessage} TripsPageMessage */

const EVENT_SELECTED = "trips-attraction-selected";
const MESSAGE_SOURCE = "trips-map-images";

/**
 * @param {AttractionSelectedDetail | undefined} detail
 */
function forwardSelection(detail) {
  if (!detail?.query) return;

  chrome.runtime
    .sendMessage({
      type: "TRIPS_ATTRACTION_SELECTED",
      detail,
    })
    .catch(() => {
      // Extension context may be invalidated after reload.
    });
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;

  /** @type {TripsPageMessage} */
  const data = event.data;
  if (data?.source !== MESSAGE_SOURCE) return;
  if (data?.type !== EVENT_SELECTED) return;

  forwardSelection(data.detail);
});
