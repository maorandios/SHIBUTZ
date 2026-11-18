"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Notice = { type: "success" | "error" | "info"; message: string };

type NoticeToastProps = {
  notice: Notice | null;
  onDismiss: () => void;
};

const EXIT_MS = 280;

export function NoticeToast({ notice, onDismiss }: NoticeToastProps) {
  const [ticket, setTicket] = useState<Notice | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (notice) {
      timer = setTimeout(() => {
        setExiting(false);
        setTicket(notice);
      }, 0);
    } else if (ticket) {
      timer = setTimeout(() => setExiting(true), 0);
      const clearTimer = setTimeout(() => {
        setTicket(null);
        setExiting(false);
      }, EXIT_MS);
      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notice, ticket]);

  if (!ticket) return null;

  const Icon =
    ticket.type === "success"
      ? CheckCircle2
      : ticket.type === "error"
        ? AlertCircle
        : Info;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          "pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
          exiting ? "toast-exit" : "toast-enter",
          ticket.type === "error" &&
            "border-destructive/20 bg-card text-destructive",
          ticket.type === "success" &&
            "border-transparent bg-charcoal text-charcoal-foreground",
          ticket.type === "info" &&
            "border-border bg-card text-foreground",
        )}
      >
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
            ticket.type === "success" && "bg-primary/20 text-primary",
            ticket.type === "error" && "bg-destructive/10 text-destructive",
            ticket.type === "info" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="text-right leading-snug">{ticket.message}</span>
      </button>
    </div>
  );
}
