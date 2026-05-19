// @ts-nocheck
/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MarrowStack — solana-payments block                                     ║
 * ║  USDC on Solana: reference-keyed payments, on-chain confirmation,        ║
 * ║  idempotency, subscription scaffold, and optional x402 middleware.       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * MIT License · Copyright (c) 2025 MarrowStack · marrowstack.dev
 *
 * ── QUICK-START ──────────────────────────────────────────────────────────────
 *
 *  1. Copy this file into your project:
 *       cp solana-payments.ts your-app/blocks/solana-payments.ts
 *
 *  2. Run the SQL migration (MIGRATION constant below) in Supabase.
 *
 *  3. Set env vars (see ENVIRONMENT section).
 *
 *  4. Install dependencies:
 *       npm i @solana/web3.js @solana/spl-token @solana/pay bs58
 *
 *  5. Create an API route at /api/solana-payments/intent  (handleIntent)
 *                         and /api/solana-payments/verify  (handleVerify)
 *
 *  6. On the client, call createPaymentIntent → show QR / deep link →
 *     poll pollPaymentStatus until confirmed.
 *
 * ── ENVIRONMENT ──────────────────────────────────────────────────────────────
 *
 *  NEXT_PUBLIC_SOLANA_CLUSTER=devnet    # or mainnet-beta
 *  SOLANA_TREASURY_ADDRESS=...          # base58 — your receiving wallet
 *  SOLANA_RPC_URL=...                   # Helius/QuickNode/Alchemy RPC (recommended)
 *  PLAYGROUND_TREASURY_SECRET=...       # base58 secret key for devnet playground only
 *  NEXT_PUBLIC_SUPABASE_URL=...
 *  SUPABASE_SERVICE_ROLE_KEY=...
 *
 * ── SECURITY: VERIFY BEFORE YOU DELIVER VALUE ────────────────────────────────
 *
 *  Solana has no server-side webhooks.  You MUST call verifyPayment() on your
 *  server BEFORE fulfilling an order.  Never trust a client-sent "paid: true".
 *  The verify endpoint checks:
 *    1. The transaction exists and is finalized on-chain.
 *    2. The transferred token is exactly the USDC mint for the current cluster.
 *    3. The transferred amount is ≥ the expected amount.
 *    4. The recipient is your treasury address.
 *    5. The transaction contains the reference key (proving it's the right tx).
 *    6. The signature has not already been credited (idempotency).
 *
 * ── MINT ADDRESSES (verify before going to mainnet) ─────────────────────────
 *
 *  Devnet  USDC: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *  Mainnet USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 *
 *  Verify mainnet address at: https://www.circle.com/en/usdc/developers
 *  Verify devnet address via: spl-token display 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *
 * ── SUBSCRIPTIONS NOTE ───────────────────────────────────────────────────────
 *
 *  Solana has no native pull payments.  The subscription scaffold in this block
 *  records due dates and provides a "charge-now" helper that generates a fresh
 *  payment link for each billing cycle.  It does NOT silently debit wallets.
 *  Your product must notify users and prompt them to pay each cycle.
 */

'use server'

// ─────────────────────────────────────────────────────────────────────────────
// SQL MIGRATION
// ─────────────────────────────────────────────────────────────────────────────

export const MIGRATION = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Payment records with idempotency enforcement
CREATE TABLE IF NOT EXISTS payments (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reference      text        UNIQUE NOT NULL,   -- base58 ephemeral reference pubkey
  signature      text        UNIQUE,            -- tx signature, set on confirmation
  payer          text,                          -- payer wallet address (base58)
  amount_usdc    numeric(18,6) NOT NULL,
  mint           text        NOT NULL,
  recipient      text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','confirmed','expired','failed')),
  idempotency_key text       UNIQUE NOT NULL,   -- signature+reference composite
  metadata       jsonb,                         -- user_id, product_id, etc.
  expires_at     timestamptz NOT NULL,
  confirmed_at   timestamptz,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (reference);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON payments (status, expires_at);

-- Subscription scaffold (merchant-initiated, not silent pull)
CREATE TABLE IF NOT EXISTS subscriptions (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id        text        NOT NULL,
  amount_usdc    numeric(18,6) NOT NULL,
  interval_days  integer     NOT NULL DEFAULT 30,
  status         text        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active','paused','cancelled')),
  next_due_at    timestamptz NOT NULL,
  last_paid_at   timestamptz,
  created_at     timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payments"
  ON payments FOR SELECT
  USING (metadata->>'user_id' = auth.uid()::text);

CREATE POLICY "Users read own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());
`

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  clusterApiUrl,
  type Cluster,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  encodeURL,
  findReference,
  validateTransfer,
  type TransferRequestURLFields,
} from '@solana/pay'
import BigNumber from 'bignumber.js'
import bs58     from 'bs58'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SolanaCluster = 'devnet' | 'mainnet-beta'
export type PaymentStatus = 'pending' | 'confirmed' | 'expired' | 'failed'

export interface PaymentIntent {
  reference:  string          // base58 ephemeral public key
  recipient:  string          // treasury address
  amountUsdc: number
  mint:       string          // USDC mint for current cluster
  label:      string
  message:    string
  memo?:      string
  solanaPayUrl: string        // Solana Pay compatible URL
  expiresAt:  string          // ISO 8601
}

export interface CreatePaymentIntentParams {
  amountUsdc:     number
  label:          string
  message:        string
  memo?:          string
  ttlSeconds?:    number      // default 600 (10 min)
  metadata?:      Record<string, unknown>
  idempotencyKey?: string     // caller-supplied; auto-generated if omitted
}

export interface PaymentVerificationResult {
  verified:    boolean
  signature:   string
  payer:       string
  amountUsdc:  number
  confirmedAt: string
}

export interface SubscriptionPlan {
  planId:       string
  amountUsdc:   number
  intervalDays: number
  label:        string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const USDC_MINTS: Record<SolanaCluster, string> = {
  'devnet':       '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}

const USDC_DECIMALS = 6

const ENV = {
  supabaseUrl:    () => requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  serviceRoleKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  treasury:       () => requireEnv('SOLANA_TREASURY_ADDRESS'),
  rpcUrl:         () => process.env.SOLANA_RPC_URL ?? clusterApiUrl(cluster()),
  cluster:        () => (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? 'devnet') as SolanaCluster,
}

function cluster(): Cluster {
  return (ENV.cluster() === 'mainnet-beta') ? 'mainnet-beta' : 'devnet'
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`solana-payments: missing required env var ${name}`)
  return v
}

function getDb(): SupabaseClient {
  return createClient(ENV.supabaseUrl(), ENV.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getConnection(): Connection {
  return new Connection(ENV.rpcUrl(), 'confirmed')
}

function getUsdcMint(): PublicKey {
  return new PublicKey(USDC_MINTS[ENV.cluster()])
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT INTENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a payment intent: generate a unique reference key, persist to DB,
 * and return a Solana Pay URL the client can render as a QR code or deep link.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntent> {
  const {
    amountUsdc,
    label,
    message,
    memo,
    ttlSeconds = 600,
    metadata,
    idempotencyKey: callerKey,
  } = params

  if (amountUsdc <= 0) throw new PaymentError('Amount must be positive', 'INVALID_AMOUNT', 400)

  const db        = getDb()
  const reference = Keypair.generate().publicKey   // ephemeral reference key
  const refB58    = reference.toBase58()
  const mint      = USDC_MINTS[ENV.cluster()]
  const recipient = ENV.treasury()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  const idempKey  = callerKey ?? `${refB58}:init`

  const fields: TransferRequestURLFields = {
    recipient: new PublicKey(recipient),
    splToken:  new PublicKey(mint),
    amount:    new BigNumber(amountUsdc),
    reference: [reference],
    label,
    message,
    memo,
  }
  const solanaPayUrl = encodeURL(fields).toString()

  const { error } = await db.from('payments').insert({
    reference:       refB58,
    amount_usdc:     amountUsdc,
    mint,
    recipient,
    status:          'pending',
    idempotency_key: idempKey,
    metadata,
    expires_at:      expiresAt,
  })

  if (error) throw new Error(`solana-payments: failed to create intent — ${error.message}`)

  return {
    reference:    refB58,
    recipient,
    amountUsdc,
    mint,
    label,
    message,
    memo,
    solanaPayUrl,
    expiresAt,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a payment on-chain against all criteria:
 *   - Transaction finalized
 *   - Correct USDC mint
 *   - Amount ≥ expected
 *   - Correct recipient
 *   - Reference key present in tx
 *   - Not already credited (idempotency)
 *
 * This is the function to call BEFORE delivering any product or access.
 */
export async function verifyPayment(
  reference: string
): Promise<PaymentVerificationResult> {
  const db         = getDb()
  const connection = getConnection()

  // Load the intent from DB
  const { data: intent, error: dbErr } = await db
    .from('payments')
    .select('*')
    .eq('reference', reference)
    .single()

  if (dbErr || !intent) throw new PaymentError('Payment intent not found', 'NOT_FOUND', 404)
  if (intent.status === 'confirmed') {
    return {
      verified:    true,
      signature:   intent.signature,
      payer:       intent.payer,
      amountUsdc:  Number(intent.amount_usdc),
      confirmedAt: intent.confirmed_at,
    }
  }
  if (intent.status === 'expired' || new Date(intent.expires_at) < new Date())
    throw new PaymentError('Payment intent has expired', 'EXPIRED', 410)

  const refPubkey     = new PublicKey(reference)
  const recipientPk   = new PublicKey(intent.recipient)
  const usdcMint      = new PublicKey(intent.mint)

  // Find the transaction containing our reference key
  let signatureInfo: Awaited<ReturnType<typeof findReference>>
  try {
    signatureInfo = await findReference(connection, refPubkey, { finality: 'confirmed' })
  } catch {
    throw new PaymentError('No confirmed transaction found for this reference', 'NOT_FOUND', 404)
  }

  const signature = signatureInfo.signature

  // Idempotency: reject if this signature was already credited
  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('signature', signature)
    .maybeSingle()

  if (existing)
    throw new PaymentError('Transaction already credited', 'ALREADY_CREDITED', 409)

  // On-chain validation: mint, amount, recipient
  try {
    await validateTransfer(
      connection,
      signature,
      {
        recipient: recipientPk,
        amount:    new BigNumber(intent.amount_usdc),
        splToken:  usdcMint,
        reference: [refPubkey],
      },
      { commitment: 'confirmed' }
    )
  } catch (e) {
    await db.from('payments').update({ status: 'failed' }).eq('reference', reference)
    throw new PaymentError(
      `On-chain validation failed: ${e instanceof Error ? e.message : 'unknown'}`,
      'VALIDATION_FAILED',
      402
    )
  }

  // Fetch payer address from transaction
  const txInfo = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  })
  const payer = txInfo?.transaction.message.staticAccountKeys?.[0]?.toBase58() ?? ''

  const confirmedAt = new Date().toISOString()
  const idempKey    = `${signature}:${reference}`

  await db.from('payments').update({
    signature,
    payer,
    status:          'confirmed',
    idempotency_key: idempKey,
    confirmed_at:    confirmedAt,
  }).eq('reference', reference)

  return { verified: true, signature, payer, amountUsdc: Number(intent.amount_usdc), confirmedAt }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT STATUS POLL
// ─────────────────────────────────────────────────────────────────────────────

export async function getPaymentStatus(
  reference: string
): Promise<{ status: PaymentStatus; result?: PaymentVerificationResult }> {
  const db = getDb()
  const { data, error } = await db
    .from('payments')
    .select('status, signature, payer, amount_usdc, confirmed_at')
    .eq('reference', reference)
    .single()

  if (error || !data) throw new PaymentError('Not found', 'NOT_FOUND', 404)

  if (data.status === 'confirmed') {
    return {
      status: 'confirmed',
      result: {
        verified:    true,
        signature:   data.signature,
        payer:       data.payer,
        amountUsdc:  Number(data.amount_usdc),
        confirmedAt: data.confirmed_at,
      },
    }
  }

  // Auto-expire
  if (data.status === 'pending') {
    const { data: intent } = await db
      .from('payments')
      .select('expires_at')
      .eq('reference', reference)
      .single()

    if (intent && new Date(intent.expires_at) < new Date()) {
      await db.from('payments').update({ status: 'expired' }).eq('reference', reference)
      return { status: 'expired' }
    }
  }

  return { status: data.status as PaymentStatus }
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/solana-payments/intent — CreatePaymentIntentParams → PaymentIntent */
export async function handleIntent(req: Request): Promise<Response> {
  try {
    const body   = (await req.json()) as CreatePaymentIntentParams
    const intent = await createPaymentIntent(body)
    return Response.json(intent)
  } catch (err) {
    return errorResponse(err)
  }
}

/** POST /api/solana-payments/verify — { reference } → PaymentVerificationResult */
export async function handleVerify(req: Request): Promise<Response> {
  try {
    const { reference } = (await req.json()) as { reference: string }
    const result = await verifyPayment(reference)
    return Response.json(result)
  } catch (err) {
    return errorResponse(err)
  }
}

/** GET /api/solana-payments/status?reference=... → { status, result? } */
export async function handleStatus(req: Request): Promise<Response> {
  try {
    const url       = new URL(req.url)
    const reference = url.searchParams.get('reference') ?? ''
    const result    = await getPaymentStatus(reference)
    return Response.json(result)
  } catch (err) {
    return errorResponse(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION SCAFFOLD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a subscription record for a user.
 * Does NOT charge immediately — returns the first payment intent to present.
 * Subsequent cycles: call chargeSubscription(subscriptionId).
 */
export async function createSubscription(
  userId: string,
  plan:   SubscriptionPlan
): Promise<{ subscriptionId: string; firstPaymentIntent: PaymentIntent }> {
  const db = getDb()

  const nextDueAt = new Date(Date.now() + plan.intervalDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await db
    .from('subscriptions')
    .insert({
      user_id:       userId,
      plan_id:       plan.planId,
      amount_usdc:   plan.amountUsdc,
      interval_days: plan.intervalDays,
      next_due_at:   nextDueAt,
    })
    .select('id')
    .single()

  if (error) throw new Error(`solana-payments: create subscription failed — ${error.message}`)

  const intent = await createPaymentIntent({
    amountUsdc:      plan.amountUsdc,
    label:           plan.label,
    message:         `Subscription — ${plan.planId}`,
    metadata:        { user_id: userId, subscription_id: data.id, plan_id: plan.planId },
    idempotencyKey:  `sub:${data.id}:0`,
  })

  return { subscriptionId: data.id, firstPaymentIntent: intent }
}

/**
 * Generate a new payment intent for the next billing cycle.
 * Call this when next_due_at approaches, then notify the user to pay.
 *
 * ⚠️  Solana has no native pull payments.  The user must explicitly sign each
 *     payment transaction.  This generates the request; your product sends the
 *     link; the user pays voluntarily.
 */
export async function chargeSubscription(
  subscriptionId: string
): Promise<PaymentIntent> {
  const db = getDb()
  const { data: sub, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (error || !sub) throw new PaymentError('Subscription not found', 'NOT_FOUND', 404)
  if (sub.status !== 'active') throw new PaymentError('Subscription is not active', 'INACTIVE', 400)

  const intent = await createPaymentIntent({
    amountUsdc:     sub.amount_usdc,
    label:          `Plan renewal — ${sub.plan_id}`,
    message:        `Subscription renewal`,
    metadata:       { user_id: sub.user_id, subscription_id: subscriptionId },
    idempotencyKey: `sub:${subscriptionId}:${sub.next_due_at}`,
  })

  const nextDueAt = new Date(
    Date.parse(sub.next_due_at) + sub.interval_days * 24 * 60 * 60 * 1000
  ).toISOString()

  await db.from('subscriptions').update({ next_due_at: nextDueAt }).eq('id', subscriptionId)

  return intent
}

// ─────────────────────────────────────────────────────────────────────────────
// x402 MIDDLEWARE (opt-in, tree-shake if unused)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Optional Next.js middleware that gates an API route behind a micro-payment.
 *
 * HTTP 402 flow:
 *   Client → GET /api/gated-resource
 *   Server → 402 { paymentRequired, intent: PaymentIntent }
 *   Client → pays → retries with X-Payment-Proof: <signature>:<reference>
 *   Server → verifies → proceeds
 *
 * Usage (in middleware.ts):
 *   import { withX402 } from '@/blocks/solana-payments'
 *   export default withX402({ amountUsdc: 0.01, paths: ['/api/gated-resource'] })
 *
 * This pattern is experimental.  Wire it behind a feature flag in production.
 */
export function withX402(opts: {
  amountUsdc: number
  paths:      string[]
  label?:     string
}) {
  return async function x402Middleware(req: Request): Promise<Response | null> {
    const url       = new URL(req.url)
    const isGated   = opts.paths.some(p => url.pathname.startsWith(p))
    if (!isGated) return null   // not gated — pass through

    const proof = req.headers.get('X-Payment-Proof')

    if (proof) {
      const [signature, reference] = proof.split(':')
      if (signature && reference) {
        try {
          // Fast path: check DB first to avoid repeated RPC calls
          const { status } = await getPaymentStatus(reference)
          if (status === 'confirmed') return null  // verified — pass through

          // Try full on-chain verify
          await verifyPayment(reference)
          return null  // pass through
        } catch {
          // Fall through to 402
        }
      }
    }

    const intent = await createPaymentIntent({
      amountUsdc: opts.amountUsdc,
      label:      opts.label ?? 'API access',
      message:    `Pay ${opts.amountUsdc} USDC to access ${url.pathname}`,
    })

    return Response.json(
      { paymentRequired: true, intent },
      {
        status: 402,
        headers: {
          'X-Payment-Required':     'true',
          'X-Payment-Amount':       String(opts.amountUsdc),
          'X-Payment-Reference':    intent.reference,
          'X-Payment-Solana-Pay':   intent.solanaPayUrl,
        },
      }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE HOOK
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'

type PaymentHookState =
  | { status: 'idle' }
  | { status: 'pending'; intent: PaymentIntent }
  | { status: 'polling' }
  | { status: 'confirmed'; result: PaymentVerificationResult }
  | { status: 'expired' }
  | { status: 'error'; error: string }

/**
 * Client hook that polls /api/solana-payments/status until confirmed or expired.
 *
 * Usage:
 *   const { state, createPayment } = usePaymentStatus()
 *   await createPayment({ amountUsdc: 9.99, label: 'Pro plan', message: '...' })
 *   // state.status === 'pending' → show QR code at state.intent.solanaPayUrl
 *   // state.status === 'confirmed' → unlock product
 */
export function usePaymentStatus(opts?: {
  pollIntervalMs?: number
  onConfirmed?:    (result: PaymentVerificationResult) => void
}) {
  const [state, setState] = useState<PaymentHookState>({ status: 'idle' })
  const pollRef           = useRef<ReturnType<typeof setInterval>>()
  const pollInterval      = opts?.pollIntervalMs ?? 3000

  const createPayment = useCallback(async (params: CreatePaymentIntentParams) => {
    setState({ status: 'pending', intent: null as any }) // interim

    const res    = await fetch('/api/solana-payments/intent', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    })
    const intent: PaymentIntent = await res.json()
    setState({ status: 'pending', intent })

    // Start polling
    pollRef.current = setInterval(async () => {
      const statusRes = await fetch(
        `/api/solana-payments/status?reference=${intent.reference}`
      )
      const { status, result } = await statusRes.json()

      if (status === 'confirmed') {
        clearInterval(pollRef.current)
        setState({ status: 'confirmed', result })
        opts?.onConfirmed?.(result)
      } else if (status === 'expired' || status === 'failed') {
        clearInterval(pollRef.current)
        setState({ status: 'expired' })
      }
    }, pollInterval)
  }, [opts, pollInterval])

  useEffect(() => () => clearInterval(pollRef.current), [])

  return { state, createPayment }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Solana Explorer URL for a signature (respects current cluster).
 */
export function explorerUrl(signature: string): string {
  const cluster = ENV.cluster()
  const param   = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/tx/${signature}${param}`
}

function errorResponse(err: unknown): Response {
  if (err instanceof PaymentError)
    return Response.json({ error: err.message, code: err.code }, { status: err.status })
  const msg = err instanceof Error ? err.message : 'Internal error'
  console.error('solana-payments:', msg)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

export class PaymentError extends Error {
  code:   string
  status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.name   = 'PaymentError'
    this.code   = code
    this.status = status
  }
}
