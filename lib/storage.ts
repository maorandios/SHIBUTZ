import {
  EMPTY_APP_DATA,
  STORAGE_KEY,
  type AppData,
  type DayAssignments,
  type DayNotes,
  type Site,
  type Worker,
} from "./types";
import { namesEqual, normalizeName, sortByNameHe } from "./assignments";
import { cloneData } from "./utils";

export type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

function validateWorkers(value: unknown): Worker[] | null {
  if (!Array.isArray(value)) return null;
  const workers: Worker[] = [];
  const ids = new Set<string>();

  for (const item of value) {
    if (!isPlainObject(item)) return null;
    if (!isValidId(item.id) || typeof item.name !== "string") return null;
    const name = normalizeName(item.name);
    if (!name) return null;
    if (ids.has(item.id)) return null;
    if (workers.some((worker) => namesEqual(worker.name, name))) return null;
    ids.add(item.id);
    workers.push({ id: item.id, name });
  }

  return workers;
}

function validateSites(value: unknown): Site[] | null {
  if (!Array.isArray(value)) return null;
  const sites: Site[] = [];
  const ids = new Set<string>();

  for (const item of value) {
    if (!isPlainObject(item)) return null;
    if (!isValidId(item.id) || typeof item.name !== "string") return null;
    const name = normalizeName(item.name);
    if (!name) return null;
    if (ids.has(item.id)) return null;
    if (sites.some((site) => namesEqual(site.name, name))) return null;
    ids.add(item.id);
    sites.push({ id: item.id, name });
  }

  return sites;
}

function validateAssignments(
  value: unknown,
  workerIds: Set<string>,
  siteIds: Set<string>,
): Record<string, DayAssignments> | null {
  if (!isPlainObject(value)) return null;
  const assignmentsByDate: Record<string, DayAssignments> = {};

  for (const [dateKey, dayValue] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
    if (!isPlainObject(dayValue)) return null;

    const day: DayAssignments = {};
    const usedWorkers = new Set<string>();

    for (const [workerId, siteId] of Object.entries(dayValue)) {
      if (!isValidId(workerId) || typeof siteId !== "string" || !isValidId(siteId)) {
        return null;
      }
      if (!workerIds.has(workerId) || !siteIds.has(siteId)) return null;
      if (usedWorkers.has(workerId)) return null;
      usedWorkers.add(workerId);
      day[workerId] = siteId;
    }

    if (Object.keys(day).length > 0) {
      assignmentsByDate[dateKey] = day;
    }
  }

  return assignmentsByDate;
}

/** Strict schema validation for imports. Never mutates existing storage. */
export function validateAppData(raw: unknown): StorageResult<AppData> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: "קובץ הגיבוי אינו תקין" };
  }

  if (raw.version !== 1) {
    return { ok: false, error: "גרסת הגיבוי אינה נתמכת" };
  }

  const workers = validateWorkers(raw.workers);
  if (!workers) {
    return { ok: false, error: "רשימת העובדים בגיבוי אינה תקינה" };
  }

  const sites = validateSites(raw.sites);
  if (!sites) {
    return { ok: false, error: "רשימת האתרים בגיבוי אינה תקינה" };
  }

  const workerIds = new Set(workers.map((worker) => worker.id));
  const siteIds = new Set(sites.map((site) => site.id));
  const assignmentsByDate = validateAssignments(
    raw.assignmentsByDate,
    workerIds,
    siteIds,
  );

  if (!assignmentsByDate) {
    return { ok: false, error: "נתוני השיבוצים בגיבוי אינם תקינים" };
  }

  const notesByDate = validateNotes(raw.notesByDate, workerIds);
  if (!notesByDate) {
    return { ok: false, error: "הערות השיבוץ בגיבוי אינן תקינות" };
  }

  return {
    ok: true,
    data: {
      version: 1,
      workers: sortByNameHe(workers),
      sites: sortByNameHe(sites),
      assignmentsByDate,
      notesByDate,
    },
  };
}

function validateNotes(
  value: unknown,
  workerIds: Set<string>,
): Record<string, DayNotes> | null {
  if (value === undefined || value === null) return {};
  if (!isPlainObject(value)) return null;

  const notesByDate: Record<string, DayNotes> = {};
  for (const [dateKey, dayValue] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
    if (!isPlainObject(dayValue)) return null;

    const day: DayNotes = {};
    for (const [workerId, note] of Object.entries(dayValue)) {
      if (!isValidId(workerId) || typeof note !== "string") return null;
      if (!workerIds.has(workerId)) continue;
      const cleaned = note.trim();
      if (!cleaned) continue;
      day[workerId] = cleaned;
    }
    if (Object.keys(day).length > 0) {
      notesByDate[dateKey] = day;
    }
  }
  return notesByDate;
}

export function loadAppData(): StorageResult<AppData> {
  if (typeof window === "undefined") {
    return { ok: true, data: EMPTY_APP_DATA };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ok: true, data: cloneData(EMPTY_APP_DATA) };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        error: "הנתונים השמורים פגומים — נטענו נתונים ריקים",
      };
    }

    const validated = validateAppData(parsed);
    if (!validated.ok) {
      return {
        ok: false,
        error: "הנתונים השמורים פגומים — נטענו נתונים ריקים",
      };
    }

    return validated;
  } catch {
    return {
      ok: false,
      error: "לא ניתן לקרוא מהאחסון המקומי",
    };
  }
}

export function saveAppData(data: AppData): StorageResult<true> {
  if (typeof window === "undefined") {
    return { ok: true, data: true };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true, data: true };
  } catch {
    return {
      ok: false,
      error: "שמירה נכשלה — ייתכן שהאחסון מלא",
    };
  }
}

export function exportAppDataJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}
