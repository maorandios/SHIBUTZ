import { sendNotification, setVapidDetails } from "web-push";
import { kvGet, kvSet } from "@/lib/redis";

export const PUSH_SUBS_KEY = "ovdim:push:subs";

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type SubsMap = Record<string, PushSubscriptionJSON>;

function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:ovdim@localhost";
  if (!publicKey || !privateKey) return false;
  setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function readPushSubs(): Promise<SubsMap> {
  const stored = await kvGet<SubsMap>(PUSH_SUBS_KEY);
  return stored && typeof stored === "object" ? stored : {};
}

export async function savePushSubscription(
  phoneNumber: string,
  subscription: PushSubscriptionJSON,
): Promise<void> {
  const subs = await readPushSubs();
  subs[phoneNumber] = subscription;
  await kvSet(PUSH_SUBS_KEY, subs);
}

export async function removePushSubscription(phoneNumber: string): Promise<void> {
  const subs = await readPushSubs();
  if (!(phoneNumber in subs)) return;
  delete subs[phoneNumber];
  await kvSet(PUSH_SUBS_KEY, subs);
}

export async function notifySiteAssignmentUpdate(options: {
  actorName: string;
  siteName: string;
  excludePhoneNumber?: string;
}): Promise<{ sent: number; failed: number }> {
  if (!configureVapid()) {
    return { sent: 0, failed: 0 };
  }

  const body = `${options.actorName} עדכן שיבוץ עבור אתר ${options.siteName}`;
  const payload = JSON.stringify({
    title: "עובדים-געש",
    body,
    url: "/",
  });

  const subs = await readPushSubs();
  let sent = 0;
  let failed = 0;
  const nextSubs = { ...subs };

  await Promise.all(
    Object.entries(subs).map(async ([phone, subscription]) => {
      if (
        options.excludePhoneNumber &&
        phone === options.excludePhoneNumber
      ) {
        return;
      }
      try {
        await sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        failed += 1;
        const status =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          delete nextSubs[phone];
        }
      }
    }),
  );

  if (Object.keys(nextSubs).length !== Object.keys(subs).length) {
    await kvSet(PUSH_SUBS_KEY, nextSubs);
  }

  return { sent, failed };
}
