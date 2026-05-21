"use client"

import { type ReactNode } from "react"
import { motion } from "framer-motion"
import { SPRING, TACTILE_PRESS_WHILETAP } from "./motion"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

interface TactileButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  className?: string
  children?: ReactNode
  "aria-label"?: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[hsl(var(--metal-foreground))] text-[hsl(var(--background))] border border-[hsl(var(--metal-foreground))] hover:opacity-90",
  secondary:
    "bg-transparent text-[hsl(var(--metal-foreground))] border border-[hsl(var(--metal-border))] hover:border-[hsl(var(--metal-shine))]",
  ghost:
    "bg-transparent text-[hsl(var(--metal-shine))] border border-transparent hover:border-[hsl(var(--metal-border))]",
  danger:
    "bg-transparent text-red-600 dark:text-red-400 border border-red-600/30 dark:border-red-400/30 hover:border-red-600/60 dark:hover:border-red-400/60",
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
}

export function TactileButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
}: TactileButtonProps) {
  return (
    <motion.button
      whileTap={disabled || loading ? undefined : TACTILE_PRESS_WHILETAP}
      transition={SPRING}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--metal-shine))]",
        "disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </motion.button>
  )
}
