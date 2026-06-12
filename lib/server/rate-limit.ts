import { PublicApiError } from "@/lib/server/api-errors";

type RateLimitConfig = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const generateTextbookRateLimit: RateLimitConfig = {
  keyPrefix: "generate-textbook",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

export const extractRateLimit: RateLimitConfig = {
  keyPrefix: "extract",
  limit: 20,
  windowMs: 10 * 60 * 1000,
};

export function enforceRateLimit(request: Request, config: RateLimitConfig) {
  const now = Date.now();
  const key = `${config.keyPrefix}:${getClientKey(request)}`;
  const bucket = buckets.get(key);

  cleanupBuckets(now);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return;
  }

  if (bucket.count >= config.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new PublicApiError(
      429,
      "RATE_LIMITED",
      `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
      retryAfterSeconds,
    );
  }

  bucket.count += 1;
}

function cleanupBuckets(now: number) {
  if (buckets.size < 1_000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const vercelId = request.headers.get("x-vercel-id")?.split("::")[0]?.trim();

  return forwardedFor || realIp || vercelId || "anonymous";
}
