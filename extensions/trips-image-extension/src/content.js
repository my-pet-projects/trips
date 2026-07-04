/// <reference types="chrome" />

/** @typedef {import("./types").TripsImageSearchDetail} TripsImageSearchDetail */
/** @typedef {import("./types").TripsPageMessage} TripsPageMessage */

const EVENT_IMAGE_SEARCH = "trips-image-search";
const MESSAGE_SOURCE = "trips-image-extension";

/**
 * @param {TripsImageSearchDetail | undefined} detail
 */
function forwardImageSearch(detail) {
  if (!detail?.query) return;

  chrome.runtime
    .sendMessage({
      type: "TRIPS_IMAGE_SEARCH",
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
  if (data?.type !== EVENT_IMAGE_SEARCH) return;

  forwardImageSearch(data.detail);
});
