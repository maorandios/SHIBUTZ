import {
  getDayAssignments,
  getWorkersForSite,
  sitesInOrder,
} from "./assignments";
import { formatDisplayDate } from "./dates";
import type { AppData } from "./types";

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
    `עובדים-געש — ${formatDisplayDate(dateKey)}`,
    "",
  ];

  for (const site of sitesInOrder(data)) {
    if (allowed && !allowed.has(site.id)) continue;
    const workers = getWorkersForSite(data, dateKey, site.id);
    if (workers.length === 0) continue;

    lines.push(`*${site.name}*`);
    workers.forEach((worker, index) => {
      lines.push(`${index + 1}. ${worker.name}`);
    });
    lines.push("");
  }

  const message = lines.join("\n").trim();
  return message.length > 0 ? message : null;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
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
