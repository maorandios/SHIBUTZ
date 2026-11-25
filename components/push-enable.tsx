"use client";

import { useEffect } from "react";
import { ensurePushSubscription } from "@/lib/push-client";

type PushEnableProps = {
  enabled: boolean;
};

/**
 * Keeps Web Push subscribed whenever the user is logged in (desktop + mobile).
 * No in-app off switch — browsers only allow a one-time system permission prompt.
 */
export function PushEnable({ enabled }: PushEnableProps) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const activate = () => {
      void ensurePushSubscription();
    };

    activate();

    const onVisible = () => {
      if (document.visibilityState === "visible") activate();
    };
    const onFocus = () => activate();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(activate, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [enabled]);

  return null;
}
