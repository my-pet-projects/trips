/**
 * PDF font loading utilities with Cyrillic support.
 */

import type { jsPDF } from "jspdf";

// Roboto font with Cyrillic support - cached font data
let fontBase64Data: string | null = null;
let fontLoadPromise: Promise<string | null> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}

/**
 * Loads and caches the Roboto font data, then adds it to the given jsPDF instance.
 * Returns true if the font was successfully loaded and added.
 */
export async function loadCyrillicFont(doc: jsPDF): Promise<boolean> {
  // Load font data if not cached
  if (!fontBase64Data && !fontLoadPromise) {
    fontLoadPromise = (async () => {
      try {
        const response = await fetch(
          "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
        );
        if (!response.ok) {
          throw new Error(
            `Font download failed with status ${response.status}`,
          );
        }
        const fontBuffer = await response.arrayBuffer();
        fontBase64Data = arrayBufferToBase64(fontBuffer);
        return fontBase64Data;
      } catch (error) {
        fontLoadPromise = null;
        console.warn("Failed to load Cyrillic font:", error);
        return null;
      }
    })();
  }

  if (fontLoadPromise) {
    const result = await fontLoadPromise;
    if (result) {
      fontBase64Data = result;
    } else {
      fontLoadPromise = null;
    }
  }

  // Add font to this specific doc instance
  if (fontBase64Data) {
    try {
      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64Data);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      return true;
    } catch (error) {
      console.warn("Failed to add font to PDF:", error);
      return false;
    }
  }

  return false;
}

/** Clears the cached font data */
export function clearFontCache(): void {
  fontBase64Data = null;
  fontLoadPromise = null;
}
