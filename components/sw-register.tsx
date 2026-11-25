"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isLocalDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Keep SW off on localhost so HMR/CSS aren't blocked; push needs production HTTPS.
    if (isLocalDev) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          for (const key of keys) {
            if (key.startsWith("ovdim-shell-")) {
              void caches.delete(key);
            }
          }
        });
      }
      return;
    }

    const register = async () => {
      try {
        // Desktop + mobile: SW required for Web Push in the browser/PWA.
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Silent failure — app still works online without SW.
      }
    };

    void register();
  }, []);

  return null;
}
