"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Worker } from "@/lib/types";

type SiteAssignSheetProps = {
  siteName: string;
  workers: Worker[];
  initiallySelectedIds: string[];
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
};

export function SiteAssignSheet({
  siteName,
  workers,
  initiallySelectedIds,
  onClose,
  onSave,
}: SiteAssignSheetProps) {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initiallySelectedIds),
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectedCount = selectedIds.size;

  const toggleWorker = (workerId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(workerId)) next.delete(workerId);
      else next.add(workerId);
      return next;
    });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        aria-label="סגור"
        className={cn(
          "sheet-overlay absolute inset-0 transition-opacity",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{
          transitionDuration: "450ms",
          transitionTimingFunction: "var(--ease-overlay)",
        }}
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`שיבוץ ל${siteName}`}
        className={cn(
          "sheet-panel sheet-max-height relative z-10 flex w-full max-w-[34rem] flex-col rounded-t-xl border-t transition-transform",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          transitionDuration: "var(--duration-sheet)",
          transitionTimingFunction: "var(--ease-sheet)",
        }}
      >
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-muted" />

        <div className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-2">
          <div className="flex min-w-0 items-center gap-2">
            <Building2
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h2 className="min-w-0 truncate font-heading text-lg font-medium text-foreground">
              {siteName}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pressable shrink-0"
            aria-label="סגור מגירה"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {workers.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              אין עובדים פנויים לשיבוץ
            </div>
          ) : (
            <ul>
              {workers.map((worker) => {
                const selected = selectedIds.has(worker.id);
                return (
                  <li key={worker.id} className="border-b border-border/70">
                    <button
                      type="button"
                      onClick={() => toggleWorker(worker.id)}
                      className="pressable flex min-h-14 w-full items-center gap-3 bg-card px-4 py-3 text-right transition-colors active:bg-accent"
                    >
                      <span
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-card text-transparent",
                        )}
                      >
                        <Check className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
                        {worker.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <Button
            type="button"
            size="lg"
            className="pressable w-full"
            onClick={() => onSave([...selectedIds])}
          >
            שמור ({selectedCount})
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
