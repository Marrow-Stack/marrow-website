import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAllOrders } from "@/lib/orders"
import { getAdminClient } from "@/lib/supabase"
import { RefractiveDock } from "@/components/navbar"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Orders — Admin — MarrowStack",
}

// Simple admin email allowlist. In production, use a proper RBAC check.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim())

const STATUS_COLOR: Record<string, string> = {
  created:          "hsl(var(--metal-shine))",
  awaiting_payment: "#d29922",
  paid:             "#79c0ff",
  delivered:        "#3fb950",
  failed:           "#f85149",
  refunded:         "#6e7681",
}

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const email = session.user.email ?? ""
  if (!ADMIN_EMAILS.includes(email) && ADMIN_EMAILS[0] !== "") {
    redirect("/dashboard")
  }

  const orders = await getAllOrders(200)

  // Attach delivery records
  const db = getAdminClient()
  const { data: deliveries } = await db
    .from("ms_deliveries")
    .select()
    .in("order_id", orders.map((o) => o.id))

  const deliveriesByOrder: Record<string, { status: string; github_username: string; error?: string }[]> =
    {}
  for (const d of deliveries ?? []) {
    if (!deliveriesByOrder[d.order_id]) deliveriesByOrder[d.order_id] = []
    deliveriesByOrder[d.order_id].push(d)
  }

  const totalRevenue = orders
    .filter((o) => o.status === "paid" || o.status === "delivered")
    .reduce((sum, o) => sum + (o.amount_usd ?? 0), 0)

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />
      <main className="container mx-auto max-w-6xl px-4 pt-36 pb-24">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
            Admin
          </p>
          <h1 className="text-3xl font-black text-reveal-light">Order Reconciliation</h1>
          <p className="text-sm mt-2" style={{ color: "hsl(var(--accent-mineral))" }}>
            {orders.length} orders · ${totalRevenue.toFixed(2)} confirmed revenue
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "hsl(var(--metal-border))" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--metal-gradient)", borderBottom: "1px solid hsl(var(--metal-border))" }}>
                {["Order ID", "Block", "Rail", "USD", "Crypto", "Status", "GitHub", "Delivery", "Created"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "hsl(var(--metal-shine))" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const latestDelivery = (deliveriesByOrder[order.id] ?? [])[0]
                return (
                  <tr
                    key={order.id}
                    className={i % 2 !== 0 ? "bg-black/[0.03] dark:bg-white/[0.03]" : ""}
                    style={{ borderBottom: i < orders.length - 1 ? "1px solid hsl(var(--metal-border))" : "none" }}
                  >
                    <td className="px-4 py-2.5 font-mono" style={{ color: "hsl(var(--metal-shine))" }}>
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "hsl(var(--metal-foreground))" }}>
                      {order.block_name}
                    </td>
                    <td className="px-4 py-2.5 uppercase font-mono" style={{ color: "hsl(var(--accent-mineral))" }}>
                      {order.rail ?? "—"}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "hsl(var(--metal-foreground))" }}>
                      ${order.amount_usd?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: "hsl(var(--accent-mineral))" }}>
                      {order.crypto_amount ? `${order.crypto_amount} ${order.crypto_currency}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          color:      STATUS_COLOR[order.status] ?? "hsl(var(--metal-shine))",
                          background: `${STATUS_COLOR[order.status] ?? "hsl(var(--metal-shine))"}18`,
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: "hsl(var(--accent-mineral))" }}>
                      {order.github_username ? `@${order.github_username}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {latestDelivery ? (
                        <span
                          className="text-[10px]"
                          style={{
                            color: latestDelivery.status === "delivered" ? "#3fb950"
                              : latestDelivery.status === "failed" ? "#f85149"
                              : "hsl(var(--metal-shine))",
                          }}
                        >
                          {latestDelivery.status}
                          {latestDelivery.error ? `: ${latestDelivery.error}` : ""}
                        </span>
                      ) : (
                        <span style={{ color: "hsl(var(--metal-shine))" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "hsl(var(--metal-shine))" }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
