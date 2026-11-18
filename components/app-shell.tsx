"use client";

import { useMemo, useState } from "react";
import { BottomNav, tabIndex, type AppTab } from "@/components/bottom-nav";
import { DateSelector } from "@/components/date-selector";
import { HomePanel } from "@/components/home-panel";
import { NoticeToast } from "@/components/notice-toast";
import { SiteAssignSheet } from "@/components/site-assign-sheet";
import { SitesPanel } from "@/components/sites-panel";
import { SummaryBar } from "@/components/summary-bar";
import { WorkersPanel } from "@/components/workers-panel";
import { useAppData } from "@/hooks/useAppData";
import {
  getAssignableWorkersForSite,
  getAssignedCount,
  getUnassignedWorkers,
  getWorkersForSite,
} from "@/lib/assignments";
import { tomorrowLocal } from "@/lib/dates";
import { cn } from "@/lib/utils";

const HEADER_TITLES: Record<AppTab, string> = {
  home: "עובדים-געש",
  sites: "אתרים",
  workers: "עובדים",
};

export function AppShell() {
  const {
    data,
    hydrated,
    notice,
    showNotice,
    clearNotice,
    setSiteWorkers,
    addWorker,
    bulkAddWorkers,
    renameWorker,
    deleteWorker,
    addSite,
    renameSite,
    deleteSite,
  } = useAppData();

  const [tab, setTab] = useState<AppTab>("home");
  const [dateKey, setDateKey] = useState(tomorrowLocal());
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  const assignedCount = useMemo(
    () => getAssignedCount(data, dateKey),
    [data, dateKey],
  );
  const unassigned = useMemo(
    () => getUnassignedWorkers(data, dateKey),
    [data, dateKey],
  );

  const activeSite =
    data.sites.find((site) => site.id === activeSiteId) ?? null;
  const sheetWorkers = activeSite
    ? getAssignableWorkersForSite(data, dateKey, activeSite.id)
    : [];
  const sheetSelectedIds = activeSite
    ? getWorkersForSite(data, dateKey, activeSite.id).map((worker) => worker.id)
    : [];

  const datesWithAssignments = useMemo(() => {
    const dates = new Set<string>();
    for (const [key, day] of Object.entries(data.assignmentsByDate)) {
      if (Object.keys(day).length > 0) {
        dates.add(key);
      }
    }
    return dates;
  }, [data.assignmentsByDate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">
        טוען...
      </div>
    );
  }

  const index = tabIndex(tab);

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto flex w-full max-w-[34rem] flex-col overflow-hidden bg-background text-foreground">
      <NoticeToast notice={notice} onDismiss={clearNotice} />

      <header className="app-chrome z-30 shrink-0 border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <h1 className="font-heading text-xl font-medium tracking-tight text-foreground">
            {HEADER_TITLES[tab]}
          </h1>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity]",
            tab === "home"
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
          style={{
            transitionDuration: "var(--duration-nav)",
            transitionTimingFunction: "var(--ease-nav)",
          }}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 px-4 pb-3">
              <DateSelector
                dateKey={dateKey}
                onChange={setDateKey}
                datesWithAssignments={datesWithAssignments}
              />
              <SummaryBar
                total={data.workers.length}
                assigned={assignedCount}
                available={unassigned.length}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden" dir="ltr">
        <div
          className="flex h-full w-[300%] transition-transform"
          style={{
            transform: `translate3d(${-index * (100 / 3)}%, 0, 0)`,
            transitionDuration: "var(--duration-nav)",
            transitionTimingFunction: "var(--ease-nav)",
          }}
        >
          <section className="h-full w-1/3 overflow-y-auto overscroll-contain" dir="rtl">
            <HomePanel
              data={data}
              dateKey={dateKey}
              onOpenSite={setActiveSiteId}
              onNotice={(message, type = "info") =>
                showNotice({ type, message })
              }
            />
          </section>

          <section className="h-full w-1/3 overflow-y-auto overscroll-contain" dir="rtl">
            <SitesPanel
              data={data}
              onAdd={addSite}
              onRename={renameSite}
              onDelete={deleteSite}
              onNotice={(message, type = "info") =>
                showNotice({ type, message })
              }
            />
          </section>

          <section className="h-full w-1/3 overflow-y-auto overscroll-contain" dir="rtl">
            <WorkersPanel
              data={data}
              onAdd={addWorker}
              onRename={renameWorker}
              onDelete={deleteWorker}
              onBulkAdd={bulkAddWorkers}
              onNotice={(message, type = "info") =>
                showNotice({ type, message })
              }
            />
          </section>
        </div>
      </div>

      <div className="z-40 shrink-0">
        <BottomNav active={tab} onChange={setTab} />
      </div>

      {activeSite && (
        <SiteAssignSheet
          key={activeSite.id}
          siteName={activeSite.name}
          workers={sheetWorkers}
          initiallySelectedIds={sheetSelectedIds}
          onClose={() => setActiveSiteId(null)}
          onSave={(selectedIds) => {
            const ok = setSiteWorkers(dateKey, activeSite.id, selectedIds);
            setActiveSiteId(null);
            if (ok) {
              showNotice({
                type: "success",
                message: `נשמרו ${selectedIds.length} עובדים ל${activeSite.name}`,
              });
            }
          }}
        />
      )}
    </div>
  );
}
