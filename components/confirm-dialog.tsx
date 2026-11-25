"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const close = () => onOpenChange(false);

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
        onClick={close}
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        aria-describedby="confirm-sheet-desc"
        className={cn(
          "sheet-panel relative z-10 flex w-full max-w-[34rem] flex-col rounded-t-xl border-t transition-transform",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          transitionDuration: "var(--duration-sheet)",
          transitionTimingFunction: "var(--ease-sheet)",
        }}
      >
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-muted" />

        <div className="space-y-2 px-4 pb-2 pt-3 text-right">
          <h2
            id="confirm-sheet-title"
            className="font-heading text-lg font-medium text-foreground"
          >
            {title}
          </h2>
          <p
            id="confirm-sheet-desc"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <Button
            type="button"
            size="lg"
            className={cn(
              "pressable w-full",
              destructive &&
                "bg-destructive text-white hover:bg-destructive/90 shadow-none",
            )}
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            {confirmLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="pressable w-full"
            onClick={close}
          >
            {cancelLabel}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
