"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatHebrewDate,
  formatHebrewMonthYear,
  getMonthMatrix,
  HEBREW_WEEKDAY_SHORT,
  nextDay,
  parseLocalDate,
  previousDay,
  shiftMonth,
  todayLocal,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

type DateSelectorProps = {
  dateKey: string;
  onChange: (dateKey: string) => void;
  /** Dates (YYYY-MM-DD) that have at least one assignment. */
  datesWithAssignments?: ReadonlySet<string>;
};

export function DateSelector({
  dateKey,
  onChange,
  datesWithAssignments,
}: DateSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1 rounded-xl bg-card p-1 ring-1 ring-foreground/10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="pressable"
          aria-label="יום הבא"
          onClick={() => onChange(nextDay(dateKey))}
        >
          <ChevronRight className="size-5" />
        </Button>

        <button
          type="button"
          className="pressable flex min-h-11 flex-1 items-center justify-center rounded-lg px-2 py-1 transition-colors hover:bg-accent"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="text-sm font-medium text-foreground">
            {formatHebrewDate(dateKey)}
          </span>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="pressable"
          aria-label="יום קודם"
          onClick={() => onChange(previousDay(dateKey))}
        >
          <ChevronLeft className="size-5" />
        </Button>
      </div>

      {open && (
        <HebrewCalendarSheet
          dateKey={dateKey}
          onChange={onChange}
          onClose={() => setOpen(false)}
          datesWithAssignments={datesWithAssignments}
        />
      )}
    </>
  );
}

function HebrewCalendarSheet({
  dateKey,
  onChange,
  onClose,
  datesWithAssignments,
}: {
  dateKey: string;
  onChange: (dateKey: string) => void;
  onClose: () => void;
  datesWithAssignments?: ReadonlySet<string>;
}) {
  const selected = parseLocalDate(dateKey);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
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

  const cells = getMonthMatrix(viewYear, viewMonth);
  const today = todayLocal();

  const goMonth = (delta: number) => {
    const next = shiftMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.monthIndex);
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
        aria-label="בחירת תאריך"
        className={cn(
          "sheet-panel relative z-10 w-full max-w-[34rem] rounded-t-xl border-t transition-transform",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          transitionDuration: "var(--duration-sheet)",
          transitionTimingFunction: "var(--ease-sheet)",
        }}
      >
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-muted" />

        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
          <h2 className="font-heading text-base font-medium text-foreground">
            בחירת תאריך
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pressable"
            aria-label="סגור"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between px-2 pb-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pressable"
            aria-label="חודש הבא"
            onClick={() => goMonth(1)}
          >
            <ChevronRight className="size-5" />
          </Button>
          <p className="text-sm font-medium text-foreground">
            {formatHebrewMonthYear(viewYear, viewMonth)}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pressable"
            aria-label="חודש קודם"
            onClick={() => goMonth(-1)}
          >
            <ChevronLeft className="size-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 px-3 pb-2 text-center text-xs font-medium text-muted-foreground">
          {HEBREW_WEEKDAY_SHORT.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {cells.map((cell) => {
            const isSelected = cell.dateKey === dateKey;
            const isToday = cell.dateKey === today;
            const hasAssignments = Boolean(
              datesWithAssignments?.has(cell.dateKey),
            );
            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => {
                  onChange(cell.dateKey);
                  onClose();
                }}
                className={cn(
                  "pressable relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-sm font-medium transition-colors",
                  !cell.inMonth && "text-muted-foreground/40",
                  cell.inMonth &&
                    !isSelected &&
                    "text-foreground hover:bg-accent",
                  isSelected && "bg-primary text-primary-foreground",
                  isToday && !isSelected && "ring-1 ring-primary/50",
                )}
              >
                <span>{cell.day}</span>
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    hasAssignments
                      ? isSelected
                        ? "bg-primary-foreground"
                        : "bg-primary"
                      : "bg-transparent",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="pressable flex-1"
            onClick={() => {
              onChange(today);
              onClose();
            }}
          >
            היום
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="pressable flex-1"
            onClick={onClose}
          >
            סגור
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
