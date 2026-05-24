"use client"

import React, { useState, useCallback, Suspense } from "react"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Wallet, Loader2, AlertCircle, ArrowLeft, Smartphone } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

// ─── Solana provider detection ────────────────────────────────────────────────
// Phantom v0.9+ injects at window.phantom.solana (and window.solana for compat)
// Solflare injects at window.solflare
// Only available in desktop browser extensions — not on mobile Safari/Chrome

type SolanaProvider = {
  publicKey: { toBase58(): string } | null
  connect(): Promise<{ publicKey: { toBase58(): string } }>
  signMessage(msg: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>
  isConnected?: boolean
}

type WindowWithSolana = typeof window & {
  phantom?: { solana?: SolanaProvider }
  solana?:  SolanaProvider
  solflare?: SolanaProvider
}

function getProvider(): SolanaProvider | null {
  const win = window as WindowWithSolana
  return win.phantom?.solana ?? win.solana ?? win.solflare ?? null
}

function isMobileBrowser(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

// ─── Solana sign-in flow ──────────────────────────────────────────────────────

async function solanaSignIn(
  setStatus: (s: string) => void,
  setError:  (e: string) => void
) {
  setStatus("connecting")
  setError("")

  try {
    if (isMobileBrowser()) {
      setError("Solana wallet extensions don't work in mobile browsers. Use a desktop browser with Phantom or Solflare installed, or use GitHub sign-in.")
      setStatus("")
      return
    }

    const provider = getProvider()
    if (!provider) {
      setError("No Solana wallet found. Install Phantom (phantom.app) or Solflare (solflare.com) and reload this page.")
      setStatus("")
      return
    }

    const { publicKey: pk } = await provider.connect()
    if (!pk) {
      setError("Wallet connected but no public key returned. Try reconnecting.")
      setStatus("")
      return
    }
    const wallet = pk.toBase58()

    setStatus("fetching nonce")
    const nonceRes = await fetch(`/api/auth/solana/nonce?wallet=${encodeURIComponent(wallet)}`)
    if (!nonceRes.ok) {
      const body = await nonceRes.json().catch(() => ({}))
      setError(body?.error?.message ?? "Failed to get nonce. Check your connection and try again.")
      setStatus("")
      return
    }
    const { nonce, domain } = await nonceRes.json()

    // SIWS message — format follows EIP-4361 / Solana convention
    const issuedAt = new Date().toISOString()
    const message = [
      `${domain} wants you to sign in with your Solana account:`,
      wallet,
      "",
      "Sign in to MarrowStack.",
      "",
      `URI: https://${domain}`,
      "Version: 1",
      "Chain ID: mainnet-beta",
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join("\n")

    setStatus("waiting for signature")
    const encoded = new TextEncoder().encode(message)

    let sigBytes: Uint8Array
    try {
      const result = await provider.signMessage(encoded, "utf8")
      sigBytes = result.signature
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("cancelled")) {
        setError("Signature cancelled. Click the button to try again.")
      } else {
        setError(`Wallet error: ${msg}`)
      }
      setStatus("")
      return
    }

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
      // CredentialsSignin means authorize() returned null
      setError("Signature verification failed. The nonce may have expired — please try again.")
      setStatus("")
    } else {
      const params = new URLSearchParams(window.location.search)
      window.location.href = params.get("callbackUrl") ?? "/dashboard"
    }
  } catch (e) {
    setError(e instanceof Error ? e.message : "Wallet sign-in failed. Please try again.")
    setStatus("")
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard"
  const [status, setStatus] = useState("")
  const [error, setError]   = useState("")

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
          Sign in to copy any block for free.
        </p>

        <div className="space-y-3">
          {/* GitHub OAuth */}
          <motion.button
            onClick={handleGitHub}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold bg-foreground text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
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
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
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
            style={{
              background: "hsl(var(--status-error) / 0.10)",
              border:     "1px solid hsl(var(--status-error) / 0.20)",
              color:      "hsl(var(--status-error))",
            }}
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="mt-8 space-y-2">
          <p className="text-center text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
            GitHub OAuth is the easiest — one click, no extra setup.
          </p>
          <p
            className="flex items-center justify-center gap-1.5 text-center text-[11px]"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            <Smartphone size={11} />
            Solana sign-in requires a desktop browser with Phantom or Solflare installed.
          </p>
        </div>
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
