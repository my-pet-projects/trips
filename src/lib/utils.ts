import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode) {
    return "";
  }
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - "A".charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Validates that a returnTo URL is a safe relative path within the application.
 * Prevents open redirect vulnerabilities from crafted URLs like ?returnTo=//malicious.com
 */
export function validateReturnTo(returnTo: string | undefined): string | null {
  if (!returnTo) return null;

  // Must start with a single forward slash (relative path)
  // Reject protocol-relative URLs (//), absolute URLs, or other schemes
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}
