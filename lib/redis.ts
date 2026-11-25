import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/** In-memory fallback for local dev when Upstash env vars are missing. */
const memory = new Map<string, unknown>();

export function hasRedisEnv(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export function getRedis(): Redis | null {
  if (!hasRedisEnv()) return null;
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (client) {
    return (await client.get<T>(key)) ?? null;
  }
  return (memory.get(key) as T | undefined) ?? null;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.set(key, value);
    return;
  }
  memory.set(key, value);
}
