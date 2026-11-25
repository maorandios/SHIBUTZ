import {
  getDayAssignments,
  getNotesForDate,
  getWorkersForSite,
  sitesInOrder,
} from "./assignments";
import { formatDisplayDate } from "./dates";
import type { AppData } from "./types";

/** Force RTL so WhatsApp Desktop doesn't left-align lines that start with digits. */
const RLM = "\u200F";
const RLI = "\u2067";
const PDI = "\u2069";

function rtlLine(text: string): string {
  return text.length > 0 ? `${RLM}${text}` : text;
}

export function buildWhatsAppMessage(
  data: AppData,
  dateKey: string,
  siteIds?: string[],
): string | null {
  const assignments = getDayAssignments(data, dateKey);
  if (Object.keys(assignments).length === 0) return null;

  const allowed =
    siteIds && siteIds.length > 0 ? new Set(siteIds) : null;

  const lines: string[] = [
    rtlLine(`עובדים-געש — ${formatDisplayDate(dateKey)}`),
    "",
  ];

  for (const site of sitesInOrder(data)) {
    if (allowed && !allowed.has(site.id)) continue;
    const workers = getWorkersForSite(data, dateKey, site.id);
    if (workers.length === 0) continue;

    lines.push(rtlLine(`*${site.name}*`));
    const notes = getNotesForDate(data, dateKey);
    workers.forEach((worker, index) => {
      const note = notes[worker.id]?.trim();
      const label = note ? `${worker.name} — ${note}` : worker.name;
      // Trailing RLM after the number keeps "1. שם" as one RTL run on desktop.
      lines.push(rtlLine(`${index + 1}.${RLM} ${label}`));
    });
    lines.push("");
  }

  const body = lines.join("\n").trim();
  if (!body) return null;

  return `${RLI}${body}${PDI}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppNativeUrl(message: string): string {
  return `whatsapp://send?text=${encodeURIComponent(message)}`;
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  // iOS Safari "Add to Home Screen"
  if (
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  ) {
    return true;
  }
  return false;
}

/**
 * Open WhatsApp share without leaving a blank in-app page in installed PWAs.
 * Standalone Android uses an intent handoff; browser tabs use a normal new tab.
 */
export function openWhatsAppShare(message: string): void {
  const encoded = encodeURIComponent(message);
  const httpsUrl = `https://wa.me/?text=${encoded}`;

  if (isStandalonePwa()) {
    if (/Android/i.test(navigator.userAgent)) {
      // Hands off to the WhatsApp app instead of opening a blank PWA browser page.
      const intentUrl =
        `intent://send?text=${encoded}#Intent;` +
        "scheme=whatsapp;package=com.whatsapp;" +
        `S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`;
      window.location.assign(intentUrl);
      return;
    }

    // iOS home-screen PWA: native scheme avoids an intermediate Safari sheet.
    window.location.assign(buildWhatsAppNativeUrl(message));
    return;
  }

  const opened = window.open(httpsUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(httpsUrl);
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
