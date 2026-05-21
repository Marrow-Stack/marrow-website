import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deliverBlock, getRepoForBlock } from "@/lib/github"
import { getOrderById } from "@/lib/orders"
import { sendDeliveryEmail } from "@/lib/email"
import { limits, getIp } from "@/lib/ratelimit"
import { maintenanceGuard, rateLimitExceeded, readBody } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const maintenance = maintenanceGuard()
  if (maintenance) return maintenance

  const ip = getIp(req)
  const rl = await limits.delivery(ip)
  if (!rl.ok) return rateLimitExceeded()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Unauthenticated" } }, { status: 401 })
  }

  const body    = await readBody<{ orderId?: string }>(req)
  const orderId = String(body?.orderId ?? "").trim()
  if (!orderId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "orderId required" } }, { status: 400 })
  }

  const order = await getOrderById(orderId)
  if (!order) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, { status: 404 })
  if (order.user_id !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 })
  }
  if (order.status !== "paid" && order.status !== "delivered") {
    return NextResponse.json({ error: { code: "INVALID_STATE", message: "Order not paid" } }, { status: 409 })
  }

  const result = await deliverBlock(orderId)

  if (result.needsGithubUsername) {
    return NextResponse.json({
      ok: false,
      needsGithubUsername: true,
      message: "We need your GitHub username before we can deliver.",
    })
  }

  if (!result.delivered && result.error) {
    return NextResponse.json({ ok: false, error: { code: "DELIVERY_FAILED", message: result.error } }, { status: 500 })
  }

  if (result.delivered && session.user.email && order.github_username) {
    const repos = getRepoForBlock(order.block_id)
    await sendDeliveryEmail({
      to:            session.user.email,
      buyerName:     session.user.name ?? "",
      blockName:     order.block_name,
      blockSlug:     order.block_id,
      githubUsername: order.github_username,
      repoUrls:      repos,
    }).catch(() => {/* non-fatal */})
  }

  return NextResponse.json({ ok: true, delivered: result.delivered })
}
