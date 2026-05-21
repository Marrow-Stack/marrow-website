import { NextRequest, NextResponse } from "next/server"
import { safeLog } from "./log"

export interface ApiError {
  error: { code: string; message: string }
}

// Body size enforcement — wraps req.json() to reject payloads over maxBytes
export async function readBody<T>(
  req: NextRequest,
  maxBytes = 16 * 1024
): Promise<T | null> {
  const ct = req.headers.get("content-length")
  if (ct && parseInt(ct, 10) > maxBytes) return null
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

// Returns 503 with a structured error when MAINTENANCE_MODE=true
export function maintenanceGuard(): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== "true") return null
  return NextResponse.json(
    { error: { code: "MAINTENANCE", message: "MarrowStack is temporarily down for maintenance. Please try again shortly." } },
    { status: 503 }
  )
}

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>

// Wraps a route handler to catch errors and return a typed error envelope.
// Raw stacks never reach the client.
export function withApi(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      safeLog.error("[api]", err)
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } },
        { status: 500 }
      )
    }
  }
}

// Rate-limit response helper
export function rateLimitExceeded(): NextResponse {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
    { status: 429 }
  )
}
