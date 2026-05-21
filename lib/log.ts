// safeLog strips secrets from log payloads before they reach stdout.
// All API route logging must use safeLog instead of console.log.

const SECRET_PATTERNS = [
  /dodo[_-]?payments?[_-]?(?:api[_-]?key|webhook[_-]?secret)/i,
  /(?:private[_-]?key|secret(?:[_-]?key)?|api[_-]?key)/i,
  /authorization/i,
  /supabase[_-]?(?:service[_-]?role|anon)[_-]?key/i,
  /auth[_-]?secret/i,
  /github[_-]?(?:delivery[_-]?)?pat/i,
  /smtp[_-]?pass(?:word)?/i,
]

// Looks like a base58 private key (≥64 chars of base58 alphabet)
const BASE58_PRIVATE_RE = /[1-9A-HJ-NP-Za-km-z]{64,}/g

function redactValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value
  if (SECRET_PATTERNS.some((re) => re.test(key))) return "[REDACTED]"
  return value
}

function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj.map((v) => redactObject(v, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = redactValue(k, redactObject(v, depth + 1))
  }
  return out
}

function redactString(s: string): string {
  return s.replace(BASE58_PRIVATE_RE, (m) =>
    m.length >= 64 ? `[BASE58:${m.length}]` : m
  )
}

function prepare(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === "string") return redactString(arg)
    if (typeof arg === "object" && arg !== null) return redactObject(arg)
    return arg
  })
}

export const safeLog = {
  log:   (...args: unknown[]) => console.log(...prepare(args)),
  warn:  (...args: unknown[]) => console.warn(...prepare(args)),
  error: (...args: unknown[]) => console.error(...prepare(args)),
  info:  (...args: unknown[]) => console.info(...prepare(args)),
}
