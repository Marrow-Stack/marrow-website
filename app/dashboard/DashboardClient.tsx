"use client"

import React, { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertCircle, RotateCcw, ExternalLink, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import type { DbOrder, DbDelivery } from "@/lib/supabase"

interface Props {
  userId:               string
  githubLogin:          string | null
  walletAddress:        string | null
  ordersWithDeliveries: Array<{ order: DbOrder; deliveries: DbDelivery[] }>
}

// ─── GitHub username prompt (wallet-only buyers) ──────────────────────────────

function GithubUsernamePrompt({ onSaved }: { onSaved: () => void }) {
  const [username, setUsername] = useState("")
  const [error, setError]       = useState("")
  const [saving, setSaving]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/user/github-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: username.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Failed to save username")
        setSaving(false)
        return
      }
      onSaved()
    } catch {
      setError("Network error. Please try again.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm" style={{ color: "hsl(var(--metal-foreground))" }}>
        Enter your GitHub username so we can deliver your block(s).
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your-github-username"
          className="flex-1 h-9 px-3 rounded-lg text-sm outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            background:   "var(--metal-gradient)",
            border:       "1px solid hsl(var(--metal-border))",
            color:        "hsl(var(--metal-foreground))",
          }}
        />
        <motion.button
          whileTap={{ y: 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          type="submit"
          disabled={saving || !username.trim()}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-foreground text-background disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : "Save"}
        </motion.button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "hsl(var(--status-error))" }}>{error}</p>
      )}
    </form>
  )
}

// ─── Single order card ────────────────────────────────────────────────────────

function OrderCard({
  order,
  deliveries,
  onRedeliver,
}: {
  order: DbOrder
  deliveries: DbDelivery[]
  onRedeliver: (orderId: string) => Promise<{ needsGithubUsername?: boolean; error?: string }>
}) {
  const [delivering, startDelivering] = useTransition()
  const [_result, setResult]          = useState<{ needsGithubUsername?: boolean; error?: string } | null>(null)
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)

  const latestDelivery = deliveries[0]
  const isDelivered    = order.status === "delivered" || latestDelivery?.status === "delivered"
  const hasFailed      = latestDelivery?.status === "failed"

  const handleRedeliver = () => {
    startDelivering(async () => {
      const r = await onRedeliver(order.id)
      setResult(r)
      if (r.needsGithubUsername) setShowUsernamePrompt(true)
    })
  }

  const statusColor =
    order.status === "delivered" ? "hsl(var(--status-success))"
    : order.status === "paid"   ? "hsl(var(--status-info))"
    : order.status === "failed" ? "hsl(var(--status-error))"
    : "hsl(var(--metal-shine))"

  const statusLabel = {
    created:          "Created",
    awaiting_payment: "Awaiting payment",
    paid:             "Paid",
    delivered:        "Delivered",
    failed:           "Failed",
    refunded:         "Refunded",
  }[order.status] ?? order.status

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "var(--metal-gradient)", borderColor: "hsl(var(--metal-border))" }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
            {order.block_name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--accent-mineral))" }}>
            ${order.amount_usd} · {order.rail ?? "—"} · {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
          style={{
            color:      statusColor,
            background: `${statusColor}1a`,
            border:     `1px solid ${statusColor}33`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Delivery state */}
      {order.status === "paid" || order.status === "delivered" ? (
        <div className="space-y-3">
          {isDelivered && latestDelivery && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--status-success))" }}>
              <Check size={12} />
              Delivered to @{latestDelivery.github_username} · {latestDelivery.repo}
            </div>
          )}

          {hasFailed && !showUsernamePrompt && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--status-error))" }}>
              <AlertCircle size={12} />
              {latestDelivery.error === "github_username_required"
                ? "GitHub username needed"
                : (latestDelivery.error ?? "Delivery failed")}
            </div>
          )}

          {showUsernamePrompt && (
            <GithubUsernamePrompt onSaved={() => {
              setShowUsernamePrompt(false)
              setResult(null)
              handleRedeliver()
            }} />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/docs/blocks/${order.block_id}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:opacity-80 transition-opacity"
              style={{ color: "hsl(var(--metal-foreground))" }}
            >
              <ExternalLink size={11} />
              Integration guide
            </Link>
            {latestDelivery?.repo && isDelivered && (
              <a
                href={`https://github.com/${latestDelivery.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: "hsl(var(--metal-foreground))" }}
              >
                <ExternalLink size={11} />
                Repository
              </a>
            )}
            {!showUsernamePrompt && (
              <button
                onClick={handleRedeliver}
                disabled={delivering}
                className="inline-flex items-center gap-1.5 text-[11px] hover:opacity-80 transition-opacity disabled:opacity-40"
                style={{ color: "hsl(var(--metal-shine))" }}
              >
                {delivering
                  ? <Loader2 size={11} className="animate-spin" />
                  : <RotateCcw size={11} />}
                {delivering ? "Re-delivering…" : "Re-deliver"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Dashboard root client component ─────────────────────────────────────────

export function DashboardClient({
  userId: _userId,
  githubLogin: _githubLogin,
  walletAddress: _walletAddress,
  ordersWithDeliveries,
}: Props) {
  const [items, setItems] = useState(ordersWithDeliveries)

  const handleRedeliver = async (orderId: string) => {
    const res = await fetch("/api/delivery/redeliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    const json = await res.json()
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.order.id === orderId
          ? { ...item, order: { ...item.order, status: json.delivered ? "delivered" : item.order.status } }
          : item
      )
    )
    return json
  }

  if (items.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl border border-dashed"
        style={{ borderColor: "hsl(var(--metal-border))" }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: "hsl(var(--metal-foreground))" }}>
          No activity yet
        </p>
        <p className="text-xs mb-6" style={{ color: "hsl(var(--accent-mineral))" }}>
          Sign in and copy any block for free.
        </p>
        <Link href="/blocks">
          <motion.span
            whileTap={{ y: 2 }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-foreground text-background cursor-pointer"
          >
            Browse blocks
            <ChevronRight size={13} />
          </motion.span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {items.map(({ order, deliveries }, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
          >
            <OrderCard
              order={order}
              deliveries={deliveries as DbDelivery[]}
              onRedeliver={handleRedeliver}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
