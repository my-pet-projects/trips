/// <reference types="chrome" />

/** @typedef {import("./types").AttractionSelectedDetail} AttractionSelectedDetail */
/** @typedef {import("./types").DdgImageResult} DdgImageResult */

const STORAGE_KEY = "tripsRawMapSelection";

/**
 * @param {string} id
 */
function getRequiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`[trips-map-images] Side panel markup is missing #${id}`);
  }
  return element;
}

const titleEl = getRequiredElement("title");
const subtitleEl = getRequiredElement("subtitle");
/** @type {HTMLAnchorElement} */
const ddgLinkEl = /** @type {HTMLAnchorElement} */ (getRequiredElement("ddg-link"));
const statusEl = getRequiredElement("status");
const gridEl = getRequiredElement("grid");

/** @type {string | null} */
let activeQuery = null;
/** @type {number} */
let requestId = 0;

/** @param {string} query */
function ddgImagesUrl(query) {
  const params = new URLSearchParams({
    q: query,
    iar: "images",
    iax: "images",
    ia: "images",
  });
  return `https://duckduckgo.com/?${params.toString()}`;
}

/** @param {string} query */
async function getDdgToken(query) {
  const res = await fetch(`https://duckduckgo.com/?${new URLSearchParams({ q: query })}`);
  if (!res.ok) throw new Error("Failed to contact DuckDuckGo");
  const text = await res.text();
  const token = text.match(/vqd=([\d-]+)&/)?.[1];
  if (!token) throw new Error("Failed to get DuckDuckGo token");
  return token;
}

/** @param {string} query */
async function searchDdgImages(query) {
  const token = await getDdgToken(query);
  const params = new URLSearchParams({
    o: "json",
    q: query,
    l: "us-en",
    vqd: token,
    p: "1",
  });
  const res = await fetch(`https://duckduckgo.com/i.js?${params}`);
  if (!res.ok) throw new Error("DuckDuckGo image search failed");
  const data = await res.json();
  return Array.isArray(data.results) ? /** @type {DdgImageResult[]} */ (data.results) : [];
}

/** @param {string} message @param {{ error?: boolean }} [options] */
function setStatus(message, { error = false } = {}) {
  if (!message) {
    statusEl.classList.add("hidden");
    statusEl.textContent = "";
    statusEl.classList.remove("error");
    return;
  }

  statusEl.textContent = message;
  statusEl.classList.toggle("error", error);
  statusEl.classList.remove("hidden");
}

/** @param {string} message */
function renderEmpty(message) {
  gridEl.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.className = "empty";
  paragraph.textContent = message;
  gridEl.appendChild(paragraph);
}

/**
 * @param {string | undefined} value
 */
function isSafeHttpUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** @param {DdgImageResult[]} results */
function renderImages(results) {
  gridEl.replaceChildren();

  let rendered = 0;

  for (const result of results) {
    const thumb = result.thumbnail || result.image || "";
    const href = result.image || result.url || "";
    if (!isSafeHttpUrl(thumb) || !isSafeHttpUrl(href)) continue;

    const caption = result.title || result.source || "Image";

    const link = document.createElement("a");
    link.className = "card";
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.title = caption;

    const image = document.createElement("img");
    image.src = thumb;
    image.alt = caption;
    image.loading = "lazy";

    const captionEl = document.createElement("div");
    captionEl.className = "card-caption";
    captionEl.textContent = caption;

    link.append(image, captionEl);
    gridEl.appendChild(link);
    rendered++;
  }

  if (rendered === 0) {
    renderEmpty("No images found for this attraction.");
  }
}

/** @param {AttractionSelectedDetail | undefined} detail */
async function loadSelection(detail) {
  const query = detail?.query?.trim();
  if (!query || !detail) {
    activeQuery = null;
    titleEl.textContent = "Select a map marker";
    subtitleEl.textContent = "Images from DuckDuckGo appear here.";
    ddgLinkEl.classList.add("hidden");
    setStatus("");
    renderEmpty("Click a marker on any Trips map to search images.");
    return;
  }

  if (query === activeQuery) return;
  activeQuery = query;

  const currentRequest = ++requestId;
  titleEl.textContent = detail.name || query;

  const localName =
    detail.nameLocal && detail.nameLocal !== detail.name ? detail.nameLocal : null;
  if (localName && detail.city) {
    subtitleEl.textContent = `${localName} · ${detail.city}`;
  } else if (localName) {
    subtitleEl.textContent = localName;
  } else if (detail.city) {
    subtitleEl.textContent = `${detail.city} · image search`;
  } else {
    subtitleEl.textContent = "Image search";
  }

  ddgLinkEl.href = ddgImagesUrl(query);
  ddgLinkEl.classList.remove("hidden");
  setStatus("Searching DuckDuckGo…");
  renderEmpty("Loading images…");

  try {
    const results = await searchDdgImages(query);

    if (currentRequest !== requestId) return;

    setStatus(`${results.length} image${results.length === 1 ? "" : "s"}`);
    renderImages(results);
  } catch (error) {
    if (currentRequest !== requestId) return;

    activeQuery = null;
    console.error("[trips-map-images] image search failed:", error);
    setStatus("Image search failed. Try again or open DuckDuckGo.", { error: true });
    renderEmpty("Could not load images from DuckDuckGo.");
  }
}

async function readSelection() {
  const stored = await chrome.storage.session.get(STORAGE_KEY);
  await loadSelection(stored[STORAGE_KEY]);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "session" || !changes[STORAGE_KEY]) return;
  void loadSelection(changes[STORAGE_KEY].newValue);
});

void readSelection();
