"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Notice = { type: "success" | "error" | "info"; message: string };

type NoticeToastProps = {
  notice: Notice | null;
  onDismiss: () => void;
};

const EXIT_MS = 320;

export function NoticeToast({ notice, onDismiss }: NoticeToastProps) {
  const [ticket, setTicket] = useState<Notice | null>(null);
  const [shown, setShown] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    if (notice) {
      setTicket(notice);
      setShown(false);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShown(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setShown(false);
    exitTimer.current = setTimeout(() => {
      setTicket(null);
      exitTimer.current = null;
    }, EXIT_MS);

    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [notice]);

  if (!ticket) return null;

  const Icon =
    ticket.type === "success"
      ? Check
      : ticket.type === "error"
        ? AlertCircle
        : Info;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
    >
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          "pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-[transform,opacity]",
          shown
            ? "translate-y-0 opacity-100"
            : "-translate-y-5 opacity-0",
          ticket.type === "error" &&
            "border-destructive/20 bg-card text-destructive",
          ticket.type === "success" &&
            "border-transparent bg-charcoal text-charcoal-foreground",
          ticket.type === "info" &&
            "border-border bg-card text-foreground",
        )}
        style={{
          transitionDuration: `${EXIT_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
            ticket.type === "success" && "bg-primary text-white",
            ticket.type === "error" && "bg-destructive/10 text-destructive",
            ticket.type === "info" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" strokeWidth={2.5} aria-hidden />
        </span>
        <span className="text-right leading-snug">{ticket.message}</span>
      </button>
    </div>
  );
}
