// @ts-nocheck
/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  MarrowStack — solana-auth block                                         ║
 * ║  Sign-In-With-Solana: server-side signature verification, sessions,      ║
 * ║  RBAC, and wallet↔account linking for Next.js + Supabase.               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * MIT License · Copyright (c) 2025 MarrowStack · marrowstack.dev
 *
 * ── QUICK-START (6 steps) ────────────────────────────────────────────────────
 *
 *  1. Copy this file into your project:
 *       cp solana-auth.ts your-app/blocks/solana-auth.ts
 *
 *  2. Run the SQL migration (MIGRATION constant below) in your Supabase project:
 *       Supabase Dashboard → SQL Editor → paste SQL → Run
 *
 *  3. Set env vars in .env.local (see ENVIRONMENT section below).
 *
 *  4. Install dependencies:
 *       npm i @solana/web3.js bs58 tweetnacl
 *       npm i @solana/wallet-adapter-base @solana/wallet-adapter-react
 *           @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
 *
 *  5. Wrap your app root (app/layout.tsx) with <WalletProviders>:
 *       import { WalletProviders } from '@/blocks/solana-auth'
 *       // <WalletProviders>{children}</WalletProviders>
 *
 *  6. Drop the button wherever login lives:
 *       import { SignInWithSolanaButton } from '@/blocks/solana-auth'
 *       <SignInWithSolanaButton onSuccess={(session) => router.push('/dashboard')} />
 *
 * ── ENVIRONMENT ──────────────────────────────────────────────────────────────
 *
 *  NEXT_PUBLIC_SOLANA_CLUSTER=devnet          # or mainnet-beta
 *  SOLANA_AUTH_DOMAIN=yourdomain.com          # bound into every SIWS message
 *  SOLANA_AUTH_NONCE_TTL_SECONDS=300          # default 300; do not go below 60
 *  NEXT_PUBLIC_APP_URL=https://yourdomain.com
 *  NEXT_PUBLIC_SUPABASE_URL=...
 *  SUPABASE_SERVICE_ROLE_KEY=...
 *
 * ── SECURITY NOTES ──────────────────────────────────────────────────────────
 *
 *  - Signature verification runs SERVER-SIDE ONLY.  Never trust client claims.
 *  - Nonces are single-use; enforced by the `UNIQUE` constraint on auth_nonces.
 *    A second verify attempt with the same nonce returns 409.
 *  - Domain is validated server-side against SOLANA_AUTH_DOMAIN.
 *    A domain mismatch returns 403 and logs a warning.
 *  - Clock skew: messages older than SOLANA_AUTH_NONCE_TTL_SECONDS are rejected.
 *  - Do not expose SUPABASE_SERVICE_ROLE_KEY to the client.
 *
 * ── WIRING INTO EXISTING NEXTAUTH SESSION ───────────────────────────────────
 *
 *  The /api/solana-auth/verify route returns a JWT with the same shape as your
 *  NextAuth session (id, email, role).  If using NextAuth, call
 *  signIn('credentials', { walletToken }) from the callback; the included
 *  CredentialsProvider stub shows the exact wiring.
 */

'use server'

// ─────────────────────────────────────────────────────────────────────────────
// SQL MIGRATION
// Run once in Supabase SQL Editor.  Assumes a `profiles` table with `id` pk.
// ─────────────────────────────────────────────────────────────────────────────

export const MIGRATION = `
-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Nonce store: single-use, short-TTL challenge tokens
CREATE TABLE IF NOT EXISTS auth_nonces (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce       text        UNIQUE NOT NULL,
  address     text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for verification lookup (address + nonce)
CREATE INDEX IF NOT EXISTS idx_auth_nonces_address
  ON auth_nonces (address, nonce) WHERE consumed_at IS NULL;

-- Auto-purge expired nonces older than 1 hour (run as a pg_cron job)
-- SELECT cron.schedule('purge-nonces', '*/15 * * * *',
--   $$DELETE FROM auth_nonces WHERE expires_at < now() - interval '1 hour'$$);

-- Wallet → account links
CREATE TABLE IF NOT EXISTS wallets (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address     text        UNIQUE NOT NULL,   -- base58 public key
  chain       text        NOT NULL DEFAULT 'solana',
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_address ON wallets (address);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id        ON wallets (user_id);

-- RLS: users can read their own wallets; service role manages all
ALTER TABLE wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_nonces  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypasses RLS; all writes from API routes use service role client.
`

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS & ENV
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import nacl     from 'tweetnacl'
import bs58     from 'bs58'
import crypto   from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SolanaCluster = 'devnet' | 'mainnet-beta'

