import { getAdminClient, type DbOrder, type OrderStatus, type PaymentRail } from "./supabase"

// ─── Order creation ───────────────────────────────────────────────────────────

export async function createOrder(params: {
  userId: string
  blockId: string
  blockName: string
  amountUsd: number
}): Promise<DbOrder> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("ms_orders")
    .insert({
      user_id: params.userId,
      block_id: params.blockId,
      block_name: params.blockName,
      status: "created" satisfies OrderStatus,
      amount_usd: params.amountUsd,
    })
    .select()
    .single()

  if (error) throw new Error(`createOrder: ${error.message}`)
  return data as DbOrder
}

// ─── Status transitions ───────────────────────────────────────────────────────

export async function setOrderAwaitingPayment(
  orderId: string,
  rail: PaymentRail,
  // Pass a string for fiat (Dodo external payment link id), or an object for crypto
  extra?: string | {
    cryptoAmount?: string
    cryptoCurrency?: "SOL" | "USDC"
    quotePriceUsd?: number
    quoteExpiresAt?: string
  }
) {
  const db = getAdminClient()
  const externalId    = typeof extra === "string" ? extra : undefined
  const cryptoExtra   = typeof extra === "object"  ? extra : undefined

  const { error } = await db
    .from("ms_orders")
    .update({
      status: "awaiting_payment" satisfies OrderStatus,
      rail,
      external_payment_id: externalId ?? null,
      crypto_amount:    cryptoExtra?.cryptoAmount    ?? null,
      crypto_currency:  cryptoExtra?.cryptoCurrency  ?? null,
      quote_price_usd:  cryptoExtra?.quotePriceUsd   ?? null,
      quote_expires_at: cryptoExtra?.quoteExpiresAt  ?? null,
    })
    .eq("id", orderId)
    .eq("status", "created")

  if (error) throw new Error(`setOrderAwaitingPayment: ${error.message}`)
}

// Idempotent: calling with the same external_payment_id is a no-op
export async function markOrderPaid(params: {
  orderId: string
  externalPaymentId: string
  githubUsername?: string
}): Promise<boolean> {
  const db = getAdminClient()

  // Guard against double-marking (idempotency)
  const { data: existing } = await db
    .from("ms_orders")
    .select("id, status")
    .eq("id", params.orderId)
    .single()

  if (!existing) throw new Error(`Order not found: ${params.orderId}`)
  if (existing.status === "paid" || existing.status === "delivered") return false // already handled

  const { error } = await db
    .from("ms_orders")
    .update({
      status: "paid" satisfies OrderStatus,
      external_payment_id: params.externalPaymentId,
      github_username: params.githubUsername ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", params.orderId)

  if (error) throw new Error(`markOrderPaid: ${error.message}`)
  return true
}

export async function markOrderDelivered(orderId: string) {
  const db = getAdminClient()
  const { error } = await db
    .from("ms_orders")
    .update({
      status: "delivered" satisfies OrderStatus,
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  if (error) throw new Error(`markOrderDelivered: ${error.message}`)
}

export async function markOrderFailed(orderId: string, reason: string) {
  const db = getAdminClient()
  await db
    .from("ms_orders")
    .update({ status: "failed" satisfies OrderStatus, failed_reason: reason })
    .eq("id", orderId)
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getOrderById(orderId: string): Promise<DbOrder | null> {
  const db = getAdminClient()
  const { data } = await db
    .from("ms_orders")
    .select()
    .eq("id", orderId)
    .single()
  return (data as DbOrder) ?? null
}

export async function getOrdersByUser(userId: string): Promise<DbOrder[]> {
  const db = getAdminClient()
  const { data } = await db
    .from("ms_orders")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return (data ?? []) as DbOrder[]
}

// Used by Dodo webhook to find order by external ID (idempotency guard)
export async function getOrderByExternalPaymentId(
  externalId: string
): Promise<DbOrder | null> {
  const db = getAdminClient()
  const { data } = await db
    .from("ms_orders")
    .select()
    .eq("external_payment_id", externalId)
    .single()
  return (data as DbOrder) ?? null
}

// ─── Delivery records ─────────────────────────────────────────────────────────

export async function recordDeliveryAttempt(params: {
  orderId: string
  githubUsername: string
  repo: string
  status: "delivered" | "failed"
  error?: string
}) {
  const db = getAdminClient()
  await db.from("ms_deliveries").insert({
    order_id: params.orderId,
    github_username: params.githubUsername,
    repo: params.repo,
    status: params.status,
    error: params.error ?? null,
    delivered_at: params.status === "delivered" ? new Date().toISOString() : null,
  })
}

export async function getDeliveriesByOrder(orderId: string) {
  const db = getAdminClient()
  const { data } = await db
    .from("ms_deliveries")
    .select()
    .eq("order_id", orderId)
    .order("attempted_at", { ascending: false })
  return data ?? []
}

// ─── Purchase check ───────────────────────────────────────────────────────────

export async function hasUserPurchasedBlock(userId: string, blockId: string): Promise<boolean> {
  const db = getAdminClient()
  const { data } = await db
    .from("ms_orders")
    .select("id")
    .eq("user_id", userId)
    .eq("block_id", blockId)
    .in("status", ["paid", "delivered"])
    .maybeSingle()
  return !!data
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function getAllOrders(limit = 100): Promise<DbOrder[]> {
  const db = getAdminClient()
  const { data } = await db
    .from("ms_orders")
    .select()
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []) as DbOrder[]
}
