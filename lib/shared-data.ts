import { EMPTY_APP_DATA, type AppData } from "@/lib/types";
import { validateAppData } from "@/lib/storage";
import { cloneData } from "@/lib/utils";
import { kvGet, kvSet } from "@/lib/redis";

export const APP_DATA_KEY = "ovdim:app-data";

export type SharedPayload = {
  revision: number;
  data: AppData;
};

export async function readSharedData(): Promise<SharedPayload> {
  const stored = await kvGet<SharedPayload>(APP_DATA_KEY);
  if (!stored || typeof stored.revision !== "number" || !stored.data) {
    return { revision: 0, data: cloneData(EMPTY_APP_DATA) };
  }

  const validated = validateAppData(stored.data);
  if (!validated.ok) {
    return { revision: stored.revision, data: cloneData(EMPTY_APP_DATA) };
  }

  return { revision: stored.revision, data: validated.data };
}

export async function writeSharedData(
  data: AppData,
  expectedRevision: number,
): Promise<
  | { ok: true; revision: number; data: AppData }
  | { ok: false; conflict: true; revision: number; data: AppData }
  | { ok: false; conflict: false; error: string }
> {
  const validated = validateAppData(data);
  if (!validated.ok) {
    return { ok: false, conflict: false, error: validated.error };
  }

  const current = await readSharedData();
  if (current.revision !== expectedRevision) {
    return {
      ok: false,
      conflict: true,
      revision: current.revision,
      data: current.data,
    };
  }

  const next: SharedPayload = {
    revision: current.revision + 1,
    data: validated.data,
  };
  await kvSet(APP_DATA_KEY, next);
  return { ok: true, revision: next.revision, data: next.data };
}
