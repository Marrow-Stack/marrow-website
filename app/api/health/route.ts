import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Health probe — returns env label and version, never secret values.
// Vercel uses this to verify the deployment is alive.
export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "local"
  const version = process.env.npm_package_version ?? "0.1.0"

  return NextResponse.json({
    ok: true,
    version,
    commit,
    env: process.env.NODE_ENV === "production" ? "production" : "development",
  })
}
