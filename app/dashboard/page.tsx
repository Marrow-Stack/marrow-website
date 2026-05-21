import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getOrdersByUser, getDeliveriesByOrder } from "@/lib/orders"
import { RefractiveDock } from "@/components/navbar"
import { Footer } from "@/components/Footer"
import { DashboardClient } from "./DashboardClient"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard — MarrowStack",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard")

  const orders = await getOrdersByUser(session.user.id)

  // Attach deliveries to each order
  const ordersWithDeliveries = await Promise.all(
    orders.map(async (order) => ({
      order,
      deliveries: await getDeliveriesByOrder(order.id),
    }))
  )

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />
      <main className="container mx-auto max-w-3xl px-4 pt-36 pb-24">
        <div className="mb-10">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            Your account
          </p>
          <h1 className="text-3xl font-black text-reveal-light leading-tight">
            Dashboard
          </h1>
          <p className="text-sm mt-2" style={{ color: "hsl(var(--accent-mineral))" }}>
            {session.user.githubLogin
              ? `Signed in as @${session.user.githubLogin}`
              : session.user.walletAddress
              ? `Wallet: ${session.user.walletAddress.slice(0, 8)}…${session.user.walletAddress.slice(-4)}`
              : session.user.email}
          </p>
        </div>

        <DashboardClient
          userId={session.user.id}
          githubLogin={session.user.githubLogin ?? null}
          walletAddress={session.user.walletAddress ?? null}
          ordersWithDeliveries={ordersWithDeliveries}
        />
      </main>
      <Footer />
    </div>
  )
}