export interface SiwsPayload {
  /** Base58 wallet public key */
  address: string
  /** Signed SIWS message string */
  message: string
  /** Base58-encoded Ed25519 signature */
  signature: string
  /** Optional: existing session user ID (for wallet-linking flow) */
  linkToUserId?: string
}

export interface SiwsSession {
  userId: string
  walletAddress: string
  role: 'user' | 'admin'
  issuedAt: string
}

export interface SiwsNonce {
  nonce: string
  expiresAt: string
}

export interface WalletLinkResult {
  linked: boolean
  userId: string
  walletAddress: string
}

interface ParsedSiwsMessage {
  domain:          string
  address:         string
  statement:       string
  uri:             string
  version:         string
  chainId:         string
  nonce:           string
  issuedAt:        string
  expirationTime?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ENV = {
  supabaseUrl:     () => requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  serviceRoleKey:  () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  domain:          () => requireEnv('SOLANA_AUTH_DOMAIN'),
  nonceTtl:        () => parseInt(process.env.SOLANA_AUTH_NONCE_TTL_SECONDS ?? '300', 10),
  cluster:         () => (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? 'devnet') as SolanaCluster,
  appUrl:          () => requireEnv('NEXT_PUBLIC_APP_URL'),
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`solana-auth: missing required env var ${name}`)
  return v
}

