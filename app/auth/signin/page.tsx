"use client"

import React, { useState, useCallback, Suspense } from "react"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Wallet, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

// ─── Solana wallet sign-in ────────────────────────────────────────────────────
// We use dynamic import to avoid SSR issues with @solana/wallet-adapter-*
// The store sign-in does NOT use the playground wallet adapter; it uses the
// window.solana (Phantom injected provider) directly — lightweight and no extra deps.

async function solanaSignIn(setStatus: (s: string) => void, setError: (e: string) => void) {
  setStatus("connecting")
  setError("")
  try {
    // Require Phantom or any injected Solana provider
    const provider = (window as typeof window & { solana?: { isPhantom?: boolean; publicKey?: { toBase58(): string }; connect(): Promise<{ publicKey: { toBase58(): string } }>; signMessage(msg: Uint8Array, enc: string): Promise<{ signature: Uint8Array }> } }).solana
    if (!provider) {
      setError("No Solana wallet detected. Install Phantom and reload.")
      setStatus("")
      return
    }

    const { publicKey: pk } = await provider.connect()
    const wallet = pk.toBase58()

    setStatus("fetching nonce")
    const nonceRes = await fetch(`/api/auth/solana/nonce?wallet=${encodeURIComponent(wallet)}`)
    if (!nonceRes.ok) {
      setError("Failed to get nonce. Try again.")
      setStatus("")
      return
    }
    const { nonce, domain } = await nonceRes.json()

    // Build SIWS message per EIP-4361 / Solana convention
    const issuedAt = new Date().toISOString()
    const message = `${domain} wants you to sign in with your Solana account:\n${wallet}\n\nSign in to MarrowStack.\n\nURI: https://${domain}\nVersion: 1\nChain ID: mainnet-beta\nNonce: ${nonce}\nIssued At: ${issuedAt}`

    setStatus("signing")
    const encoded = new TextEncoder().encode(message)
    const { signature: sigBytes } = await provider.signMessage(encoded, "utf8")

    // Base58-encode the signature
    const { default: bs58 } = await import("bs58")
    const signature = bs58.encode(sigBytes)

    setStatus("verifying")
    const result = await signIn("solana-wallet", {
      wallet,
      nonce,
      message,
      signature,
      redirect: false,
    })

    if (result?.error) {
      setError("Signature verification failed. Please try again.")
      setStatus("")
    } else {
      // Redirect to callbackUrl or dashboard
      const params = new URLSearchParams(window.location.search)
      window.location.href = params.get("callbackUrl") ?? "/dashboard"
    }
  } catch (e) {
    setError(e instanceof Error ? e.message : "Wallet sign-in failed")
    setStatus("")
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard"
  const [status, setStatus]  = useState("")
  const [error, setError]    = useState("")

  const handleGitHub = useCallback(() => {
    signIn("github", { callbackUrl })
  }, [callbackUrl])

  const handleSolana = useCallback(() => {
    solanaSignIn(setStatus, setError)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 font-display">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs mb-8 transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          <ArrowLeft size={12} />
          Back to MarrowStack
        </Link>

        <h1 className="text-2xl font-black text-reveal-light mb-1">Sign in</h1>
        <p className="text-sm mb-8" style={{ color: "hsl(var(--accent-mineral))" }}>
          Authenticate to purchase and receive your block via GitHub.
        </p>

        <div className="space-y-3">
          {/* GitHub OAuth */}
          <motion.button
            onClick={handleGitHub}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold bg-foreground text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {/* GitHub mark inline SVG to avoid lucide version dependency */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Continue with GitHub
          </motion.button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--metal-border))" }} />
            <span className="text-[11px]" style={{ color: "hsl(var(--metal-shine))" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--metal-border))" }} />
          </div>

          {/* Solana Wallet */}
          <motion.button
            onClick={handleSolana}
            disabled={!!status}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            style={{
              borderColor: "hsl(var(--metal-border))",
              color:       "hsl(var(--metal-foreground))",
              background:  "var(--metal-gradient)",
            }}
          >
            {status ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span className="capitalize">{status}…</span>
              </>
            ) : (
              <>
                <Wallet size={15} />
                Continue with Solana Wallet
              </>
            )}
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-start gap-2 p-3 rounded-xl text-sm"
            style={{ background: "hsl(var(--status-error) / 0.10)", border: "1px solid hsl(var(--status-error) / 0.20)", color: "hsl(var(--status-error))" }}
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </motion.div>
        )}

        <p className="mt-8 text-center text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
          GitHub OAuth delivers code directly to your account.{" "}
          <br />
          Wallet sign-in also works — we&apos;ll ask for your GitHub username after payment.
        </p>
      </motion.div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
