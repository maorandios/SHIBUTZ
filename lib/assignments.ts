import type { AppData, DayAssignments, Site, Worker } from "./types";

export function getDayAssignments(
  data: AppData,
  dateKey: string,
): DayAssignments {
  return data.assignmentsByDate[dateKey] ?? {};
}

export function getAssignedCount(data: AppData, dateKey: string): number {
  return Object.keys(getDayAssignments(data, dateKey)).length;
}

export function getUnassignedWorkers(
  data: AppData,
  dateKey: string,
): Worker[] {
  const assigned = getDayAssignments(data, dateKey);
  return sortByNameHe(
    data.workers.filter((worker) => !(worker.id in assigned)),
  );
}

export function getWorkersForSite(
  data: AppData,
  dateKey: string,
  siteId: string,
): Worker[] {
  const assigned = getDayAssignments(data, dateKey);
  const ids = Object.entries(assigned)
    .filter(([, assignedSiteId]) => assignedSiteId === siteId)
    .map(([workerId]) => workerId);

  const byId = new Map(data.workers.map((worker) => [worker.id, worker]));
  return sortByNameHe(
    ids
      .map((id) => byId.get(id))
      .filter((worker): worker is Worker => Boolean(worker)),
  );
}

export function getSiteWorkerCount(
  data: AppData,
  dateKey: string,
  siteId: string,
): number {
  const assigned = getDayAssignments(data, dateKey);
  return Object.values(assigned).filter((id) => id === siteId).length;
}

/**
 * Centralized assignment — enforces one site per worker per date.
 * Returns null if the worker/site is missing or already on that site.
 */
export function assignWorker(
  data: AppData,
  dateKey: string,
  workerId: string,
  siteId: string,
): AppData | null {
  const workerExists = data.workers.some((worker) => worker.id === workerId);
  const siteExists = data.sites.some((site) => site.id === siteId);
  if (!workerExists || !siteExists) return null;

  const current = getDayAssignments(data, dateKey);
  if (current[workerId] === siteId) return data;

  return {
    ...data,
    assignmentsByDate: {
      ...data.assignmentsByDate,
      [dateKey]: {
        ...current,
        [workerId]: siteId,
      },
    },
  };
}

export function unassignWorker(
  data: AppData,
  dateKey: string,
  workerId: string,
): AppData {
  const current = getDayAssignments(data, dateKey);
  if (!(workerId in current)) return data;

  const nextDay: DayAssignments = { ...current };
  delete nextDay[workerId];

  const assignmentsByDate = { ...data.assignmentsByDate };
  if (Object.keys(nextDay).length === 0) {
    delete assignmentsByDate[dateKey];
  } else {
    assignmentsByDate[dateKey] = nextDay;
  }

  return { ...data, assignmentsByDate };
}

/**
 * Replace the full worker set for one site on a date.
 * Only workers that are unassigned or already on this site may be included.
 * Workers assigned elsewhere are ignored (one site per day).
 */
export function getNotesForDate(
  data: AppData,
  dateKey: string,
): Record<string, string> {
  return data.notesByDate?.[dateKey] ?? {};
}

export function setSiteWorkers(
  data: AppData,
  dateKey: string,
  siteId: string,
  workerIds: string[],
  notesByWorker: Record<string, string> = {},
): AppData | null {
  const siteExists = data.sites.some((site) => site.id === siteId);
  if (!siteExists) return null;

  const workerIdSet = new Set(data.workers.map((worker) => worker.id));
  const current = getDayAssignments(data, dateKey);
  const nextDay: DayAssignments = { ...current };
  const removedFromSite: string[] = [];

  for (const [workerId, assignedSiteId] of Object.entries(nextDay)) {
    if (assignedSiteId === siteId) {
      delete nextDay[workerId];
      removedFromSite.push(workerId);
    }
  }

  const uniqueIds = [...new Set(workerIds)];
  for (const workerId of uniqueIds) {
    if (!workerIdSet.has(workerId)) continue;
    const existingSite = nextDay[workerId];
    if (existingSite && existingSite !== siteId) continue;
    nextDay[workerId] = siteId;
  }

  const assignmentsByDate = { ...data.assignmentsByDate };
  if (Object.keys(nextDay).length === 0) {
    delete assignmentsByDate[dateKey];
  } else {
    assignmentsByDate[dateKey] = nextDay;
  }

  const dayNotes = { ...(data.notesByDate?.[dateKey] ?? {}) };
  for (const workerId of removedFromSite) {
    if (!uniqueIds.includes(workerId)) {
      delete dayNotes[workerId];
    }
  }
  for (const workerId of uniqueIds) {
    const note = (notesByWorker[workerId] ?? "").trim();
    if (note) dayNotes[workerId] = note;
    else delete dayNotes[workerId];
  }

  const notesByDate = { ...(data.notesByDate ?? {}) };
  if (Object.keys(dayNotes).length === 0) {
    delete notesByDate[dateKey];
  } else {
    notesByDate[dateKey] = dayNotes;
  }

  return { ...data, assignmentsByDate, notesByDate };
}

/** Workers eligible for a site sheet: already on this site + currently unassigned. */
export function getAssignableWorkersForSite(
  data: AppData,
  dateKey: string,
  siteId: string,
): Worker[] {
  const onSite = getWorkersForSite(data, dateKey, siteId);
  const unassigned = getUnassignedWorkers(data, dateKey);
  const merged = [...onSite, ...unassigned];
  const seen = new Set<string>();
  return sortByNameHe(
    merged.filter((worker) => {
      if (seen.has(worker.id)) return false;
      seen.add(worker.id);
      return true;
    }),
  );
}

