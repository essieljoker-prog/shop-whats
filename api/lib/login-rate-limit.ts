const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_TRACKED_IDENTIFIERS = 10_000;

type AttemptBucket = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
};

const attempts = new Map<string, AttemptBucket>();

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function isLoginAllowed(identifier: string, now = Date.now()): boolean {
  const key = normalizeIdentifier(identifier);
  const bucket = attempts.get(key);
  if (!bucket) return true;
  if (bucket.blockedUntil > now) return false;
  if (now - bucket.windowStartedAt >= WINDOW_MS) attempts.delete(key);
  return true;
}

export function recordLoginFailure(identifier: string, now = Date.now()): void {
  const key = normalizeIdentifier(identifier);
  const current = attempts.get(key);
  if (current?.blockedUntil && current.blockedUntil > now) return;

  const bucket =
    current && now - current.windowStartedAt < WINDOW_MS
      ? current
      : { failures: 0, windowStartedAt: now, blockedUntil: 0 };

  bucket.failures += 1;
  if (bucket.failures >= MAX_FAILURES) bucket.blockedUntil = now + WINDOW_MS;
  attempts.delete(key);
  attempts.set(key, bucket);

  if (attempts.size > MAX_TRACKED_IDENTIFIERS) {
    const oldest = attempts.keys().next().value;
    if (oldest !== undefined) attempts.delete(oldest);
  }
}

export function clearLoginFailures(identifier: string): void {
  attempts.delete(normalizeIdentifier(identifier));
}
