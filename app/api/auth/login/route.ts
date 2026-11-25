import { NextResponse } from "next/server";
import { findAllowedUser } from "@/lib/allowed-users";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const phoneNumber =
    typeof body === "object" &&
    body !== null &&
    "phoneNumber" in body &&
    typeof (body as { phoneNumber: unknown }).phoneNumber === "string"
      ? (body as { phoneNumber: string }).phoneNumber
      : "";

  const user = findAllowedUser(phoneNumber);
  if (!user) {
    return NextResponse.json(
      { error: "מספר הטלפון אינו מורשה להתחברות" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(user);
  const response = NextResponse.json({
    user: { phoneNumber: user.phoneNumber, fullName: user.fullName },
  });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
