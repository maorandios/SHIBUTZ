import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { readSharedData, writeSharedData } from "@/lib/shared-data";
import type { AppData } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const payload = await readSharedData();
  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
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

  if (
    typeof body !== "object" ||
    body === null ||
    !("data" in body) ||
    !("revision" in body) ||
    typeof (body as { revision: unknown }).revision !== "number"
  ) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const { data, revision } = body as { data: AppData; revision: number };
  const result = await writeSharedData(data, revision);

  if (!result.ok && result.conflict) {
    return NextResponse.json(
      {
        error: "הנתונים עודכנו במכשיר אחר",
        revision: result.revision,
        data: result.data,
      },
      { status: 409 },
    );
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    revision: result.revision,
    data: result.data,
  });
}
