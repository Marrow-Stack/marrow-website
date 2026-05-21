"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Loader2, AlertCircle, Check, RotateCcw, Copy, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface Block {
  id:    string
  slug:  string
  name:  string
  price: number
}

interface Props {
  block:         Block
  githubLogin:   string | null
  cryptoDefault: string
}

type Rail = "dodo" | "sol" | "usdc"

// ─── Countdown timer ──────────────────────────────────────────────────────────

function Countdown({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  )
  const called = useRef(false)

  useEffect(() => {
    if (secs === 0) {
      if (!called.current) { called.current = true; onExpired() }
      return
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secs, onExpired])

  const color = secs < 20 ? "#f85149" : secs < 45 ? "#d29922" : "hsl(var(--metal-shine))"
  return (
    <span style={{ color, fontVariantNumeric: "tabular-nums" }}>
      {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
    </span>
  )
}

// ─── Solana payment panel ─────────────────────────────────────────────────────

interface SolanaQuote {
  orderId:         string
  currency:        string
  amount:          string
  amountUsd:       number
  solPriceUsd?:    number
  treasuryAddress: string
  usdcMint?:       string
  quoteExpiresAt:  string
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--metal-shine))" }}>
        {label}
      </p>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: "hsl(var(--metal-border))", background: "var(--metal-gradient)" }}
      >
        <span className="flex-1 text-xs font-mono truncate" style={{ color: "hsl(var(--metal-foreground))" }}>
          {value}
        </span>
        <button
          onClick={copy}
          className="shrink-0 transition-opacity hover:opacity-70"
          style={{ color: copied ? "#3fb950" : "hsl(var(--metal-shine))" }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  )
}

