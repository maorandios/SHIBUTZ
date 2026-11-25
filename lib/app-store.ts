import { EMPTY_APP_DATA, type AppData } from "./types";
import { cloneData } from "./utils";

type Listener = () => void;

type AppStoreSnapshot = {
  data: AppData;
  hydrated: boolean;
  revision: number;
  lastError: string | null;
  user: { phoneNumber: string; fullName: string } | null;
  authChecked: boolean;
};

let memoryData: AppData = cloneData(EMPTY_APP_DATA);
let hydrated = false;
let authChecked = false;
let revision = 0;
let lastError: string | null = null;
let user: AppStoreSnapshot["user"] = null;
let snapshot: AppStoreSnapshot = {
  data: memoryData,
  hydrated,
  revision,
  lastError,
  user,
  authChecked,
};

const serverSnapshot: AppStoreSnapshot = {
  data: cloneData(EMPTY_APP_DATA),
  hydrated: false,
  revision: 0,
  lastError: null,
  user: null,
  authChecked: false,
};

const listeners = new Set<Listener>();
let hydratePromise: Promise<void> | null = null;
let saveQueue: Promise<boolean> = Promise.resolve(true);

function refreshSnapshot() {
  snapshot = {
    data: memoryData,
    hydrated,
    revision,
    lastError,
    user,
    authChecked,
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

export function readAppData(): AppData {
  return memoryData;
}

export function getRevision(): number {
  return revision;
}

async function fetchMe(): Promise<AppStoreSnapshot["user"]> {
  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("בדיקת התחברות נכשלה");
  const json = (await response.json()) as {
    user: { phoneNumber: string; fullName: string } | null;
  };
  return json.user;
}

async function fetchData(): Promise<{ revision: number; data: AppData }> {
  const response = await fetch("/api/data", { credentials: "include" });
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) throw new Error("טעינת הנתונים נכשלה");
  return (await response.json()) as { revision: number; data: AppData };
}

/** Load session + shared data from the server. Safe to call repeatedly. */
export function ensureHydrated(): Promise<void> {
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const me = await fetchMe();
      user = me;
      authChecked = true;

      if (!me) {
        memoryData = cloneData(EMPTY_APP_DATA);
        revision = 0;
        hydrated = true;
        lastError = null;
        emit();
        return;
      }

      const payload = await fetchData();
      memoryData = payload.data;
      revision = payload.revision;
      hydrated = true;
      lastError = null;
      emit();
    } catch (error) {
      authChecked = true;
      hydrated = true;
      lastError =
        error instanceof Error && error.message === "UNAUTHORIZED"
          ? null
          : error instanceof Error
            ? error.message
            : "טעינה מהשרת נכשלה";
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        user = null;
      }
      emit();
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

export async function loginWithPhone(
  phoneNumber: string,
): Promise<{ ok: true; fullName: string } | { ok: false; error: string }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  const json = (await response.json().catch(() => ({}))) as {
    error?: string;
    user?: { fullName: string; phoneNumber: string };
  };

  if (!response.ok || !json.user) {
    return {
      ok: false,
      error: json.error ?? "ההתחברות נכשלה",
    };
  }

  user = json.user;
  authChecked = true;
  emit();

  try {
    const payload = await fetchData();
    memoryData = payload.data;
    revision = payload.revision;
    hydrated = true;
    lastError = null;
    emit();
  } catch {
    lastError = "התחברת, אך טעינת הנתונים נכשלה";
    emit();
  }

  return { ok: true, fullName: json.user.fullName };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  user = null;
  memoryData = cloneData(EMPTY_APP_DATA);
  revision = 0;
  hydrated = true;
  authChecked = true;
  lastError = null;
  emit();
}

/** Pull shared data. Only applies when server revision is newer (live sync safe). */
export async function refreshFromServer(): Promise<boolean> {
  try {
    const payload = await fetchData();
    if (payload.revision <= revision) {
      return true;
    }
    memoryData = payload.data;
    revision = payload.revision;
    lastError = null;
    emit();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      user = null;
      emit();
    }
    return false;
  }
}

/** Optimistic local update, then persist to shared Redis/API. */
export function commitAppData(next: AppData): boolean {
  memoryData = next;
  lastError = null;
  emit();

  saveQueue = saveQueue.then(async () => {
    const expectedRevision = revision;
    const dataToSave = cloneData(memoryData);

    try {
      const response = await fetch("/api/data", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSave, revision: expectedRevision }),
      });

      if (response.status === 409) {
        const json = (await response.json()) as {
          data: AppData;
          revision: number;
        };
        memoryData = json.data;
        revision = json.revision;
        lastError = "מישהו אחר עדכן — הנתונים רועננו";
        emit();
        return false;
      }

      if (response.status === 401) {
        user = null;
        lastError = "יש להתחבר מחדש";
        emit();
        return false;
      }

      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        lastError = json.error ?? "שמירה לשרת נכשלה";
        emit();
        return false;
      }

      const json = (await response.json()) as { revision: number };
      revision = json.revision;
      lastError = null;
      emit();
      return true;
    } catch {
      lastError = "שמירה לשרת נכשלה — בדקו את החיבור";
      emit();
      return false;
    }
  });

  return true;
}
