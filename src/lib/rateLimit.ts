// Rate limiter backed by Postgres (RateLimitEntry), so limits are shared across
// serverless instances instead of living in per-instance memory.
import { prisma } from "@/lib/prisma";

export async function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const resetAt = new Date(Date.now() + windowMs);

  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitEntry" (key, count, "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimitEntry"."resetAt" < NOW() THEN 1 ELSE "RateLimitEntry".count + 1 END,
      "resetAt" = CASE WHEN "RateLimitEntry"."resetAt" < NOW() THEN ${resetAt} ELSE "RateLimitEntry"."resetAt" END
    RETURNING count, "resetAt"
  `;

  const row = rows[0];
  if (row.count > max) {
    return { ok: false, retryAfterSec: Math.ceil((row.resetAt.getTime() - Date.now()) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function getIp(req: Request): string {
  const xff = (req as Request & { headers: Headers }).headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "unknown";
}
