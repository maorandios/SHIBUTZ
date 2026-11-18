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

    // In local development, unregister any existing SW so HMR/CSS updates aren't blocked.
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
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version ready — activate on next navigation/reload.
            }
          });
        });
      } catch {
        // Silent failure — app still works online without SW.
      }
    };

    void register();
  }, []);

  return null;
}
