import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { notifySiteAssignmentUpdate } from "@/lib/push";

export const runtime = "nodejs";

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

  const siteName =
    typeof body === "object" &&
    body !== null &&
    "siteName" in body &&
    typeof (body as { siteName: unknown }).siteName === "string"
      ? (body as { siteName: string }).siteName.trim()
      : "";

  if (!siteName) {
    return NextResponse.json({ error: "חסר שם אתר" }, { status: 400 });
  }

  const result = await notifySiteAssignmentUpdate({
    actorName: user.fullName,
    siteName,
    excludePhoneNumber: user.phoneNumber,
  });

  return NextResponse.json(result);
}
