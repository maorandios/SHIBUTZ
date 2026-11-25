import { sendNotification, setVapidDetails } from "web-push";
import { kvGet, kvSet } from "@/lib/redis";
import { VAPID_PUBLIC_KEY } from "@/lib/push-public";

export const PUSH_SUBS_KEY = "ovdim:push:subs";
export { VAPID_PUBLIC_KEY };

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type StoredSub = {
  phoneNumber: string;
  subscription: PushSubscriptionJSON;
};

/** endpoint -> subscription (supports multiple devices per user) */
type SubsMap = Record<string, StoredSub>;

export function isVapidConfigured(): boolean {
  return Boolean(
    VAPID_PUBLIC_KEY &&
      (process.env.VAPID_PRIVATE_KEY || "").length > 0,
  );
}

function configureVapid(): boolean {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:ovdim@gaash.local";
  if (!VAPID_PUBLIC_KEY || !privateKey) return false;
  setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
  return true;
}

export async function readPushSubs(): Promise<SubsMap> {
  const stored = await kvGet<SubsMap | Record<string, PushSubscriptionJSON>>(
    PUSH_SUBS_KEY,
  );
  if (!stored || typeof stored !== "object") return {};

  // Migrate legacy phone->subscription map to endpoint->StoredSub.
  const first = Object.values(stored)[0] as
    | StoredSub
    | PushSubscriptionJSON
    | undefined;
  if (!first) return {};

  if ("subscription" in first && "phoneNumber" in first) {
    return stored as SubsMap;
  }

  const migrated: SubsMap = {};
  for (const [phoneNumber, subscription] of Object.entries(
    stored as Record<string, PushSubscriptionJSON>,
  )) {
    if (!subscription?.endpoint) continue;
    migrated[subscription.endpoint] = { phoneNumber, subscription };
  }
  await kvSet(PUSH_SUBS_KEY, migrated);
  return migrated;
}

export async function savePushSubscription(
  phoneNumber: string,
  subscription: PushSubscriptionJSON,
): Promise<void> {
  const subs = await readPushSubs();
  // Drop older rows for this phone with a different endpoint (optional cleanup).
  for (const [endpoint, row] of Object.entries(subs)) {
    if (row.phoneNumber === phoneNumber && endpoint !== subscription.endpoint) {
      // keep multiple devices — do not delete
    }
  }
  subs[subscription.endpoint] = { phoneNumber, subscription };
  await kvSet(PUSH_SUBS_KEY, subs);
}

export async function notifySiteAssignmentUpdate(options: {
  actorName: string;
  siteName: string;
  excludeEndpoint?: string;
}): Promise<{
  sent: number;
  failed: number;
  subscribers: number;
  vapidConfigured: boolean;
}> {
  const vapidConfigured = configureVapid();
  if (!vapidConfigured) {
    return { sent: 0, failed: 0, subscribers: 0, vapidConfigured: false };
  }

  const body = `${options.actorName} עדכן שיבוץ עבור אתר ${options.siteName}`;
  const payload = JSON.stringify({
    title: "עובדים-געש",
    body,
    url: "/",
  });

  const subs = await readPushSubs();
  const entries = Object.entries(subs);
  let sent = 0;
  let failed = 0;
  const nextSubs = { ...subs };

  await Promise.all(
    entries.map(async ([endpoint, row]) => {
      if (
        options.excludeEndpoint &&
        endpoint === options.excludeEndpoint
      ) {
        return;
      }
      try {
        await sendNotification(row.subscription, payload);
        sent += 1;
      } catch (error) {
        failed += 1;
        const status =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          delete nextSubs[endpoint];
        }
      }
    }),
  );

  if (Object.keys(nextSubs).length !== Object.keys(subs).length) {
    await kvSet(PUSH_SUBS_KEY, nextSubs);
  }

  return {
    sent,
    failed,
    subscribers: entries.length,
    vapidConfigured: true,
  };
}
