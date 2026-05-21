import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { validateGithubUsername, deliverBlock, getRepoForBlock } from "@/lib/github"
import { getAdminClient } from "@/lib/supabase"
import { getOrdersByUser } from "@/lib/orders"
import { sendDeliveryEmail } from "@/lib/email"
import { limits, getIp } from "@/lib/ratelimit"
import { rateLimitExceeded, readBody } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// POST /api/user/github-username
// Validates the username against GitHub API, saves it, and re-triggers
// delivery for any paid but undelivered orders belonging to this user.
export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const rl = await limits.githubValidate(ip)
  if (!rl.ok) return rateLimitExceeded()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Unauthenticated" } }, { status: 401 })
  }

  const body = await readBody<{ githubUsername?: string }>(req)
  const githubUsername = String(body?.githubUsername ?? "").trim()
  if (!githubUsername) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "githubUsername required" } }, { status: 400 })
  }

  const validation = await validateGithubUsername(githubUsername)
  if (!validation.valid) {
    return NextResponse.json({ error: { code: "INVALID_USERNAME", message: validation.reason } }, { status: 422 })
  }

  const db = getAdminClient()
  const { error } = await db
    .from("ms_users")
    .update({ github_login: githubUsername })
    .eq("id", session.user.id)

  if (error) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save username" } }, { status: 500 })
  }

  const orders = await getOrdersByUser(session.user.id)
  const toDeliver = orders.filter((o) => o.status === "paid")

  const results: { orderId: string; delivered: boolean }[] = []
  for (const order of toDeliver) {
    const result = await deliverBlock(order.id)
    results.push({ orderId: order.id, delivered: result.delivered })

    if (result.delivered && session.user.email) {
      const repos = getRepoForBlock(order.block_id)
      await sendDeliveryEmail({
        to:              session.user.email,
        buyerName:       session.user.name ?? "",
        blockName:       order.block_name,
        blockSlug:       order.block_id,
        githubUsername,
        repoUrls:        repos,
      }).catch(() => {/* non-fatal */})
    }
  }

  return NextResponse.json({ ok: true, deliveries: results })
}
