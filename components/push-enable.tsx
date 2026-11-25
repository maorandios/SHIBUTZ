"use client";

import { useEffect } from "react";
import { ensurePushSubscription } from "@/lib/push-client";

type PushEnableProps = {
  enabled: boolean;
};

/** Ask for notification permission and register push after login (production PWA). */
export function PushEnable({ enabled }: PushEnableProps) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalDev) return;

    const timer = window.setTimeout(() => {
      void ensurePushSubscription();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [enabled]);

  return null;
}
