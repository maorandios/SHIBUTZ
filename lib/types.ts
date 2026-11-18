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

export type AppData = {
  version: 1;
  workers: Worker[];
  sites: Site[];
  assignmentsByDate: Record<string, DayAssignments>;
};

export const STORAGE_KEY = "ovdim-app-data-v1";

export const EMPTY_APP_DATA: AppData = {
  version: 1,
  workers: [],
  sites: [],
  assignmentsByDate: {},
};