function SolanaPaymentPanel({
  block,
  rail,
  onSuccess,
}: {
  block:     Block
  rail:      "sol" | "usdc"
  onSuccess: () => void
}) {
  const [quote, setQuote]       = useState<SolanaQuote | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [txSig, setTxSig]       = useState("")
  const [verifying, setVerifying] = useState(false)
  const [expired, setExpired]   = useState(false)

  const fetchQuote = async () => {
    setLoading(true)
    setError("")
    setExpired(false)
    setQuote(null)
    try {
      const res = await fetch("/api/checkout/solana/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: block.id, currency: rail }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Failed to get quote"); return }
      setQuote(json)
    } catch { setError("Network error. Please try again.") }
    finally   { setLoading(false) }
  }

  const verifyPayment = async () => {
    if (!quote || !txSig.trim()) return
    setVerifying(true)
    setError("")
    try {
      const res = await fetch("/api/checkout/solana/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: quote.orderId, txSignature: txSig.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Verification failed"); return }
      if (json.pending) { setError("Transaction not yet confirmed. Wait a few seconds and try again."); return }
      if (json.ok) onSuccess()
    } catch { setError("Network error. Please try again.") }
    finally   { setVerifying(false) }
  }

  useEffect(() => { fetchQuote() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-sm" style={{ color: "hsl(var(--metal-shine))" }}>
        <Loader2 size={15} className="animate-spin" />
        Getting live price…
      </div>
    )
  }

  if (!quote) return null

  const currencyLabel = rail.toUpperCase()

  return (
    <div className="space-y-4">
      {/* Quote summary */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ borderColor: "hsl(var(--metal-border))", background: "var(--metal-gradient)" }}
      >
        <div className="flex items-center justify-between text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
          <span>Quote expires in</span>
          <Countdown expiresAt={quote.quoteExpiresAt} onExpired={() => setExpired(true)} />
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-black" style={{ color: "hsl(var(--metal-foreground))" }}>
            {quote.amount} {currencyLabel}
          </span>
          <span className="text-xs" style={{ color: "hsl(var(--accent-mineral))" }}>
            = ${quote.amountUsd.toFixed(2)} USD
            {quote.solPriceUsd ? ` · 1 SOL = $${quote.solPriceUsd.toLocaleString()}` : ""}
          </span>
        </div>
      </div>

      {expired && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(210,153,34,0.1)", border: "1px solid rgba(210,153,34,0.25)", color: "#d29922" }}
        >
          <AlertCircle size={14} />
          Quote expired.{" "}
          <button onClick={fetchQuote} className="underline">Get new quote</button>
        </div>
      )}

      {!expired && (
        <>
          <CopyField label="Send to (treasury address)" value={quote.treasuryAddress} />
          <CopyField label={`Amount (exact ${currencyLabel})`} value={quote.amount} />
          {rail === "usdc" && quote.usdcMint && (
            <CopyField label="USDC Mint (verify before sending)" value={quote.usdcMint} />
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--metal-shine))" }}>
              Transaction signature (after sending)
            </p>
            <input
              type="text"
              value={txSig}
              onChange={(e) => setTxSig(e.target.value)}
              placeholder="Paste your Solana tx signature here"
              className="w-full h-9 px-3 rounded-lg text-xs font-mono outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                background:  "var(--metal-gradient)",
                border:      "1px solid hsl(var(--metal-border))",
                color:       "hsl(var(--metal-foreground))",
              }}
            />
          </div>

          <motion.button
            onClick={verifyPayment}
            disabled={verifying || !txSig.trim()}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full py-3 rounded-xl text-sm font-bold bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Verifying on-chain…
              </span>
            ) : (
              "I've paid — Verify payment"
            )}
          </motion.button>
        </>
      )}

      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.2)", color: "#f85149" }}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
          {error.includes("not yet confirmed") && (
            <button
              onClick={verifyPayment}
              className="ml-auto shrink-0 flex items-center gap-1 text-xs opacity-80 hover:opacity-100"
            >
              <RotateCcw size={11} /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main checkout client ─────────────────────────────────────────────────────

export function CheckoutClient({ block, githubLogin, cryptoDefault }: Props) {
  const [rail, setRail]         = useState<Rail | null>(null)
  const [dodoPending, setDodoPending] = useState(false)
  const [dodoError, setDodoError]     = useState("")
  const [success, setSuccess]         = useState(false)

  const handleDodo = async () => {
    setDodoPending(true)
    setDodoError("")
    try {
      const res = await fetch("/api/checkout/dodo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: block.id }),
      })
      const json = await res.json()
      if (!res.ok) { setDodoError(json.error ?? "Checkout failed"); setDodoPending(false); return }
      window.location.href = json.checkoutUrl
    } catch {
      setDodoError("Network error. Please try again.")
      setDodoPending(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "#3fb950" }} />
        <h2 className="text-2xl font-black text-reveal-light mb-2">Payment verified</h2>
        <p className="text-sm mb-6" style={{ color: "hsl(var(--accent-mineral))" }}>
          {githubLogin
            ? `Your block is being delivered to @${githubLogin}. Check your email and GitHub notifications.`
            : "Check your dashboard — we'll prompt for your GitHub username to complete delivery."}
        </p>
        <Link href="/dashboard">
          <motion.span
            whileTap={{ y: 2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-foreground text-background cursor-pointer"
          >
            Go to Dashboard
          </motion.span>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Checkout
        </p>
        <h1 className="text-2xl font-black text-reveal-light">{block.name}</h1>
        <p className="text-base font-bold mt-1" style={{ color: "hsl(var(--metal-foreground))" }}>
          ${block.price} <span className="text-sm font-normal" style={{ color: "hsl(var(--metal-shine))" }}>one-time</span>
        </p>
      </div>

      {/* Rail picker */}
      {!rail && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--metal-shine))" }}>
            Choose payment method
          </p>

          {/* Dodo Payments (fiat) */}
          <motion.button
            onClick={handleDodo}
            disabled={dodoPending}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              background:   "var(--metal-gradient)",
              borderColor:  "hsl(var(--metal-border))",
            }}
          >
            {dodoPending
              ? <Loader2 size={18} className="animate-spin shrink-0" style={{ color: "hsl(var(--metal-shine))" }} />
              : <CreditCard size={18} className="shrink-0" style={{ color: "hsl(var(--metal-shine))" }} />
            }
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>
                {dodoPending ? "Redirecting to checkout…" : "Card / Bank transfer"}
              </p>
              <p className="text-xs" style={{ color: "hsl(var(--accent-mineral))" }}>
                Via Dodo Payments — Merchant of Record. Tax handled for you.
              </p>
            </div>
          </motion.button>

          {dodoError && (
            <p className="text-xs" style={{ color: "#f85149" }}>{dodoError}</p>
          )}

          {/* Solana rail */}
          <motion.button
            onClick={() => setRail(cryptoDefault === "sol" ? "sol" : "usdc")}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              background:   "var(--metal-gradient)",
              borderColor:  "rgba(20,241,149,0.25)",
            }}
          >
            <span className="shrink-0 text-lg">◎</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>
                Pay with {cryptoDefault === "sol" ? "SOL" : "USDC"} (Solana mainnet)
              </p>
              <p className="text-xs" style={{ color: "hsl(var(--accent-mineral))" }}>
                {cryptoDefault === "sol"
                  ? "Live-priced in USD. 90-second quote lock."
                  : "USDC stable coin — no price volatility. 1 USDC = $1."}
              </p>
            </div>
          </motion.button>

          {/* Toggle between SOL and USDC */}
          <p className="text-center text-[11px]" style={{ color: "hsl(var(--metal-shine))" }}>
            Want to pay with{" "}
            <button
              onClick={() => setRail(cryptoDefault === "sol" ? "usdc" : "sol")}
              className="underline hover:opacity-70"
            >
              {cryptoDefault === "sol" ? "USDC instead?" : "SOL instead?"}
            </button>
          </p>
        </div>
      )}

      {/* Solana payment flow */}
      <AnimatePresence>
        {(rail === "sol" || rail === "usdc") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--metal-shine))" }}>
                Pay with {rail.toUpperCase()} — Solana mainnet
              </p>
              <button onClick={() => setRail(null)} className="text-xs hover:opacity-70" style={{ color: "hsl(var(--metal-shine))" }}>
                ← Change
              </button>
            </div>
            <SolanaPaymentPanel
              block={block}
              rail={rail}
              onSuccess={() => setSuccess(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