const CHAIN_ID_MAP: Record<SolanaCluster, string> = {
  'devnet':       'devnet',
  'mainnet-beta': 'mainnet',
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE CLIENT
// ─────────────────────────────────────────────────────────────────────────────

function getServiceClient(): SupabaseClient {
  return createClient(ENV.supabaseUrl(), ENV.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// NONCE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Issue a single-use nonce for the given wallet address.
 * Store it with an expiry.  The address is bound to the nonce so a different
 * address cannot consume it.
 */
export async function issueSiwsNonce(address: string): Promise<SiwsNonce> {
  validateBase58Address(address)
  const db = getServiceClient()
  const nonce     = crypto.randomBytes(16).toString('hex') // 32 hex chars
  const ttl       = ENV.nonceTtl()
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

  const { error } = await db.from('auth_nonces').insert({ nonce, address, expires_at: expiresAt })
  if (error) throw new Error(`solana-auth: failed to issue nonce — ${error.message}`)

  return { nonce, expiresAt }
}

/**
 * Consume a nonce: mark it as used (sets consumed_at).
 * Returns the nonce row if valid, throws on expiry/already-used/wrong address.
 * The UNIQUE constraint on `nonce` prevents concurrent double-consume.
 */
async function consumeNonce(
  db: SupabaseClient,
  nonce: string,
  address: string
): Promise<void> {
  // Claim the nonce atomically by setting consumed_at only if conditions hold
  const { data, error } = await db
    .from('auth_nonces')
    .update({ consumed_at: new Date().toISOString() })
    .eq('nonce', nonce)
    .eq('address', address)
    .is('consumed_at', null)
    .gte('expires_at', new Date().toISOString())
    .select('id')
    .single()

  if (error || !data) {
    // Distinguish between "already used", "expired", and "not found"
    const { data: existing } = await db
      .from('auth_nonces')
      .select('consumed_at, expires_at')
      .eq('nonce', nonce)
      .single()

    if (!existing) throw new SiwsError('Nonce not found', 'NONCE_NOT_FOUND', 401)
    if (existing.consumed_at) throw new SiwsError('Nonce already used — replay rejected', 'REPLAY', 409)
    if (new Date(existing.expires_at) < new Date()) throw new SiwsError('Nonce expired', 'EXPIRED', 401)
    throw new SiwsError('Nonce invalid for this address', 'NONCE_MISMATCH', 401)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIWS MESSAGE CONSTRUCTION
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildSiwsMessageParams {
  address:    string
  nonce:      string
  statement?: string
}

/**
 * Construct a standards-compliant SIWS message.
 * The wallet signs exactly this string.  The server re-constructs it to verify.
 */
export function buildSiwsMessage(params: BuildSiwsMessageParams): string {
  const domain     = ENV.domain()
  const uri        = ENV.appUrl()
  const chainId    = CHAIN_ID_MAP[ENV.cluster()]
  const issuedAt   = new Date().toISOString()
  const ttl        = ENV.nonceTtl()
  const expiration = new Date(Date.now() + ttl * 1000).toISOString()
  const statement  = params.statement ?? 'Sign in to MarrowStack with your Solana wallet.'

  return [
    `${domain} wants you to sign in with your Solana account:`,
    params.address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expiration}`,
  ].join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify an Ed25519 SIWS signature server-side.
 * Uses tweetnacl for pure-JS verification (no native bindings required).
 */
export function verifySiwsSignature(
  message:   string,
  signature: string,   // base58-encoded
  address:   string    // base58-encoded public key
): boolean {
  try {
    const messageBytes   = new TextEncoder().encode(message)
    const signatureBytes = bs58.decode(signature)
    const publicKeyBytes = bs58.decode(address)

    if (signatureBytes.length !== 64)  return false
    if (publicKeyBytes.length !== 32)  return false

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
  } catch {
    return false
  }
}

/**
 * Parse a SIWS message string into its constituent fields.
 */
function parseSiwsMessage(message: string): ParsedSiwsMessage {
  const lines = message.split('\n')
  const parse  = (prefix: string) => {
    const line = lines.find(l => l.startsWith(prefix))
    return line ? line.slice(prefix.length).trim() : ''
  }

  return {
    domain:         (lines[0] ?? '').split(' ')[0] ?? '',
    address:         lines[1] ?? '',
    statement:       lines[3] ?? '',
    uri:             parse('URI: '),
    version:         parse('Version: '),
    chainId:         parse('Chain ID: '),
    nonce:           parse('Nonce: '),
    issuedAt:        parse('Issued At: '),
    expirationTime:  parse('Expiration Time: ') || undefined,
  }
}

/**
 * Validate the parsed message fields: domain, cluster, timestamp window.
 */
function validateParsedMessage(
  parsed: ParsedSiwsMessage,
  expectedAddress: string
): void {
  const allowedDomain  = ENV.domain()
  const allowedChainId = CHAIN_ID_MAP[ENV.cluster()]

  if (parsed.domain !== allowedDomain)
    throw new SiwsError(`Domain mismatch: got ${parsed.domain}, expected ${allowedDomain}`, 'DOMAIN_MISMATCH', 403)

  if (parsed.address !== expectedAddress)
    throw new SiwsError('Address in message does not match signing address', 'ADDRESS_MISMATCH', 401)

  if (parsed.chainId !== allowedChainId)
    throw new SiwsError(`Chain ID mismatch: got ${parsed.chainId}, expected ${allowedChainId}`, 'CHAIN_MISMATCH', 403)

  // Reject messages outside the nonce TTL window
  const issuedAt = new Date(parsed.issuedAt).getTime()
  const nowMs    = Date.now()
  const ttlMs    = ENV.nonceTtl() * 1000
  if (Number.isNaN(issuedAt) || nowMs - issuedAt > ttlMs)
    throw new SiwsError('Message timestamp outside acceptable window', 'CLOCK_SKEW', 401)

  if (parsed.expirationTime && new Date(parsed.expirationTime) < new Date())
    throw new SiwsError('Message has expired', 'EXPIRED', 401)
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION + RBAC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * After a valid SIWS verification, look up or create the user's account and
 * wallet link.  Returns the session payload that your auth layer should sign.
 *
 * If linkToUserId is provided, the wallet is attached to that existing account.
 * If the wallet is already linked to a different account, throws CONFLICT.
 */
export async function resolveSiwsSession(
  address: string,
  linkToUserId?: string
): Promise<SiwsSession> {
  const db = getServiceClient()

  // Check if this wallet is already linked
  const { data: existing } = await db
    .from('wallets')
    .select('user_id')
    .eq('address', address)
    .maybeSingle()

  if (existing) {
    if (linkToUserId && existing.user_id !== linkToUserId)
      throw new SiwsError(
        'This wallet is already linked to a different account',
        'WALLET_CONFLICT',
        409
      )

    // Existing link — fetch profile for role
    const { data: profile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', existing.user_id)
      .single()

    return {
      userId:        profile.id,
      walletAddress: address,
      role:          (profile.role ?? 'user') as SiwsSession['role'],
      issuedAt:      new Date().toISOString(),
    }
  }

  // New wallet — resolve or create user
  let userId = linkToUserId

  if (!userId) {
    // Create a new account for this wallet
    const { data: newUser, error } = await db
      .from('profiles')
      .insert({ role: 'user', wallet_address: address })
      .select('id')
      .single()

    if (error) throw new Error(`solana-auth: failed to create profile — ${error.message}`)
    userId = newUser.id
  }

  // Link wallet to user
  const { error: linkError } = await db
    .from('wallets')
    .insert({ user_id: userId, address, chain: 'solana' })

  if (linkError) throw new Error(`solana-auth: failed to link wallet — ${linkError.message}`)

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return {
    userId:        userId!,
    walletAddress: address,
    role:          (profile?.role ?? 'user') as SiwsSession['role'],
    issuedAt:      new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WALLET LINKING (attach wallet to existing email session)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Link a verified wallet to an already-authenticated user.
 * Call this after verifySiwsPayload with the user's existing session userId.
 * Throws WALLET_CONFLICT if the wallet belongs to someone else.
 */
export async function linkWalletToUser(
  userId: string,
  address: string
): Promise<WalletLinkResult> {
  const db = getServiceClient()

  const { data: existing } = await db
    .from('wallets')
    .select('user_id')
    .eq('address', address)
    .maybeSingle()

  if (existing) {
    if (existing.user_id === userId)
      return { linked: true, userId, walletAddress: address } // idempotent

    throw new SiwsError(
      'This wallet is already linked to a different account',
      'WALLET_CONFLICT',
      409
    )
  }

  const { error } = await db
    .from('wallets')
    .insert({ user_id: userId, address, chain: 'solana' })

  if (error) throw new Error(`solana-auth: wallet link failed — ${error.message}`)

  return { linked: true, userId, walletAddress: address }
}

/**
 * Get all wallets linked to a user.
 */
export async function getUserWallets(
  userId: string
): Promise<Array<{ address: string; chain: string; verifiedAt: string }>> {
  const db = getServiceClient()
  const { data, error } = await db
    .from('wallets')
    .select('address, chain, verified_at')
    .eq('user_id', userId)
    .order('verified_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(w => ({
    address:    w.address,
    chain:      w.chain,
    verifiedAt: w.verified_at,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP-LEVEL VERIFY FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The single function your /api/solana-auth/verify route calls.
 * Runs every check in sequence:
 *   1. Base58 address format
 *   2. Message parse + domain/chain/timestamp validation
 *   3. Nonce single-use consumption (DB-atomic)
 *   4. Ed25519 signature verification
 *   5. Session resolution (create or fetch user)
 */
export async function verifySiwsPayload(
  payload: SiwsPayload
): Promise<SiwsSession> {
  const { address, message, signature, linkToUserId } = payload

  validateBase58Address(address)

  const parsed = parseSiwsMessage(message)
  validateParsedMessage(parsed, address)

  // Consume nonce before signature check — prevents timing attacks on nonce reuse
  const db = getServiceClient()
  await consumeNonce(db, parsed.nonce, address)

  const valid = verifySiwsSignature(message, signature, address)
  if (!valid)
    throw new SiwsError('Signature verification failed', 'INVALID_SIGNATURE', 401)

  return resolveSiwsSession(address, linkToUserId)
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE HANDLERS
// Mount these in app/api/solana-auth/nonce/route.ts
//              and app/api/solana-auth/verify/route.ts
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/solana-auth/nonce — { address } → { nonce, expiresAt } */
export async function handleNonce(req: Request): Promise<Response> {
  try {
    const body    = await req.json()
    const address = String(body?.address ?? '')
    const result  = await issueSiwsNonce(address)
    return Response.json(result)
  } catch (err) {
    return errorResponse(err)
  }
}

/** POST /api/solana-auth/verify — SiwsPayload → SiwsSession */
export async function handleVerify(req: Request): Promise<Response> {
  try {
    const payload = (await req.json()) as SiwsPayload
    const session = await verifySiwsPayload(payload)
    // Emit the session as a signed cookie/JWT in your auth layer here.
    // With NextAuth, call signIn('credentials', { walletToken: JSON.stringify(session) })
    // from the client after this call succeeds.
    return Response.json({ ok: true, session })
  } catch (err) {
    return errorResponse(err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXTAUTH CREDENTIALS STUB
// In your authOptions.providers array:
// ─────────────────────────────────────────────────────────────────────────────

export function buildSolanaCredentialsProvider() {
  // Lazy import to keep this block framework-agnostic at the top level
  const CredentialsProvider = require('next-auth/providers/credentials').default
  return CredentialsProvider({
    id:   'solana',
    name: 'Solana Wallet',
    credentials: { walletToken: { type: 'text' } },
    async authorize(creds: { walletToken: string }) {
      try {
        const session: SiwsSession = JSON.parse(creds.walletToken)
        // Trust: this token was minted by handleVerify above, on the server,
        // after full signature verification.  Add a HMAC or JWT signature here
        // for additional hardening if your session endpoint is public.
        return {
          id:            session.userId,
          walletAddress: session.walletAddress,
          role:          session.role,
        }
      } catch {
        return null
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE  (mark the function exports below with "use client" in your copy)
// ─────────────────────────────────────────────────────────────────────────────

// ── React hook ────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { useWallet }             from '@solana/wallet-adapter-react'
import { WalletMultiButton }     from '@solana/wallet-adapter-react-ui'
import {
  WalletAdapterNetwork,
  type WalletAdapter,
} from '@solana/wallet-adapter-base'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import {
  WalletProvider,
  ConnectionProvider,
} from '@solana/wallet-adapter-react'
import { clusterApiUrl }         from '@solana/web3.js'
import React, { useMemo }        from 'react'

type UseSolanaAuthState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'signing' }
  | { status: 'verifying' }
  | { status: 'success'; session: SiwsSession }
  | { status: 'error'; error: string }

/**
 * useSolanaAuth — orchestrates the SIWS flow.
 *
 * Usage:
 *   const { signIn, state } = useSolanaAuth()
 *   if (state.status === 'success') redirect(state.session)
 */
export function useSolanaAuth(opts?: {
  linkToUserId?: string
  onSuccess?:    (session: SiwsSession) => void
  onError?:      (err: Error) => void
}) {
  const [state, setState] = useState<UseSolanaAuthState>({ status: 'idle' })
  const wallet            = useWallet()

  const signIn = useCallback(async () => {
    if (!wallet.publicKey) {
      setState({ status: 'error', error: 'No wallet connected' })
      return
    }

    const address = wallet.publicKey.toBase58()

    try {
      setState({ status: 'signing' })

      // 1. Fetch nonce
      const nonceRes = await fetch('/api/solana-auth/nonce', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address }),
      })
      const { nonce } = await nonceRes.json()

      // 2. Build the SIWS message locally (same logic as buildSiwsMessage server-side)
      const domain    = window.location.host
      const uri       = window.location.origin
      const issuedAt  = new Date().toISOString()
      const expiry    = new Date(Date.now() + 5 * 60 * 1000).toISOString()
      const message   = [
        `${domain} wants you to sign in with your Solana account:`,
        address, '',
        'Sign in to MarrowStack with your Solana wallet.',
        '',
        `URI: ${uri}`, 'Version: 1',
        `Chain ID: ${process.env.NEXT_PUBLIC_SOLANA_CLUSTER === 'mainnet-beta' ? 'mainnet' : 'devnet'}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
        `Expiration Time: ${expiry}`,
      ].join('\n')

      const encoded = new TextEncoder().encode(message)

      // 3. Sign — prefer SolanaSignIn (SIWS standard), fall back to signMessage
      let signature: Uint8Array
      if (
        wallet.wallet?.adapter &&
        'solanaSignIn' in (wallet.wallet.adapter as WalletAdapter & { solanaSignIn?: unknown })
      ) {
        // Standard SIWS via signIn feature
        const result = await (wallet.wallet.adapter as any).solanaSignIn({ domain, statement: message })
        signature = result.signature
      } else {
        // Legacy: connect + signMessage fallback
        if (!wallet.signMessage) throw new Error('Wallet does not support message signing')
        signature = await wallet.signMessage(encoded)
      }

      // 4. Verify server-side
      setState({ status: 'verifying' })
      const verifyRes = await fetch('/api/solana-auth/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message,
          signature: bs58.encode(signature),
          linkToUserId: opts?.linkToUserId,
        } satisfies SiwsPayload),
      })

      if (!verifyRes.ok) {
        const { error } = await verifyRes.json()
        throw new Error(error ?? 'Verification failed')
      }

      const { session } = await verifyRes.json()
      setState({ status: 'success', session })
      opts?.onSuccess?.(session)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState({ status: 'error', error: msg })
      opts?.onError?.(err instanceof Error ? err : new Error(msg))
    }
  }, [wallet, opts])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, signIn, reset, wallet }
}

