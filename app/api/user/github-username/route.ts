import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { validateGithubUsername } from "@/lib/github"
import { getAdminClient } from "@/lib/supabase"
import { deliverBlock } from "@/lib/github"
import { getOrdersByUser } from "@/lib/orders"
import { sendDeliveryEmail } from "@/lib/email"
import { getRepoForBlock } from "@/lib/github"

// POST /api/user/github-username
// Body: { githubUsername: string }
// Validates the username against GitHub API, saves it, and re-triggers
// delivery for any paid but undelivered orders belonging to this user.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const githubUsername = String(body?.githubUsername ?? "").trim()
  if (!githubUsername) {
    return NextResponse.json({ error: "githubUsername required" }, { status: 400 })
  }

  // Validate against GitHub API
  const validation = await validateGithubUsername(githubUsername)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 422 })
  }

  const db = getAdminClient()
  const { error } = await db
    .from("ms_users")
    .update({ github_login: githubUsername })
    .eq("id", session.user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to save username" }, { status: 500 })
  }

  // Re-trigger delivery for any paid orders that need GitHub delivery
  const orders = await getOrdersByUser(session.user.id)
  const toDeliver = orders.filter(
    (o) => o.status === "paid" || o.status === "delivered"
  )

  const results: { orderId: string; delivered: boolean }[] = []
  for (const order of toDeliver) {
    if (order.status === "delivered") {
      results.push({ orderId: order.id, delivered: true })
      continue
    }
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
