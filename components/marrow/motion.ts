// Canonical spring physics constants — AGENTS.md spec: stiffness 500, damping 15
export const SPRING = { type: "spring", stiffness: 500, damping: 15 } as const
export const SPRING_GENTLE = { type: "spring", stiffness: 300, damping: 25 } as const
export const SPRING_SLOW = { type: "spring", stiffness: 200, damping: 30 } as const

// 3px Y-axis displacement for tactile press simulation
export const TACTILE_PRESS = { y: 3, scale: 0.98 } as const
export const TACTILE_PRESS_WHILETAP = { y: 3, scale: 0.97 } as const
