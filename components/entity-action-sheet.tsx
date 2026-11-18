"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Pencil, Trash2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Entity = { id: string; name: string };
type Variant = "worker" | "site";

type EditEntitySheetProps = {
  mode: "edit";
  variant: Variant;
  entity: Entity;
  onClose: () => void;
  onSave: (name: string) => { ok: true } | { ok: false; error: string };
  onNotice: (message: string, type?: "success" | "error" | "info") => void;
};

type DeleteEntitySheetProps = {
  mode: "delete";
  variant: Variant;
  entity: Entity;
  onClose: () => void;
  onConfirm: () => void;
};

type EntityActionSheetProps = EditEntitySheetProps | DeleteEntitySheetProps;

function TitleIcon({ variant, mode }: { variant: Variant; mode: "edit" | "delete" }) {
  if (mode === "delete") {
    return <Trash2 className="size-5 shrink-0 text-destructive" aria-hidden />;
  }
  if (variant === "site") {
    return <Building2 className="size-5 shrink-0 text-muted-foreground" aria-hidden />;
  }
  return <UserRound className="size-5 shrink-0 text-muted-foreground" aria-hidden />;
}

export function EntityActionSheet(props: EntityActionSheetProps) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(
    props.mode === "edit" ? props.entity.name : "",
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isEdit = props.mode === "edit";
  const title = isEdit
    ? props.variant === "site"
      ? "עריכת אתר"
      : "עריכת עובד"
    : props.variant === "site"
      ? "מחיקת אתר"
      : "מחיקת עובד";

  const canSave = isEdit && name.trim().length > 0;

  const handleSave = () => {
    if (!isEdit || !canSave) return;
    const result = props.onSave(name);
    if (!result.ok) {
      props.onNotice(result.error, "error");
      return;
    }
    props.onNotice("השם עודכן", "success");
    props.onClose();
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
        onClick={props.onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
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

        <div className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-2">
          <div className="flex min-w-0 items-center gap-2">
            <TitleIcon variant={props.variant} mode={props.mode} />
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
            onClick={props.onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-3 px-4 py-4">
          {isEdit ? (
            <div className="flex flex-col gap-3">
              <Label htmlFor="edit-entity-name">שם</Label>
              <Input
                id="edit-entity-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canSave) handleSave();
                }}
              />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              מחיקת &quot;{props.entity.name}&quot; תסיר גם שיבוצים קשורים בכל
              התאריכים. פעולה זו לא ניתנת לביטול.
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          {isEdit ? (
            <Button
              type="button"
              size="lg"
              className="pressable flex-1"
              disabled={!canSave}
              onClick={handleSave}
            >
              <Pencil className="size-4" />
              שמירה
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="pressable flex-1 bg-destructive text-white hover:bg-destructive/90 shadow-none"
              onClick={() => {
                props.onConfirm();
                props.onClose();
              }}
            >
              <Trash2 className="size-4" />
              מחק
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="pressable"
            onClick={props.onClose}
          >
            ביטול
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
