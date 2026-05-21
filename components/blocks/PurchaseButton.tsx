"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, LogIn, Check, ExternalLink } from "lucide-react"

interface Props {
  blockSlug: string
  blockPrice: number
  hasPurchased?: boolean
  repoUrl?: string | null
}

export function PurchaseButton({ blockSlug, blockPrice, hasPurchased, repoUrl }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (hasPurchased) {
    return (
      <div className="space-y-2">
        <div
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border"
          style={{
            background: "rgba(63,185,80,0.08)",
            borderColor: "rgba(63,185,80,0.25)",
            color: "#3fb950",
          }}
        >
          <Check size={14} />
          Owned
        </div>
        {repoUrl && (
          <motion.a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              borderColor: "hsl(var(--metal-border))",
              color: "hsl(var(--metal-foreground))",
              background: "transparent",
            }}
          >
            <ExternalLink size={12} />
            View source on GitHub
          </motion.a>
        )}
      </div>
    )
  }

  const handleClick = () => {
    if (status === "loading") return
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout/${blockSlug}`)
      return
    }
    router.push(`/checkout/${blockSlug}`)
  }

  const isLoading = status === "loading"
  const isGuest   = !isLoading && !session

  return (
    <div className="space-y-2">
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        whileTap={{ y: 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all bg-foreground text-background hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isGuest ? (
          <>
            <LogIn size={14} />
            Sign in to Purchase
          </>
        ) : (
          `Purchase Block — $${blockPrice}`
        )}
      </motion.button>

      {isGuest && (
        <p className="text-center text-[11px]" style={{ color: "hsl(var(--metal-shine))" }}>
          GitHub OAuth or Solana wallet — takes 30 seconds.
        </p>
      )}
    </div>
  )
}
