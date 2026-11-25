export type Worker = {
  id: string;
  name: string;
};

export type Site = {
  id: string;
  name: string;
};

/** workerId -> siteId */
export type DayAssignments = Record<string, string>;

/** dateKey -> workerId -> note text */
export type DayNotes = Record<string, string>;

export type AppData = {
  version: 1;
  workers: Worker[];
  sites: Site[];
  assignmentsByDate: Record<string, DayAssignments>;
  /** Optional notes for workers on a given date (shown in assign UI / WhatsApp). */
  notesByDate: Record<string, DayNotes>;
};

export const STORAGE_KEY = "ovdim-app-data-v1";

export const EMPTY_APP_DATA: AppData = {
  version: 1,
  workers: [],
  sites: [],
  assignmentsByDate: {},
  notesByDate: {},
};
