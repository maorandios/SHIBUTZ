"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, ListPlus, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AddEntitySheetProps = {
  title: string;
  variant: "worker" | "site";
  singlePlaceholder: string;
  bulkToggleLabel: string;
  bulkPlaceholder: string;
  onClose: () => void;
  onSaveSingle: (
    name: string,
  ) => { ok: true } | { ok: false; error: string };
  onSaveBulk: (raw: string) => {
    ok: boolean;
    added: number;
    skipped: number;
  };
  onNotice: (message: string, type?: "success" | "error" | "info") => void;
};

export function AddEntitySheet({
  title,
  variant,
  singlePlaceholder,
  bulkToggleLabel,
  bulkPlaceholder,
  onClose,
  onSaveSingle,
  onSaveBulk,
  onNotice,
}: AddEntitySheetProps) {
  const [visible, setVisible] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [singleName, setSingleName] = useState("");
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const TitleIcon = variant === "site" ? Building2 : UserPlus;
  const canSave = bulkMode
    ? bulkText.trim().length > 0
    : singleName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;

    if (bulkMode) {
      const result = onSaveBulk(bulkText);
      if (!result.ok) {
        onNotice("הוספה מרובה נכשלה", "error");
        return;
      }
      onNotice(
        result.added > 0
          ? `נוספו ${result.added}${result.skipped ? ` · דולגו ${result.skipped} כפולים` : ""}`
          : result.skipped
            ? "כל השמות כבר קיימים"
            : "לא נוספו פריטים",
        "success",
      );
      if (result.added > 0 || result.skipped > 0) onClose();
      return;
    }

    const result = onSaveSingle(singleName);
    if (!result.ok) {
      onNotice(result.error, "error");
      return;
    }
    onNotice("נוסף בהצלחה", "success");
    onClose();
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
        aria-label={title}
        className={cn(
          "sheet-panel relative z-10 flex w-full max-w-[34rem] flex-col rounded-t-xl border-t transition-[transform,max-height]",
          bulkMode ? "max-h-[88vh]" : "max-h-[70vh]",
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
            <TitleIcon
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h2 className="min-w-0 truncate font-heading text-lg font-medium text-foreground">
              {title}
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

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
          {bulkMode ? (
            <div className="flex flex-col gap-3">
              <Label htmlFor="bulk-entity-input">רשימת שמות</Label>
              <Textarea
                id="bulk-entity-input"
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={bulkPlaceholder}
                className="min-h-48"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="single-entity-input" className="sr-only">
                  {singlePlaceholder}
                </Label>
                <Input
                  id="single-entity-input"
                  value={singleName}
                  onChange={(event) => setSingleName(event.target.value)}
                  placeholder={singlePlaceholder}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canSave) handleSave();
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="pressable w-full"
                onClick={() => setBulkMode(true)}
              >
                <ListPlus className="size-4" />
                {bulkToggleLabel}
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <Button
            type="button"
            size="lg"
            className="pressable flex-1"
            disabled={!canSave}
            onClick={handleSave}
          >
            שמירה
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="pressable"
            onClick={onClose}
          >
            ביטול
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
