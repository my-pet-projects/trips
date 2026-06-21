// HTML popup builders for the raw attractions map (imperative Leaflet — not React).

import type { ExistingAttraction, RawAttraction } from "~/types";

const LINK_BLUE = "display:inline-flex;align-items:center;gap:4px;color:#2563eb;text-decoration:none;font-size:11px;padding:3px 7px;background:#eff6ff;border-radius:4px;border:1px solid #bfdbfe";
const LINK_GREEN = "display:inline-flex;align-items:center;gap:4px;color:#15803d;text-decoration:none;font-size:11px;padding:3px 7px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0";
const BTN_BASE = "flex:1;color:white;border:none;border-radius:6px;padding:6px 4px;font-size:11px;font-weight:600;cursor:pointer;letter-spacing:0.3px";

function sourceLabel(source: string) {
  if (source === "openarium") return "openarium.ru";
  if (source === "votpusk") return "votpusk.ru";
  return source;
}

interface PopupOptions {
  dotColor: string;
  name: string;
  nameLocal: string | null;
  links: (string | false | null)[];
  actions?: string;
}

function buildPopup({ dotColor, name, nameLocal, links, actions = "" }: PopupOptions) {
  const linksHtml = links.filter(Boolean).join("");
  return `
    <div style="min-width:220px;font-family:system-ui,sans-serif">
      <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px">
        <span style="margin-top:3px;width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>
        <span style="font-weight:600;font-size:13px;color:#111827;line-height:1.3">${name}</span>
      </div>
      ${nameLocal ? `<p style="font-size:11px;color:#6b7280;margin:0 0 6px 14px">${nameLocal}</p>` : ""}
      <div style="height:1px;background:#f3f4f6;margin:6px 0"></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${linksHtml}</div>
      ${actions}
    </div>
  `;
}

function domainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

export function existingAttractionPopup(a: ExistingAttraction) {
  return buildPopup({
    dotColor: "#3b82f6",
    name: a.name,
    nameLocal: a.nameLocal,
    links: [
      a.sourceUrl && `<a href="${a.sourceUrl}" target="_blank" style="${LINK_BLUE}">🔗 ${domainLabel(a.sourceUrl)}</a>`,
      `<a href="https://www.google.com/maps?q=${a.latitude!},${a.longitude!}" target="_blank" style="${LINK_BLUE}">📍 Maps</a>`,
      `<a href="/attractions/${a.id}/edit" target="_blank" style="${LINK_GREEN}">✏ Edit</a>`,
    ],
  });
}

export function rawAttractionPopup(r: RawAttraction) {
  const dotColor =
    r.status === "rejected"   ? "#ef4444" :
    r.status === "duplicated" ? "#a855f7" :
    "#f59e0b";

  const actions = r.status === "pending"
    ? `<div style="display:flex;gap:5px;margin-top:8px">
        <button data-id="${r.id}" data-action="approve" style="${BTN_BASE};background:#22c55e">✓ Approve</button>
        <button data-id="${r.id}" data-action="duplicated" style="${BTN_BASE};background:#a855f7">⊕ Dup</button>
        <button data-id="${r.id}" data-action="reject" style="${BTN_BASE};background:#ef4444">✕ Reject</button>
      </div>`
    : "";

  return buildPopup({
    dotColor,
    name: r.name,
    nameLocal: r.nameLocal,
    links: [
      r.sourceUrl && `<a href="${r.sourceUrl}" target="_blank" style="${LINK_BLUE}">🔗 ${sourceLabel(r.source)}</a>`,
      `<a href="https://www.google.com/maps?q=${r.latitude!},${r.longitude!}" target="_blank" style="${LINK_BLUE}">📍 Maps</a>`,
      r.status === "approved" && r.attractionId
        ? `<a href="/attractions/${r.attractionId}/edit" target="_blank" style="${LINK_GREEN}">✏ View</a>`
        : false,
    ],
    actions,
  });
}
