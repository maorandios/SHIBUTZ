import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isVapidConfigured, readPushSubs, VAPID_PUBLIC_KEY } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const subs = await readPushSubs();
  return NextResponse.json({
    vapidConfigured: isVapidConfigured(),
    hasPublicKey: Boolean(VAPID_PUBLIC_KEY),
    hasPrivateKey: Boolean(process.env.VAPID_PRIVATE_KEY),
    subscriberCount: Object.keys(subs).length,
    thisUserDevices: Object.values(subs).filter(
      (row) => row.phoneNumber === user.phoneNumber,
    ).length,
  });
}
