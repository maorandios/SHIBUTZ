import { loadAppData, saveAppData } from "./storage";
import { EMPTY_APP_DATA, type AppData } from "./types";
import { cloneData } from "./utils";

type Listener = () => void;

type AppStoreSnapshot = {
  data: AppData;
  hydrated: boolean;
  lastError: string | null;
};

let memoryData: AppData = cloneData(EMPTY_APP_DATA);
let hydrated = false;
let lastError: string | null = null;
let snapshot: AppStoreSnapshot = {
  data: memoryData,
  hydrated,
  lastError,
};

const serverSnapshot: AppStoreSnapshot = {
  data: cloneData(EMPTY_APP_DATA),
  hydrated: false,
  lastError: null,
};

const listeners = new Set<Listener>();

function refreshSnapshot() {
  snapshot = {
    data: memoryData,
    hydrated,
    lastError,
  };
}

function emit() {
  refreshSnapshot();
  for (const listener of listeners) listener();
}

export function subscribeAppStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppStoreSnapshot(): AppStoreSnapshot {
  // Synchronous client hydrate so the first client snapshot matches localStorage.
  if (!hydrated && typeof window !== "undefined") {
    const result = loadAppData();
    if (result.ok) {
      memoryData = result.data;
      lastError = null;
    } else {
      memoryData = cloneData(EMPTY_APP_DATA);
      lastError = result.error;
    }
    hydrated = true;
    refreshSnapshot();
  }
  return snapshot;
}

export function getAppStoreServerSnapshot(): AppStoreSnapshot {
  return serverSnapshot;
}

export function clearAppStoreError(): void {
  if (!lastError) return;
  lastError = null;
  emit();
}

export function setAppStoreError(message: string): void {
  lastError = message;
  emit();
}

/** Replace in-memory state and persist. Returns false on save failure. */
export function commitAppData(next: AppData): boolean {
  const result = saveAppData(next);
  if (!result.ok) {
    lastError = result.error;
    emit();
    return false;
  }
  memoryData = next;
  lastError = null;
  emit();
  return true;
}

export function readAppData(): AppData {
  return memoryData;
}
