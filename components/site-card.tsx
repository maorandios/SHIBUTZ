"use client";

import { useRef } from "react";
import { Building2, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Site } from "@/lib/types";

const LONG_PRESS_MS = 480;

type SiteCardProps = {
  site: Site;
  count: number;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect: (siteId: string) => void;
  onLongPress?: (siteId: string) => void;
};

export function SiteCard({
  site,
  count,
  selectionMode = false,
  selected = false,
  onSelect,
  onLongPress,
}: SiteCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startPress = () => {
    if (selectionMode || !onLongPress) return;
    longPressedRef.current = false;
    clearTimer();
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onLongPress(site.id);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(12);
      }
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    clearTimer();
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (longPressedRef.current) {
          longPressedRef.current = false;
          return;
        }
        onSelect(site.id);
      }}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "pressable min-h-[4.5rem] w-full rounded-xl bg-card px-4 py-4 text-right ring-1 transition-colors",
        "hover:bg-accent active:bg-accent",
        selected
          ? "ring-2 ring-primary"
          : "ring-foreground/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Building2
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate text-base font-medium text-foreground">
            {site.name}
          </span>
        </div>

        {count > 0 && (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-primary-foreground">
            {count}
          </span>
        )}

        {selectionMode ? (
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
        ) : (
          <ChevronLeft className="size-5 shrink-0 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
