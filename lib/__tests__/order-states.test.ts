import { describe, it, expect } from "bun:test"

// Pure order state machine logic extracted from lib/orders.ts
// These tests verify the state transitions without touching Supabase

type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "paid"
  | "delivered"
  | "failed"
  | "refunded"

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created:          ["awaiting_payment", "failed"],
  awaiting_payment: ["paid", "failed"],
  paid:             ["delivered", "refunded"],
  delivered:        ["refunded"],
  failed:           [],
  refunded:         [],
}

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

describe("order state machine", () => {
  it("allows created → awaiting_payment", () => {
    expect(canTransition("created", "awaiting_payment")).toBe(true)
  })

  it("allows awaiting_payment → paid", () => {
    expect(canTransition("awaiting_payment", "paid")).toBe(true)
  })

  it("allows paid → delivered", () => {
    expect(canTransition("paid", "delivered")).toBe(true)
  })

  it("allows paid → refunded", () => {
    expect(canTransition("paid", "refunded")).toBe(true)
  })

  it("allows delivered → refunded", () => {
    expect(canTransition("delivered", "refunded")).toBe(true)
  })

  it("blocks created → paid (skipping awaiting_payment)", () => {
    expect(canTransition("created", "paid")).toBe(false)
  })

  it("blocks delivered → paid (going backwards)", () => {
    expect(canTransition("delivered", "paid")).toBe(false)
  })

  it("blocks refunded → delivered (terminal state)", () => {
    expect(canTransition("refunded", "delivered")).toBe(false)
  })

  it("blocks failed → paid (terminal state)", () => {
    expect(canTransition("failed", "paid")).toBe(false)
  })
})

describe("purchase status check", () => {
  const PAID_STATUSES: OrderStatus[] = ["paid", "delivered"]

  it("treats paid as purchased", () => {
    expect(PAID_STATUSES.includes("paid")).toBe(true)
  })

  it("treats delivered as purchased", () => {
    expect(PAID_STATUSES.includes("delivered")).toBe(true)
  })

  it("does not treat awaiting_payment as purchased", () => {
    expect(PAID_STATUSES.includes("awaiting_payment")).toBe(false)
  })

  it("does not treat refunded as purchased", () => {
    expect(PAID_STATUSES.includes("refunded")).toBe(false)
  })
})
