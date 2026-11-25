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

  const idNumber =
    typeof body === "object" &&
    body !== null &&
    "idNumber" in body &&
    typeof (body as { idNumber: unknown }).idNumber === "string"
      ? (body as { idNumber: string }).idNumber
      : "";

  const user = findAllowedUser(idNumber);
  if (!user) {
    return NextResponse.json(
      { error: "תעודת הזהות אינה מורשית להתחברות" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(user);
  const response = NextResponse.json({
    user: { idNumber: user.idNumber, fullName: user.fullName },
  });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
