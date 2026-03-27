const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

interface RateLimitEntry {
  readonly count: number;
  readonly firstRequest: number;
}

const store = new Map<string, RateLimitEntry>();

/** Remove expired entries periodically to prevent memory leaks */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.firstRequest > WINDOW_MS) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number | null;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.firstRequest > WINDOW_MS) {
    store.set(ip, { count: 1, firstRequest: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: null };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((entry.firstRequest + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  store.set(ip, { count: entry.count + 1, firstRequest: entry.firstRequest });
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count - 1,
    retryAfterSeconds: null,
  };
}
