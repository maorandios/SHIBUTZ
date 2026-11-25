"use client";

import { useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { BottomNav, tabIndex, type AppTab } from "@/components/bottom-nav";
import { DateSelector } from "@/components/date-selector";
import { HomePanel } from "@/components/home-panel";
import { InstallBanner } from "@/components/install-banner";
import { LoginScreen } from "@/components/login-screen";
import { NoticeToast } from "@/components/notice-toast";
import { PushEnable } from "@/components/push-enable";
import { SiteAssignSheet } from "@/components/site-assign-sheet";
import { SitesPanel } from "@/components/sites-panel";
import { SummaryBar } from "@/components/summary-bar";
import { WorkersPanel } from "@/components/workers-panel";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/useAppData";
import { notifySiteAssignment } from "@/lib/push-client";
import {
  getAssignableWorkersForSite,
  getAssignedCount,
  getNotesForDate,
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
    authChecked,
    user,
    notice,
    showNotice,
    clearNotice,
    logout,
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
  const sheetNotes = activeSite
    ? Object.fromEntries(
        sheetSelectedIds.map((id) => [
          id,
          getNotesForDate(data, dateKey)[id] ?? "",
        ]),
      )
    : {};

  const datesWithAssignments = useMemo(() => {
    const dates = new Set<string>();
    for (const [key, day] of Object.entries(data.assignmentsByDate)) {
      if (Object.keys(day).length > 0) {
        dates.add(key);
      }
    }
    return dates;
  }, [data.assignmentsByDate]);

  if (!authChecked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">
        טוען...
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLoggedIn={(fullName) => {
          showNotice({ type: "success", message: `שלום ${fullName}` });
        }}
      />
    );
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-500">
        טוען נתונים...
      </div>
    );
  }

  const index = tabIndex(tab);

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 mx-auto flex w-full max-w-[34rem] flex-col overflow-hidden bg-background text-foreground">
      <PushEnable enabled />
      <NoticeToast notice={notice} onDismiss={clearNotice} />

      <header className="app-chrome z-30 shrink-0 border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <h1 className="min-w-0 flex-1 truncate font-heading text-xl font-medium tracking-tight text-foreground">
            {HEADER_TITLES[tab]}
          </h1>
          <div className="flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground">
            <span className="max-w-[9rem] truncate">{user.fullName}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="pressable size-8 shrink-0 text-muted-foreground"
              aria-label="התנתקות"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
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
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-3 px-4 pb-3 pt-1">
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
              onResetSites={(siteIds) => {
                const names: string[] = [];
                for (const siteId of siteIds) {
                  const site = data.sites.find((row) => row.id === siteId);
                  if (!site) continue;
                  const ok = setSiteWorkers(dateKey, siteId, [], {});
                  if (ok) {
                    names.push(site.name);
                    void notifySiteAssignment(site.name);
                  }
                }
                if (names.length > 0) {
                  showNotice({
                    type: "success",
                    message:
                      names.length === 1
                        ? `השיבוץ ל${names[0]} אופס`
                        : `אופס שיבוץ ב-${names.length} אתרים`,
                  });
                }
              }}
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
        <InstallBanner />
        <BottomNav active={tab} onChange={setTab} />
      </div>

      {activeSite && (
        <SiteAssignSheet
          key={activeSite.id}
          siteName={activeSite.name}
          workers={sheetWorkers}
          initiallySelectedIds={sheetSelectedIds}
          initialNotes={sheetNotes}
          onClose={() => setActiveSiteId(null)}
          onReset={() => {
            const siteName = activeSite.name;
            const ok = setSiteWorkers(dateKey, activeSite.id, [], {});
            if (ok) {
              showNotice({
                type: "success",
                message: `השיבוץ ל${siteName} אופס`,
              });
              void notifySiteAssignment(siteName);
            }
          }}
          onSave={(selectedIds, notes) => {
            const siteName = activeSite.name;
            const ok = setSiteWorkers(
              dateKey,
              activeSite.id,
              selectedIds,
              notes,
            );
            setActiveSiteId(null);
            if (ok) {
              showNotice({
                type: "success",
                message: `נשמרו ${selectedIds.length} עובדים ל${siteName}`,
              });
              void notifySiteAssignment(siteName);
            }
          }}
        />
      )}
    </div>
  );
}
