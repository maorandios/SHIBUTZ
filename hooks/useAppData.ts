"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  assignWorker as assignWorkerFn,
  clearDayAssignments,
  copyAssignmentsFromDate,
  findDuplicateName,
  normalizeName,
  removeSiteEverywhere,
  removeWorkerEverywhere,
  getNotesForDate,
  setSiteWorkers as setSiteWorkersFn,
  unassignWorker as unassignWorkerFn,
} from "@/lib/assignments";
import {
  clearAppStoreError,
  commitAppData,
  ensureHydrated,
  getAppStoreServerSnapshot,
  getAppStoreSnapshot,
  logout as logoutStore,
  readAppData,
  refreshFromServer,
  subscribeAppStore,
} from "@/lib/app-store";
import { createId } from "@/lib/id";
import { validateAppData } from "@/lib/storage";
import type { AppData } from "@/lib/types";

type Notice = { type: "success" | "error" | "info"; message: string } | null;

export function useAppData() {
  const snapshot = useSyncExternalStore(
    subscribeAppStore,
    getAppStoreSnapshot,
    getAppStoreServerSnapshot,
  );

  const [notice, setNoticeState] = useState<Notice>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(snapshot.data);

  useEffect(() => {
    void ensureHydrated();
  }, []);

  useEffect(() => {
    dataRef.current = snapshot.data;
  }, [snapshot.data]);

  useEffect(() => {
    if (!snapshot.user) return;

    const sync = () => {
      void refreshFromServer();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "OVDIM_DATA_SYNC") sync();
    };

    // Live shared state — poll while the tab is open; also sync on focus/push.
    sync();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") sync();
    }, 2000);

    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisibility);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [snapshot.user]);

  const showNotice = useCallback((next: Notice, ms = 3000) => {
    clearAppStoreError();
    setNoticeState(next);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    if (next) {
      noticeTimer.current = setTimeout(() => setNoticeState(null), ms);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const visibleNotice: Notice =
    notice ??
    (snapshot.lastError
      ? { type: "error", message: snapshot.lastError }
      : null);

  const persist = useCallback(
    (next: AppData) => {
      dataRef.current = next;
      const ok = commitAppData(next);
      if (!ok) {
        const message =
          getAppStoreSnapshot().lastError ?? "שמירה נכשלה — ייתכן שהאחסון מלא";
        showNotice({ type: "error", message });
      }
      return ok;
    },
    [showNotice],
  );

  const update = useCallback(
    (updater: (current: AppData) => AppData | null) => {
      const current = dataRef.current;
      const next = updater(current);
      if (!next || next === current) return false;
      return persist(next);
    },
    [persist],
  );

  const assignWorker = useCallback(
    (dateKey: string, workerId: string, siteId: string) => {
      return update((current) =>
        assignWorkerFn(current, dateKey, workerId, siteId),
      );
    },
    [update],
  );

  const unassignWorker = useCallback(
    (dateKey: string, workerId: string) => {
      return update((current) => unassignWorkerFn(current, dateKey, workerId));
    },
    [update],
  );

  const setSiteWorkers = useCallback(
    (
      dateKey: string,
      siteId: string,
      workerIds: string[],
      notes: Record<string, string> = {},
    ) => {
      return update((current) =>
        setSiteWorkersFn(current, dateKey, siteId, workerIds, notes),
      );
    },
    [update],
  );

  const clearDate = useCallback(
    (dateKey: string) => {
      return update((current) => clearDayAssignments(current, dateKey));
    },
    [update],
  );

  const copyFromDate = useCallback(
    (sourceDate: string, targetDate: string) => {
      const current = readAppData();
      const { data: next, copiedCount } = copyAssignmentsFromDate(
        current,
        sourceDate,
        targetDate,
      );
      const ok = persist(next);
      if (ok) {
        showNotice({
          type: "success",
          message:
            copiedCount > 0
              ? `הועתקו ${copiedCount} שיבוצים`
              : "לא נמצאו שיבוצים להעתקה",
        });
      }
      return ok;
    },
    [persist, showNotice],
  );

  const addWorker = useCallback(
    (name: string) => {
      const cleaned = normalizeName(name);
      if (!cleaned) return { ok: false as const, error: "יש להזין שם עובד" };
      const current = readAppData();
      if (findDuplicateName(current.workers, cleaned)) {
        return { ok: false as const, error: "עובד בשם זה כבר קיים" };
      }
      const ok = persist({
        ...current,
        workers: [
          ...current.workers,
          { id: createId(), name: cleaned },
        ],
      });
      return ok
        ? { ok: true as const }
        : { ok: false as const, error: "שמירה נכשלה" };
    },
    [persist],
  );

  const bulkAddWorkers = useCallback(
    (raw: string) => {
      const lines = raw
        .split(/\r?\n/)
        .map((line) => normalizeName(line))
        .filter(Boolean);

      let current = readAppData();
      let added = 0;
      let skipped = 0;

      for (const name of lines) {
        if (findDuplicateName(current.workers, name)) {
          skipped += 1;
          continue;
        }
        current = {
          ...current,
          workers: [...current.workers, { id: createId(), name }],
        };
        added += 1;
      }

      if (added > 0) {
        const ok = persist(current);
        if (!ok) return { ok: false as const, added: 0, skipped };
      }

      return { ok: true as const, added, skipped };
    },
    [persist],
  );

  const renameWorker = useCallback(
    (id: string, name: string) => {
      const cleaned = normalizeName(name);
      if (!cleaned) return { ok: false as const, error: "יש להזין שם עובד" };
      const current = readAppData();
      if (findDuplicateName(current.workers, cleaned, id)) {
        return { ok: false as const, error: "עובד בשם זה כבר קיים" };
      }
      const ok = persist({
        ...current,
        workers: current.workers.map((worker) =>
          worker.id === id ? { ...worker, name: cleaned } : worker,
        ),
      });
      return ok
        ? { ok: true as const }
        : { ok: false as const, error: "שמירה נכשלה" };
    },
    [persist],
  );

  const deleteWorker = useCallback(
    (id: string) => update((current) => removeWorkerEverywhere(current, id)),
    [update],
  );

  const addSite = useCallback(
    (name: string) => {
      const cleaned = normalizeName(name);
      if (!cleaned) return { ok: false as const, error: "יש להזין שם אתר" };
      const current = readAppData();
      if (findDuplicateName(current.sites, cleaned)) {
        return { ok: false as const, error: "אתר בשם זה כבר קיים" };
      }
      const ok = persist({
        ...current,
        sites: [...current.sites, { id: createId(), name: cleaned }],
      });
      return ok
        ? { ok: true as const }
        : { ok: false as const, error: "שמירה נכשלה" };
    },
    [persist],
  );

  const renameSite = useCallback(
    (id: string, name: string) => {
      const cleaned = normalizeName(name);
      if (!cleaned) return { ok: false as const, error: "יש להזין שם אתר" };
      const current = readAppData();
      if (findDuplicateName(current.sites, cleaned, id)) {
        return { ok: false as const, error: "אתר בשם זה כבר קיים" };
      }
      const ok = persist({
        ...current,
        sites: current.sites.map((site) =>
          site.id === id ? { ...site, name: cleaned } : site,
        ),
      });
      return ok
        ? { ok: true as const }
        : { ok: false as const, error: "שמירה נכשלה" };
    },
    [persist],
  );

  const deleteSite = useCallback(
    (id: string) => update((current) => removeSiteEverywhere(current, id)),
    [update],
  );

  const replaceData = useCallback(
    (raw: unknown) => {
      const validated = validateAppData(raw);
      if (!validated.ok) {
        showNotice({ type: "error", message: validated.error });
        return { ok: false as const, error: validated.error };
      }
      const ok = persist(validated.data);
      if (ok) {
        showNotice({ type: "success", message: "הגיבוי יובא בהצלחה" });
        return { ok: true as const };
      }
      return { ok: false as const, error: "שמירה נכשלה" };
    },
    [persist, showNotice],
  );

  const logout = useCallback(async () => {
    await logoutStore();
  }, []);

  return {
    data: snapshot.data,
    hydrated: snapshot.hydrated,
    authChecked: snapshot.authChecked,
    user: snapshot.user,
    notice: visibleNotice,
    showNotice,
    clearNotice: () => {
      clearAppStoreError();
      setNoticeState(null);
    },
    logout,
    refresh: refreshFromServer,
    assignWorker,
    unassignWorker,
    setSiteWorkers,
    clearDate,
    copyFromDate,
    addWorker,
    bulkAddWorkers,
    renameWorker,
    deleteWorker,
    addSite,
    renameSite,
    deleteSite,
    replaceData,
  };
}
