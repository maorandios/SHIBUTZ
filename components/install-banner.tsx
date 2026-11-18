"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

function isInstalledPwa(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  if (document.referrer.startsWith("android-app://")) return true;
  return false;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!isAndroid() || isInstalledPwa()) {
      setHidden(true);
      return;
    }

    setHidden(false);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };

    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => {
      if (isInstalledPwa()) {
        setDeferred(null);
        setHidden(true);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayMode);
    };
  }, []);

  if (hidden || !deferred) return null;

  return (
    <button
      type="button"
      className="pressable flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
      onClick={async () => {
        const promptEvent = deferred;
        setDeferred(null);
        try {
          await promptEvent.prompt();
          const choice = await promptEvent.userChoice;
          if (choice.outcome === "accepted" || isInstalledPwa()) {
            setHidden(true);
          }
        } catch {
          // Browser may reject a second prompt — keep banner hidden until next event.
        }
      }}
    >
      <ArrowDownToLine className="size-4 shrink-0" aria-hidden />
      <span>לחץ כאן להתקנה בטלפון הנייד</span>
    </button>
  );
}
