// ============================================
// FILE: src/lib/redis/client.ts
// ============================================
// Redis client menggunakan Upstash REST API
// (kompatibel dengan edge runtime & server components)

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

if (!REDIS_URL || !REDIS_TOKEN) {
  throw new Error("Missing Upstash Redis environment variables");
}

async function redisRequest<T>(
  command: string[],
): Promise<{ result: T } | { error: string }> {
  const res = await fetch(
    `${REDIS_URL}/${command.map(encodeURIComponent).join("/")}`,
    {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
      cache: "no-store",
    },
  );
  return res.json();
}

export const redis = {
  async get(key: string): Promise<string | null> {
    const res = await redisRequest<string | null>(["GET", key]);
    if ("error" in res) return null;
    return res.result;
  },

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    if (exSeconds) {
      await redisRequest(["SET", key, value, "EX", String(exSeconds)]);
    } else {
      await redisRequest(["SET", key, value]);
    }
  },

  async del(key: string): Promise<void> {
    await redisRequest(["DEL", key]);
  },

  async exists(key: string): Promise<boolean> {
    const res = await redisRequest<number>(["EXISTS", key]);
    if ("error" in res) return false;
    return res.result === 1;
  },
};
