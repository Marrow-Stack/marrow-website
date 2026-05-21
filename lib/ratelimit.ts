// Sliding-window rate limiter.
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL is set; falls back to an
// in-process Map otherwise. The in-process limiter resets on cold-start —
// fine for Vercel serverless (one instance per region), not for long-lived
// multi-instance servers.

interface LimitResult {
  ok: boolean
  remaining: number
  resetAt: number // unix ms
}

// ─── In-process limiter ───────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[]
  windowMs: number
  max: number
}

const store = new Map<string, WindowEntry>()

function inProcessLimit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now()
  const entry = store.get(key) ?? { timestamps: [], windowMs, max }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
  const remaining = Math.max(0, max - entry.timestamps.length)

  if (entry.timestamps.length >= max) {
    store.set(key, entry)
    const resetAt = entry.timestamps[0] + windowMs
    return { ok: false, remaining: 0, resetAt }
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return { ok: true, remaining: remaining - 1, resetAt: now + windowMs }
}

// ─── Upstash limiter (optional) ───────────────────────────────────────────────

let upstashWarnedOnce = false

async function upstashLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<LimitResult | null> {
  const restUrl   = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!restUrl || !restToken) return null

  try {
    const windowSec = Math.ceil(windowMs / 1000)
    const res = await fetch(`${restUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${restToken}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec, "NX"],
        ["TTL", key],
      ]),
    })
    if (!res.ok) return null
    const [incrResult, , ttlResult] = (await res.json()) as { result: number }[]
    const count   = incrResult.result
    const ttlSec  = ttlResult.result
    const resetAt = Date.now() + ttlSec * 1000
    const remaining = Math.max(0, max - count)
    return { ok: count <= max, remaining, resetAt }
  } catch {
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<LimitResult> {
  const upstashResult = await upstashLimit(key, max, windowMs)

  if (upstashResult !== null) return upstashResult

  // Upstash not configured — warn once in production, use in-process fallback
  if (process.env.NODE_ENV === "production" && !upstashWarnedOnce) {
    upstashWarnedOnce = true
    console.warn(
      "[ratelimit] Upstash not configured — using in-process rate limiter. " +
        "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for distributed limiting."
    )
  }

  return inProcessLimit(key, max, windowMs)
}

// Pre-configured limiters for each API surface
export const limits = {
  checkout:      (ip: string) => rateLimit(`rl:checkout:${ip}`,      10,  60_000),
  webhook:       (ip: string) => rateLimit(`rl:webhook:${ip}`,       60,  60_000),
  delivery:      (ip: string) => rateLimit(`rl:delivery:${ip}`,      20,  60_000),
  githubValidate:(ip: string) => rateLimit(`rl:ghvalidate:${ip}`,    30,  60_000),
  nonce:         (ip: string) => rateLimit(`rl:nonce:${ip}`,         30,  60_000),
  playground:    (ip: string) => rateLimit(`rl:playground:${ip}`,    20,  60_000),
}

export function getIp(req: { headers: { get(k: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
