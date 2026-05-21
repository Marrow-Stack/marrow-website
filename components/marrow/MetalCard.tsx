"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import { SPRING_GENTLE } from "./motion"

interface MetalCardProps extends Omit<HTMLMotionProps<"div">, "whileHover"> {
  lift?: boolean
  glow?: boolean
}

export function MetalCard({
  lift = true,
  glow = false,
  className = "",
  children,
  ...props
}: MetalCardProps) {
  return (
    <motion.div
      whileHover={lift ? { y: -3, scale: 1.005 } : undefined}
      transition={SPRING_GENTLE}
      className={[
        "rounded-xl border border-[hsl(var(--metal-border))]",
        "bg-[var(--metal-gradient)]",
        "backdrop-blur-sm",
        glow
          ? "shadow-[0_0_24px_hsl(var(--metal-border)/0.4)]"
          : "shadow-[0_1px_3px_hsl(var(--metal-foreground)/0.06)]",
        "transition-shadow duration-200",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </motion.div>
  )
}
