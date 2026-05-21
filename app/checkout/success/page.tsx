import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getOrderById } from "@/lib/orders"
import { RefractiveDock } from "@/components/navbar"
import Link from "next/link"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payment Received — MarrowStack",
}

// Landing page for Dodo Payments success redirect.
// This page is a UX hint only — payment is confirmed by the webhook, not this redirect.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const { orderId } = await searchParams
  const order = orderId ? await getOrderById(orderId) : null

  const isPaid     = order?.status === "paid" || order?.status === "delivered"
  const blockSlug  = order?.block_id ?? ""
  const blockName  = order?.block_name ?? "your block"

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />
      <main className="container mx-auto max-w-md px-4 pt-36 pb-24 text-center">
        {isPaid ? (
          <>
            <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "hsl(var(--status-success))" }} />
            <h1 className="text-2xl font-black text-reveal-light mb-2">Payment received</h1>
            <p className="text-sm mb-8" style={{ color: "hsl(var(--accent-mineral))" }}>
              Your purchase of <strong>{blockName}</strong> is confirmed.
              GitHub delivery is in progress — check your dashboard and email.
            </p>
          </>
        ) : (
          <>
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "hsl(var(--status-warning))" }} />
            <h1 className="text-2xl font-black text-reveal-light mb-2">Payment processing</h1>
            <p className="text-sm mb-8" style={{ color: "hsl(var(--accent-mineral))" }}>
              We&apos;re confirming your payment. This usually takes a few seconds.
              Check your dashboard for the latest status.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-foreground text-background cursor-pointer hover:opacity-90 transition-opacity">
              Go to Dashboard
            </span>
          </Link>
          {blockSlug && (
            <Link href={`/docs/blocks/${blockSlug}`}>
              <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium border cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: "hsl(var(--metal-border))", color: "hsl(var(--metal-foreground))" }}>
                Integration guide →
              </span>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
