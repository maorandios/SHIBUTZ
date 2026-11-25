import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

/** In-memory fallback for local dev when Upstash env vars are missing. */
const memory = new Map<string, unknown>();

function redisUrl(): string | undefined {
  return (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    undefined
  );
}

function redisToken(): string | undefined {
  return (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    undefined
  );
}

export function hasRedisEnv(): boolean {
  return Boolean(redisUrl() && redisToken());
}

export function getRedis(): Redis | null {
  if (!hasRedisEnv()) return null;
  if (!redis) {
    redis = new Redis({
      url: redisUrl()!,
      token: redisToken()!,
    });
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
