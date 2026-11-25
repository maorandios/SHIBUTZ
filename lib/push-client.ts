"use client";

import { VAPID_PUBLIC_KEY } from "@/lib/push-public";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function canUsePush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Must be called from a user gesture (click) the first time for Chrome desktop.
 * Keeps subscription active on desktop and mobile.
 */
export async function ensurePushSubscription(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!canUsePush()) {
    return { ok: false, reason: "unsupported" };
  }

  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false, reason: "missing-vapid-public" };
  }

  if (Notification.permission === "denied") {
    return { ok: false, reason: "denied" };
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "permission-not-granted" };
    }
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ) as BufferSource,
      });
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!response.ok) {
      return { ok: false, reason: "subscribe-api-failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "subscribe-threw" };
  }
}

export async function notifySiteAssignment(siteName: string): Promise<void> {
  try {
    await fetch("/api/push/notify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteName }),
    });
  } catch {
    // Non-blocking — assignment save already succeeded.
  }
}
