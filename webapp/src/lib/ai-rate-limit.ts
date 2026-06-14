import "server-only";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkAIRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(userId);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + WINDOW_MS;
    buckets.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  buckets.set(userId, existing);
  return { allowed: true, remaining: MAX_REQUESTS - existing.count, resetAt: existing.resetAt };
}