export function clearDayAssignments(
  data: AppData,
  dateKey: string,
): AppData {
  if (!(dateKey in data.assignmentsByDate) && !(dateKey in (data.notesByDate ?? {}))) {
    return data;
  }
  const assignmentsByDate = { ...data.assignmentsByDate };
  delete assignmentsByDate[dateKey];
  const notesByDate = { ...(data.notesByDate ?? {}) };
  delete notesByDate[dateKey];
  return { ...data, assignmentsByDate, notesByDate };
}

/**
 * Copy assignments from source date into target date.
 * Skips workers/sites that no longer exist. Source date is unchanged.
 */
export function copyAssignmentsFromDate(
  data: AppData,
  sourceDate: string,
  targetDate: string,
): { data: AppData; copiedCount: number } {
  const source = getDayAssignments(data, sourceDate);
  const workerIds = new Set(data.workers.map((worker) => worker.id));
  const siteIds = new Set(data.sites.map((site) => site.id));

  const nextDay: DayAssignments = {};
  let copiedCount = 0;

  for (const [workerId, siteId] of Object.entries(source)) {
    if (!workerIds.has(workerId) || !siteIds.has(siteId)) continue;
    nextDay[workerId] = siteId;
    copiedCount += 1;
  }

  if (copiedCount === 0) {
    return {
      data: clearDayAssignments(data, targetDate),
      copiedCount: 0,
    };
  }

  const sourceNotes = getNotesForDate(data, sourceDate);
  const nextNotes: Record<string, string> = {};
  for (const workerId of Object.keys(nextDay)) {
    const note = sourceNotes[workerId]?.trim();
    if (note) nextNotes[workerId] = note;
  }

  const notesByDate = { ...(data.notesByDate ?? {}) };
  if (Object.keys(nextNotes).length === 0) {
    delete notesByDate[targetDate];
  } else {
    notesByDate[targetDate] = nextNotes;
  }

  return {
    data: {
      ...data,
      assignmentsByDate: {
        ...data.assignmentsByDate,
        [targetDate]: nextDay,
      },
      notesByDate,
    },
    copiedCount,
  };
}

export function removeWorkerEverywhere(
  data: AppData,
  workerId: string,
): AppData {
  const workers = data.workers.filter((worker) => worker.id !== workerId);
  const assignmentsByDate: AppData["assignmentsByDate"] = {};
  const notesByDate: AppData["notesByDate"] = {};

  for (const [dateKey, day] of Object.entries(data.assignmentsByDate)) {
    if (!(workerId in day)) {
      assignmentsByDate[dateKey] = day;
      continue;
    }
    const nextDay: DayAssignments = { ...day };
    delete nextDay[workerId];
    if (Object.keys(nextDay).length > 0) {
      assignmentsByDate[dateKey] = nextDay;
    }
  }

  for (const [dateKey, day] of Object.entries(data.notesByDate ?? {})) {
    if (!(workerId in day)) {
      notesByDate[dateKey] = day;
      continue;
    }
    const nextDay = { ...day };
    delete nextDay[workerId];
    if (Object.keys(nextDay).length > 0) {
      notesByDate[dateKey] = nextDay;
    }
  }

  return { ...data, workers, assignmentsByDate, notesByDate };
}

export function removeSiteEverywhere(data: AppData, siteId: string): AppData {
  const sites = data.sites.filter((site) => site.id !== siteId);
  const assignmentsByDate: AppData["assignmentsByDate"] = {};
  const notesByDate: AppData["notesByDate"] = {
    ...(data.notesByDate ?? {}),
  };

  for (const [dateKey, day] of Object.entries(data.assignmentsByDate)) {
    const nextDay: DayAssignments = {};
    const removedWorkers: string[] = [];
    for (const [workerId, assignedSiteId] of Object.entries(day)) {
      if (assignedSiteId !== siteId) {
        nextDay[workerId] = assignedSiteId;
      } else {
        removedWorkers.push(workerId);
      }
    }
    if (Object.keys(nextDay).length > 0) {
      assignmentsByDate[dateKey] = nextDay;
    }

    if (removedWorkers.length > 0 && notesByDate[dateKey]) {
      const nextNotes = { ...notesByDate[dateKey] };
      for (const workerId of removedWorkers) {
        delete nextNotes[workerId];
      }
      if (Object.keys(nextNotes).length === 0) {
        delete notesByDate[dateKey];
      } else {
        notesByDate[dateKey] = nextNotes;
      }
    }
  }

  return { ...data, sites, assignmentsByDate, notesByDate };
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Hebrew alphabetical order (א‑ב) for workers/sites lists. */
export function compareNamesHe(a: string, b: string): number {
  return normalizeName(a).localeCompare(normalizeName(b), "he", {
    sensitivity: "base",
    numeric: true,
  });
}

export function sortByNameHe<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    compareNamesHe(left.name, right.name),
  );
}

export function namesEqual(a: string, b: string): boolean {
  return normalizeName(a).toLocaleLowerCase("he") === normalizeName(b).toLocaleLowerCase("he");
}

export function findDuplicateName(
  items: Array<{ id: string; name: string }>,
  name: string,
  excludeId?: string,
): boolean {
  return items.some(
    (item) => item.id !== excludeId && namesEqual(item.name, name),
  );
}

export function sitesInOrder(data: AppData): Site[] {
  return sortByNameHe(data.sites);
}
