"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Check, CircleX, PenLine, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Worker } from "@/lib/types";

type SiteAssignSheetProps = {
  siteName: string;
  workers: Worker[];
  initiallySelectedIds: string[];
  initialNotes?: Record<string, string>;
  onClose: () => void;
  onSave: (selectedIds: string[], notes: Record<string, string>) => void;
  onReset: () => void;
};

export function SiteAssignSheet({
  siteName,
  workers,
  initiallySelectedIds,
  initialNotes = {},
  onClose,
  onSave,
  onReset,
}: SiteAssignSheetProps) {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initiallySelectedIds),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() => ({
    ...initialNotes,
  }));
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
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
      if (next.has(workerId)) {
        next.delete(workerId);
        setNotes((currentNotes) => {
          const updated = { ...currentNotes };
          delete updated[workerId];
          return updated;
        });
        setEditingNoteId((currentId) =>
          currentId === workerId ? null : currentId,
        );
      } else {
        next.add(workerId);
      }
      return next;
    });
  };

  const clearNote = (workerId: string) => {
    setNotes((current) => {
      const next = { ...current };
      delete next[workerId];
      return next;
    });
    setEditingNoteId((current) => (current === workerId ? null : current));
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
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="pressable gap-1 px-2 text-muted-foreground"
              aria-label={`איפוס שיבוץ ל${siteName}`}
              onClick={() => {
                setSelectedIds(new Set());
                setNotes({});
                setEditingNoteId(null);
                onReset();
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
              איפוס
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="pressable"
              aria-label="סגור מגירה"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          </div>
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
                const note = notes[worker.id]?.trim() ?? "";
                const editing = editingNoteId === worker.id;
                const hasNote = note.length > 0;

                return (
                  <li key={worker.id} className="border-b border-border/70">
                    <div className="flex min-h-14 items-center gap-2 bg-card px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleWorker(worker.id)}
                        className="pressable flex min-w-0 flex-1 items-center gap-3 text-right transition-colors"
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
                        <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-right">
                          <span className="truncate text-base font-medium text-foreground">
                            {worker.name}
                          </span>
                          {selected && !editing && hasNote ? (
                            <>
                              <span
                                className="shrink-0 text-muted-foreground"
                                aria-hidden
                              >
                                ·
                              </span>
                              <span className="truncate text-sm text-muted-foreground">
                                {note}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </button>

                      {selected ? (
                        editing ? (
                          <div className="ms-auto w-1/2 max-w-[50%] shrink-0">
                            <div className="w-full origin-center scale-90">
                              <Input
                                value={notes[worker.id] ?? ""}
                                autoFocus
                                placeholder="הערה..."
                                className="h-8 w-full min-w-0 text-[0.8125rem]"
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setNotes((current) => ({
                                    ...current,
                                    [worker.id]: value,
                                  }));
                                }}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === "Escape"
                                  ) {
                                    setEditingNoteId(null);
                                  }
                                }}
                                onBlur={() => setEditingNoteId(null)}
                              />
                            </div>
                          </div>
                        ) : hasNote ? (
                          <button
                            type="button"
                            className="pressable ms-auto inline-flex h-8 shrink-0 scale-90 items-center justify-center gap-1 rounded-lg px-1.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                            aria-label={`מחק הערה עבור ${worker.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              clearNote(worker.id);
                            }}
                          >
                            <CircleX className="size-3.5 shrink-0" aria-hidden />
                            מחיקה
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="pressable ms-auto inline-flex h-8 shrink-0 scale-90 items-center justify-center gap-1 rounded-lg px-1.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={`הערה עבור ${worker.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingNoteId(worker.id);
                            }}
                          >
                            <PenLine className="size-3.5 shrink-0" aria-hidden />
                            הערה
                          </button>
                        )
                      ) : null}
                    </div>
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
            onClick={() => {
              const cleaned: Record<string, string> = {};
              for (const id of selectedIds) {
                const value = notes[id]?.trim();
                if (value) cleaned[id] = value;
              }
              onSave([...selectedIds], cleaned);
            }}
          >
            שמור ({selectedCount})
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
