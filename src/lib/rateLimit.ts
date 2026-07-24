// Simple in-memory rate limiter per IP.
// Works per serverless instance; for stricter limits use a shared store (Redis/KV).

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > max) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function getIp(req: Request): string {
  const xff = (req as Request & { headers: Headers }).headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "unknown";
}
