import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  savePushSubscription,
  type PushSubscriptionJSON,
} from "@/lib/push";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const subscription =
    typeof body === "object" &&
    body !== null &&
    "subscription" in body
      ? (body as { subscription: PushSubscriptionJSON }).subscription
      : null;

  if (
    !subscription?.endpoint ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return NextResponse.json({ error: "מנוי פוש לא תקין" }, { status: 400 });
  }

  await savePushSubscription(user.phoneNumber, subscription);
  return NextResponse.json({ ok: true });
}