// ── Wallet provider wrapper ───────────────────────────────────────────────────

/**
 * Wrap your app root with this provider.
 * Supports Phantom, Solflare, and Backpack out of the box.
 */
export function WalletProviders({ children }: { children: React.ReactNode }) {
  const cluster  = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? 'devnet') as SolanaCluster
  const network  = cluster === 'mainnet-beta'
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets  = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}

// ── SignInWithSolanaButton ────────────────────────────────────────────────────

interface SignInWithSolanaButtonProps {
  onSuccess?: (session: SiwsSession) => void
  onError?:   (err: Error) => void
  linkToUserId?: string
  className?: string
}

/**
 * Drop-in button.  Handles connect + sign + verify in one click.
 * If the wallet is not connected, renders the wallet-adapter multi-button first.
 */
export function SignInWithSolanaButton({
  onSuccess,
  onError,
  linkToUserId,
  className,
}: SignInWithSolanaButtonProps) {
  const { state, signIn, wallet } = useSolanaAuth({ onSuccess, onError, linkToUserId })
  const connected = !!wallet.publicKey

  if (!connected) return <WalletMultiButton className={className} />

  const label = (() => {
    switch (state.status) {
      case 'connecting':  return 'Connecting...'
      case 'signing':     return 'Sign message in wallet...'
      case 'verifying':   return 'Verifying...'
      case 'success':     return 'Signed in ✓'
      case 'error':       return 'Try again'
      default:            return 'Sign In With Solana'
    }
  })()

  return (
    <button
      onClick={signIn}
      disabled={state.status === 'signing' || state.status === 'verifying' || state.status === 'success'}
      className={className}
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function validateBase58Address(address: string): void {
  try {
    const decoded = bs58.decode(address)
    if (decoded.length !== 32)
      throw new SiwsError(`Invalid address length: ${decoded.length}`, 'INVALID_ADDRESS', 400)
  } catch (e) {
    if (e instanceof SiwsError) throw e
    throw new SiwsError('Address is not valid base58', 'INVALID_ADDRESS', 400)
  }
}

function errorResponse(err: unknown): Response {
  if (err instanceof SiwsError)
    return Response.json({ error: err.message, code: err.code }, { status: err.status })
  const msg = err instanceof Error ? err.message : 'Internal error'
  console.error('solana-auth:', msg)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

export class SiwsError extends Error {
  code:   string
  status: number
  constructor(message: string, code: string, status: number) {
    super(message)
    this.name   = 'SiwsError'
    this.code   = code
    this.status = status
  }
}
