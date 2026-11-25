"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensurePushSubscription } from "@/lib/push-client";

type PushEnableProps = {
  enabled: boolean;
};

/**
 * Re-subscribe when already granted. First-time permission must come from a click
 * (see login button / enable button) — Chrome desktop blocks requestPermission without a gesture.
 */
export function PushEnable({ enabled }: PushEnableProps) {
  const [needsClick, setNeedsClick] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const sync = () => {
      if (Notification.permission === "granted") {
        setNeedsClick(false);
        void ensurePushSubscription();
      } else if (Notification.permission === "default") {
        setNeedsClick(true);
      } else {
        setNeedsClick(false);
      }
    };

    sync();

    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", sync);
    const interval = window.setInterval(sync, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", sync);
      window.clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled || !needsClick) return null;

  return (
    <div className="border-b border-border bg-muted/40 px-4 py-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="pressable w-full"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void ensurePushSubscription().finally(() => {
            setBusy(false);
            if (typeof Notification !== "undefined") {
              setNeedsClick(Notification.permission !== "granted");
            }
          });
        }}
      >
        <Bell className="size-4" />
        {busy ? "מפעיל התראות..." : "הפעלת התראות שיבוץ"}
      </Button>
    </div>
  );
}
