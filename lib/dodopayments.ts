// Dodo Payments API — Checkout Sessions
// Mirrors the working implementation from marrow-platform exactly.
// Docs: https://docs.dodopayments.com/developer-resources/integration-guide

import { Webhook } from "standardwebhooks"

const BASE =
  process.env.DODO_PAYMENTS_MODE === "test"
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com"

async function dodo(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok)
    throw new Error(`Dodo ${path} failed (${res.status}): ${JSON.stringify(data)}`)
  return data
}

// Create a checkout session → returns checkout_url to redirect buyer
export async function createCheckoutSession(params: {
  productId:     string
  customerEmail: string
  customerName:  string
  returnUrl:     string
  metadata?:     Record<string, string>
}): Promise<{ checkout_url: string; payment_id: string }> {
  return dodo("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer:     { email: params.customerEmail, name: params.customerName },
      return_url:   params.returnUrl,
      ...(params.metadata
        ? {
            metadata: Object.fromEntries(
              Object.entries(params.metadata).map(([k, v]) => [`metadata_${k}`, v])
            ),
          }
        : {}),
    }),
  })
}

// Verify an incoming webhook using the standardwebhooks spec.
// Headers expected from Dodo: webhook-id, webhook-signature, webhook-timestamp
export async function verifyDodoWebhook(
  rawBody: string,
  headers: {
    "webhook-id":        string
    "webhook-signature": string
    "webhook-timestamp": string
  }
): Promise<boolean> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET
  if (!secret) {
    console.error("[dodo-webhook] DODO_PAYMENTS_WEBHOOK_SECRET is not set")
    return false
  }
  try {
    const wh = new Webhook(secret)
    await wh.verify(rawBody, headers)
    return true
  } catch {
    return false
  }
}
