export type BlockCategory = 'core' | 'monetization' | 'utility' | 'security' | 'ui' | 'solana'

export interface MarrowBlock {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  category: BlockCategory
  price: number
  tags: string[]
  features: string[]
  teaserCode: string
  usageCode: string
  fileCount: number
  linesOfCode: number
}

export const BLOCKS: MarrowBlock[] = [
  {
    id: 'auth',
    slug: 'auth',
    name: 'Auth System',
    tagline: 'Production-ready authentication in minutes.',
    description:
      'Full auth with credentials, OAuth (GitHub/Google), email verification, rate limiting, JWT sessions, and account lockout protection.',
    category: 'core',
    price: 29,
    tags: ['next-auth', 'supabase', 'bcrypt', 'zod', 'oauth'],
    features: [
      'Email/password with bcrypt hashing',
      'GitHub & Google OAuth providers',
      'Email verification with expiring tokens',
      'Password reset flow (15-min expiry)',
      'Account lockout after 5 failed attempts',
      'Auth event logging (sign_in, sign_out, register)',
      'Role-based access control (user / admin / super_admin)',
      'JWT sessions with 30-day TTL',
    ],
    teaserCode: `'use server'

import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider   from 'next-auth/providers/github'
import GoogleProvider   from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'

export type UserRole = 'user' | 'admin' | 'super_admin'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, 'One uppercase letter required')
    .regex(/[0-9]/, 'One number required'),
})

const LOGIN_LOCKOUT_THRESHOLD = 5
const LOGIN_LOCKOUT_MINUTES  = 15
const PASSWORD_RESET_MINUTES = 15
const EMAIL_VERIFY_HOURS     = 24

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const profile = await getProfileByEmail(parsed.data.email)
        if (!profile || await isLocked(profile)) return null

        const valid = await bcrypt.compare(
          parsed.data.password,
          profile.password_hash
        )
        if (!valid) {
          await incrementFailedLogin(profile).catch(() => {})
          return null
        }
        await resetLoginState(profile).catch(() => {})
        return {
          id:            profile.id,
          email:         profile.email,
          name:          profile.name,
          image:         profile.avatar_url,
          role:          profile.role,
          emailVerified: profile.email_verified,
        }
      },
    }),

    GitHubProvider({
      clientId:     process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // callbacks, events, session strategy, pages
  // ↑ full source included with purchase
}

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = RegisterSchema.parse(input)
  const existing = await getProfileByEmail(normalizeEmail(email))
  if (existing) throw new Error('Email already registered.')

  const passwordHash = await bcrypt.hash(password, 12)
  const verifyToken  = randomToken(32)
  // ... (full implementation in purchased version)
}`,
    usageCode: `// app/api/auth/[...nextauth]/route.ts
import { authOptions } from '@/blocks/auth/auth'
import NextAuth from 'next-auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// ─── Register a new user ──────────────────────────────────
import { registerUser } from '@/blocks/auth/auth'

const { user, verifyToken } = await registerUser({
  name:     'Jane Doe',
  email:    'jane@example.com',
  password: 'SecurePass123',
})
// send verification email with \`verifyToken\`

// ─── Protect a server action / route ─────────────────────
import { withAuth } from '@/blocks/auth/auth'

export const GET = withAuth(async (req, session) => {
  // session.user.id, session.user.role guaranteed
  return Response.json({ user: session.user })
}, 'admin') // second arg = minimum required role`,
    fileCount: 1,
    linesOfCode: 624,
  },

  {
    id: 'admin',
    slug: 'admin',
    name: 'Admin Dashboard',
    tagline: 'Complete admin layer with zero configuration.',
    description:
      'Full admin backend: user management, revenue analytics, purchase tracking, feature flags with rollout percentages, affiliate management, and CSV export.',
    category: 'core',
    price: 39,
    tags: ['supabase', 'analytics', 'feature-flags', 'affiliates', 'csv'],
    features: [
      'Dashboard stats (revenue, users, refunds, AOV)',
      'Monthly revenue & signup chart data via RPC',
      'Paginated user search with role filter',
      'Ban / role-change with guard assertions',
      'Per-block purchase & refund analytics',
      'Feature flags with percentage rollout',
      'Affiliate leaderboard & earnings detail',
      'CSV export for all purchases',
      'Recent activity feed (purchases + signups)',
    ],
    teaserCode: `'use server'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type AdminRole = 'admin' | 'super_admin'
export type UserRole  = 'user' | 'admin' | 'super_admin' | 'banned'

export interface DashboardStats {
  totalUsers:              number
  totalRevenue:            number
  totalPurchases:          number
  totalRefunds:            number
  avgOrderValue:           number
  refundRate:              number
  proSubscribers:          number
  affiliatePayoutsPending: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [usersCount, completed, refundedCount, proCount, pendingBalances] =
    await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('purchases').select('amount').eq('status', 'completed'),
      db.from('purchases').select('*', { count: 'exact', head: true })
        .eq('status', 'refunded'),
      db.from('profiles').select('*', { count: 'exact', head: true })
        .eq('has_pro_subscription', true),
      db.from('profiles').select('affiliate_balance')
        .gt('affiliate_balance', 0),
    ])

  const totalRevenue    = completed.data.reduce(
    (sum, row) => sum + toNumber(row.amount), 0
  )
  const totalPurchases  = completed.data.length
  const totalRefunds    = refundedCount.count ?? 0
  const totalTx         = totalPurchases + totalRefunds

  return {
    totalUsers:              usersCount.count ?? 0,
    totalRevenue,
    totalPurchases,
    totalRefunds,
    avgOrderValue:           totalPurchases > 0
                               ? totalRevenue / totalPurchases : 0,
    refundRate:              totalTx > 0
                               ? (totalRefunds / totalTx) * 100 : 0,
    proSubscribers:          proCount.count ?? 0,
    affiliatePayoutsPending: pendingBalances.data.reduce(
      (sum, r) => sum + toNumber(r.affiliate_balance), 0
    ),
  }
}

export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  opts?: { description?: string; rolloutPct?: number }
): Promise<void> {
  // Upserts flag with rollout percentage support
  // Full implementation included with purchase
}`,
    usageCode: `// app/admin/page.tsx  (server component)
import { getDashboardStats, requireAdmin } from '@/blocks/admin/admin'
import { getServerSession } from 'next-auth'

export default async function AdminPage() {
  const session = await getServerSession()
  requireAdmin(session)           // throws 401/403 if not admin

  const stats = await getDashboardStats()

  return (
    <div className="grid grid-cols-4 gap-4">
      <Stat label="Revenue"   value={\`\$\{stats.totalRevenue.toFixed(2)\}\`} />
      <Stat label="Users"     value={stats.totalUsers} />
      <Stat label="Refund %"  value={\`\$\{stats.refundRate.toFixed(1)\}%\`} />
      <Stat label="Pro users" value={stats.proSubscribers} />
    </div>
  )
}

// ─── Feature flags ───────────────────────────────────────
import { getFeatureFlag, setFeatureFlag } from '@/blocks/admin/admin'

const isBeta = await getFeatureFlag('beta-dashboard')
// Enable for 20 % of traffic
await setFeatureFlag('beta-dashboard', true, { rolloutPct: 20 })`,
    fileCount: 1,
    linesOfCode: 513,
  },

  {
    id: 'teamspace',
    slug: 'teamspace',
    name: 'Team Workspace',
    tagline: 'Multi-tenant workspaces with fine-grained permissions.',
    description:
      'Complete workspace management: role hierarchy (owner → admin → member → viewer), invite flows with token expiry, email hooks, and permission guards — adapts to any database.',
    category: 'core',
    price: 39,
    tags: ['multi-tenant', 'rbac', 'invites', 'permissions', 'db-agnostic'],
    features: [
      'Role hierarchy (owner / admin / member / viewer)',
      'Workspace invite system with 7-day token expiry',
      'Permission matrix — 8 granular actions',
      'Role-change & member-remove with guard logic',
      'Works with Prisma, Drizzle, Supabase, or custom adapters',
      'Invite acceptance flow helper',
      'Transactional email notification hooks',
      'Owner protection (cannot be removed or demoted)',
    ],
    teaserCode: `'use server'

export type WorkspaceRole  = 'owner' | 'admin' | 'member' | 'viewer'
export type WorkspacePlan  = 'free'  | 'pro'   | 'enterprise'
export type WorkspaceAction =
  | 'workspace:view'     | 'workspace:invite'
  | 'workspace:settings' | 'workspace:billing'
  | 'workspace:delete'   | 'member:view'
  | 'member:remove'      | 'member:change_role'

const ROLE_RANK: Record<WorkspaceRole, number> = {
  viewer: 0, member: 1, admin: 2, owner: 3,
}

const PERMISSIONS: Record<WorkspaceAction, WorkspaceRole> = {
  'workspace:view':     'viewer',
  'workspace:invite':   'admin',
  'workspace:settings': 'admin',
  'workspace:billing':  'owner',
  'workspace:delete':   'owner',
  'member:view':        'viewer',
  'member:remove':      'admin',
  'member:change_role': 'admin',
}

export function canDo(
  role: WorkspaceRole,
  action: WorkspaceAction
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSIONS[action]]
}

export async function inviteMember(input: {
  workspaceId: string
  email:       string
  role:        Exclude<WorkspaceRole, 'owner'>
}) {
  const { workspaceId, role } = input
  const email = normalizeEmail(input.email)

  const { db, workspace, user } = await requireMembership(
    workspaceId, 'workspace:invite'
  )

  // Prevent duplicate invite
  const existing = await db.invite.findPendingByWorkspaceAndEmail(
    workspaceId, email
  )
  assert(!existing, 'An invite already exists for this email', 'CONFLICT', 409)

  // Prevent inviting existing members
  const members = await db.member.findManyByWorkspace(workspaceId)
  assert(
    !members.some(m => normalizeEmail(m.email) === email),
    'This user is already a member', 'CONFLICT', 409
  )

  // Creates invite + sends email via sendWorkspaceInviteEmail()
  // Full implementation included with purchase
}`,
    usageCode: `// 1. Implement the DbAdapter for your ORM
// (Prisma example)
const adapter: DbAdapter = {
  workspace: {
    findById: (id) =>
      prisma.workspace.findUnique({ where: { id } }),
  },
  member: {
    findManyByWorkspace: (wsId) =>
      prisma.member.findMany({ where: { workspace_id: wsId } }),
    findByWorkspaceAndUser: (wsId, userId) =>
      prisma.member.findFirst({
        where: { workspace_id: wsId, user_id: userId },
      }),
    updateRole: (id, role) =>
      prisma.member.update({ where: { id }, data: { role } }),
    remove:  (id) => prisma.member.delete({ where: { id } }),
    findById: (id) => prisma.member.findUnique({ where: { id } }),
  },
  invite: { /* ... */ },
}

// 2. Fetch full workspace bundle in one call
import { getWorkspaceBundle, inviteMember } from '@/blocks/teamspace'

const { workspace, currentUserRole, members, invites } =
  await getWorkspaceBundle('ws_123')

// 3. Invite a colleague
await inviteMember({
  workspaceId: 'ws_123',
  email:       'colleague@company.com',
  role:        'member',
})`,
    fileCount: 1,
    linesOfCode: 437,
  },

  {
    id: 'solana-auth',
    slug: 'solana-auth',
    name: 'Solana Auth (SIWS)',
    tagline: 'Wallet sign-in that survives a replay attack.',
    description:
      'Sign-In-With-Solana with server-side Ed25519 verification, single-use nonces, sessions, RBAC, and wallet↔email account linking. The production glue every SIWS implementation gets wrong.',
    category: 'solana',
    price: 49,
    tags: ['solana', 'siws', 'ed25519', 'wallet-adapter', 'supabase'],
    features: [
      'Standards-compliant SIWS message construction',
      'Server-side Ed25519 signature verification (tweetnacl)',
      'Single-use nonces enforced at the DB layer (replay-proof)',
      'Domain binding — mismatched domain returns 403',
      'Clock-skew validation on issued-at timestamp',
      'SIWS standard + signMessage fallback for legacy wallets',
      'Phantom, Solflare, and Backpack wallet adapters included',
      'Session shape identical to NextAuth email sessions',
      'Wallet↔email account linking with CONFLICT guard',
      'SQL migration: auth_nonces + wallets tables with RLS',
    ],
    teaserCode: `'use server'

// MIT License · MarrowStack

import nacl  from 'tweetnacl'
import bs58  from 'bs58'

export type SolanaCluster = 'devnet' | 'mainnet-beta'

const CHAIN_ID_MAP: Record<SolanaCluster, string> = {
  'devnet':       'devnet',
  'mainnet-beta': 'mainnet',
}

/**
 * Verify an Ed25519 SIWS signature — server-side only.
 * Uses tweetnacl for pure-JS verification; no native bindings needed.
 */
export function verifySiwsSignature(
  message:   string,
  signature: string,   // base58-encoded
  address:   string    // base58-encoded Solana public key
): boolean {
  try {
    const messageBytes   = new TextEncoder().encode(message)
    const signatureBytes = bs58.decode(signature)
    const publicKeyBytes = bs58.decode(address)

    if (signatureBytes.length !== 64) return false
    if (publicKeyBytes.length !== 32) return false

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
  } catch {
    return false
  }
}

/**
 * The single function your /api/solana-auth/verify route calls.
 * All checks in sequence:
 *   1. Base58 address format
 *   2. Message parse + domain / chain / timestamp validation
 *   3. Nonce single-use consumption (DB-atomic — prevents concurrent replay)
 *   4. Ed25519 signature verification
 *   5. Session resolution (create or fetch user)
 */
export async function verifySiwsPayload(
  payload: SiwsPayload
): Promise<SiwsSession> {
  const { address, message, signature, linkToUserId } = payload

  validateBase58Address(address)

  const parsed = parseSiwsMessage(message)
  validateParsedMessage(parsed, address)  // domain, chain, timestamp

  // Consume nonce BEFORE signature check — prevents timing-based replay
  const db = getServiceClient()
  await consumeNonce(db, parsed.nonce, address)

  const valid = verifySiwsSignature(message, signature, address)
  if (!valid)
    throw new SiwsError('Signature verification failed', 'INVALID_SIGNATURE', 401)

  return resolveSiwsSession(address, linkToUserId)
  // ... full implementation in purchased version
}`,
    usageCode: `// 1. Mount WalletProviders in app/layout.tsx
import { WalletProviders } from '@/blocks/solana-auth'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProviders>
          {children}
        </WalletProviders>
      </body>
    </html>
  )
}

// 2. Mount API routes
// app/api/solana-auth/nonce/route.ts
import { handleNonce } from '@/blocks/solana-auth'
export { handleNonce as POST }

// app/api/solana-auth/verify/route.ts
import { handleVerify } from '@/blocks/solana-auth'
export { handleVerify as POST }

// 3. Drop the button wherever sign-in lives
import { SignInWithSolanaButton } from '@/blocks/solana-auth'

<SignInWithSolanaButton
  onSuccess={(session) => {
    // session.userId, session.walletAddress, session.role
    router.push('/dashboard')
  }}
/>

// 4. Wallet-link (attach wallet to an existing email session)
import { linkWalletToUser } from '@/blocks/solana-auth'

await linkWalletToUser(session.user.id, verifiedWalletAddress)`,
    fileCount: 1,
    linesOfCode: 512,
  },

  {
    id: 'solana-payments',
    slug: 'solana-payments',
    name: 'Solana Payments (USDC)',
    tagline: 'USDC acceptance that verifies before delivering value.',
    description:
      'Reference-keyed USDC payments with on-chain confirmation, idempotency, Solana Pay URLs, a subscription scaffold, and optional x402 pay-per-request middleware. The Stripe twin for Solana.',
    category: 'solana',
    price: 59,
    tags: ['solana', 'usdc', 'solana-pay', 'payments', 'x402'],
    features: [
      'Ephemeral reference keys per payment (Solana Pay spec)',
      'On-chain confirmation: mint, amount, recipient, reference validated',
      'Idempotency enforced — signature+reference unique in DB',
      'Solana Pay URL output (QR-compatible, deep-link for mobile)',
      'Poll endpoint + optional WebSocket subscription helper',
      'Devnet and mainnet-beta with env-switched USDC mint addresses',
      'Subscription scaffold (merchant-initiated billing cycles)',
      'Optional x402 middleware — pay-per-request API gating',
      'explorerUrl() helper for Solana Explorer deep links',
      'SQL migration: payments + subscriptions tables with RLS',
    ],
    teaserCode: `'use server'

// MIT License · MarrowStack

// USDC mint addresses — verify at: https://www.circle.com/en/usdc/developers
const USDC_MINTS = {
  'devnet':       '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}

/**
 * Verify a payment on-chain against 6 criteria.
 * Call this BEFORE delivering any product, subscription, or API access.
 *
 * Checks:
 *   1. Transaction exists and is finalized on-chain
 *   2. Transferred token is exactly the USDC mint for the current cluster
 *   3. Amount is ≥ the expected amount
 *   4. Recipient is your treasury address
 *   5. Transaction contains the reference key
 *   6. Signature has not already been credited (idempotency)
 */
export async function verifyPayment(
  reference: string
): Promise<PaymentVerificationResult> {
  const db = getDb()

  const { data: intent } = await db
    .from('payments')
    .select('*')
    .eq('reference', reference)
    .single()

  if (!intent) throw new PaymentError('Payment intent not found', 'NOT_FOUND', 404)

  // Idempotency: already confirmed → return cached result
  if (intent.status === 'confirmed') return cachedResult(intent)
  if (new Date(intent.expires_at) < new Date())
    throw new PaymentError('Payment intent has expired', 'EXPIRED', 410)

  // Find the on-chain transaction by reference key
  const signatureInfo = await findReference(
    connection, new PublicKey(reference), { finality: 'confirmed' }
  )

  // Idempotency: reject already-credited signatures
  const { data: existing } = await db
    .from('payments').select('id')
    .eq('signature', signatureInfo.signature).maybeSingle()
  if (existing)
    throw new PaymentError('Transaction already credited', 'ALREADY_CREDITED', 409)

  // On-chain validation (mint, amount, recipient, reference)
  await validateTransfer(connection, signatureInfo.signature, {
    recipient: new PublicKey(intent.recipient),
    amount:    new BigNumber(intent.amount_usdc),
    splToken:  new PublicKey(intent.mint),
    reference: [new PublicKey(reference)],
  }, { commitment: 'confirmed' })

  // ... persist and return (full implementation in purchased version)
}`,
    usageCode: `// 1. Mount API routes
// app/api/solana-payments/intent/route.ts
import { handleIntent } from '@/blocks/solana-payments'
export { handleIntent as POST }

// app/api/solana-payments/verify/route.ts
import { handleVerify } from '@/blocks/solana-payments'
export { handleVerify as POST }

// app/api/solana-payments/status/route.ts
import { handleStatus } from '@/blocks/solana-payments'
export { handleStatus as GET }

// 2. Create a payment intent (server action / route handler)
import { createPaymentIntent } from '@/blocks/solana-payments'

const intent = await createPaymentIntent({
  amountUsdc: 49,
  label:      'Admin Block — MarrowStack',
  message:    'One-time purchase',
})
// intent.solanaPayUrl → render as QR code
// intent.reference   → pass to client for polling

// 3. Client-side — poll for confirmation
import { usePaymentStatus } from '@/blocks/solana-payments'

const { state, createPayment } = usePaymentStatus({
  onConfirmed: (result) => {
    // result.signature, result.payer, result.amountUsdc
    // ONLY unlock product after this callback fires
    unlockProduct()
  },
})`,
    fileCount: 1,
    linesOfCode: 498,
  },

  // ── Monetization ────────────────────────────────────────────────────────────

  {
    id: 'billing',
    slug: 'billing',
    name: 'Billing & Subscriptions',
    tagline: 'One-time + recurring billing with invoices.',
    description:
      'Stripe-powered billing: one-time purchases, monthly/annual subscriptions, usage-based plans, invoice generation, webhook verification, and customer portal.',
    category: 'monetization',
    price: 39,
    tags: ['stripe', 'subscriptions', 'billing', 'invoices', 'webhooks'],
    features: [
      'One-time + subscription checkout sessions',
      'Monthly / annual plan switching',
      'Stripe webhook verification (HMAC)',
      'Customer portal for self-service cancellation',
      'Invoice PDF generation',
      'Trial period support',
      'Proration on plan upgrades',
      'SQL migration: subscriptions + invoices tables',
    ],
    teaserCode: `'use server'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export type PlanId = 'starter' | 'pro' | 'enterprise'

const PRICE_IDS: Record<PlanId, { monthly: string; annual: string }> = {
  starter:    { monthly: process.env.STRIPE_STARTER_MONTHLY!, annual: process.env.STRIPE_STARTER_ANNUAL! },
  pro:        { monthly: process.env.STRIPE_PRO_MONTHLY!,     annual: process.env.STRIPE_PRO_ANNUAL! },
  enterprise: { monthly: process.env.STRIPE_ENT_MONTHLY!,     annual: process.env.STRIPE_ENT_ANNUAL! },
}

export async function createCheckoutSession(params: {
  userId:    string
  email:     string
  planId:    PlanId
  interval:  'monthly' | 'annual'
  successUrl: string
  cancelUrl:  string
}): Promise<{ url: string }> {
  const priceId = PRICE_IDS[params.planId][params.interval]

  const session = await stripe.checkout.sessions.create({
    mode:               'subscription',
    customer_email:     params.email,
    line_items:         [{ price: priceId, quantity: 1 }],
    success_url:        params.successUrl,
    cancel_url:         params.cancelUrl,
    subscription_data:  { metadata: { user_id: params.userId } },
    allow_promotion_codes: true,
  })

  return { url: session.url! }
}

// ... cancelSubscription, switchPlan, createPortalSession in purchased version`,
    usageCode: `// 1. Create checkout session (server action)
import { createCheckoutSession } from '@/blocks/billing'

const { url } = await createCheckoutSession({
  userId:    session.user.id,
  email:     session.user.email,
  planId:    'pro',
  interval:  'monthly',
  successUrl: \`\${APP_URL}/dashboard?upgraded=1\`,
  cancelUrl:  \`\${APP_URL}/pricing\`,
})
redirect(url)

// 2. Handle Stripe webhooks
// app/api/webhooks/stripe/route.ts
import { handleStripeWebhook } from '@/blocks/billing'
export async function POST(req: Request) {
  return handleStripeWebhook(req)
}

// 3. Check subscription in server component
import { getUserSubscription } from '@/blocks/billing'
const sub = await getUserSubscription(session.user.id)
// sub.status, sub.plan, sub.renewsAt`,
    fileCount: 1,
    linesOfCode: 520,
  },

  {
    id: 'payments',
    slug: 'payments',
    name: 'PayPal Checkout',
    tagline: 'One-time payments with webhook verification.',
    description:
      'PayPal Orders v2 integration: create orders, capture payments, verify webhooks with HMAC, idempotency guards, and refund support.',
    category: 'monetization',
    price: 29,
    tags: ['paypal', 'checkout', 'payments', 'one-time', 'webhooks'],
    features: [
      'PayPal Orders v2 (create + capture)',
      'Webhook signature verification',
      'Idempotency — duplicate event protection',
      'Refund initiation via server action',
      'Sandbox / live env switching',
      'Order status polling helper',
      'SQL migration: paypal_orders table',
    ],
    teaserCode: `'use server'

const BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    \`\${process.env.PAYPAL_CLIENT_ID}:\${process.env.PAYPAL_CLIENT_SECRET}\`
  ).toString('base64')

  const res = await fetch(\`\${BASE}/v1/oauth2/token\`, {
    method: 'POST',
    headers: { Authorization: \`Basic \${creds}\`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    next: { revalidate: 3000 },
  })
  const data = await res.json()
  return data.access_token
}

export async function createOrder(params: {
  amountUsd: number
  description: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getAccessToken()
  const res = await fetch(\`\${BASE}/v2/checkout/orders\`, {
    method: 'POST',
    headers: { Authorization: \`Bearer \${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: params.amountUsd.toFixed(2) } }],
      application_context: { return_url: params.returnUrl, cancel_url: params.cancelUrl },
    }),
  })
  const data = await res.json()
  const approveUrl = data.links.find((l: { rel: string }) => l.rel === 'approve').href
  return { orderId: data.id, approveUrl }
}

// captureOrder, handleWebhook in purchased version`,
    usageCode: `// 1. Create a PayPal order
import { createOrder } from '@/blocks/payments'

const { orderId, approveUrl } = await createOrder({
  amountUsd:   49,
  description: 'Admin Block — MarrowStack',
  returnUrl:   \`\${APP_URL}/checkout/success?orderId=\${dbOrderId}\`,
  cancelUrl:   \`\${APP_URL}/blocks/admin\`,
})
redirect(approveUrl) // sends buyer to PayPal

// 2. Capture after buyer returns
import { captureOrder } from '@/blocks/payments'
const result = await captureOrder(paypalOrderId)

// 3. Webhook handler
// app/api/webhooks/paypal/route.ts
import { handlePayPalWebhook } from '@/blocks/payments'
export async function POST(req: Request) {
  return handlePayPalWebhook(req)
}`,
    fileCount: 1,
    linesOfCode: 310,
  },

  // ── Utility ─────────────────────────────────────────────────────────────────

  {
    id: 'email',
    slug: 'email',
    name: 'Email System',
    tagline: 'Beautiful transactional emails via Resend.',
    description:
      'Resend-powered transactional email: typed template system, HTML + plain-text dual output, reply-to threading, open tracking, and a local preview server.',
    category: 'utility',
    price: 19,
    tags: ['email', 'resend', 'transactional', 'templates', 'smtp'],
    features: [
      'Typed template system (TypeScript generics)',
      'HTML + plain-text dual output',
      'Resend as primary transport (SMTP fallback)',
      'Local preview server (no real sends in dev)',
      'Reply-to threading support',
      'Batch send with rate-limit backoff',
      'Open/click tracking helpers',
    ],
    teaserCode: `import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailTemplate =
  | { type: 'verify-email';    props: { name: string; verifyUrl: string } }
  | { type: 'reset-password';  props: { name: string; resetUrl: string; expiresIn: string } }
  | { type: 'welcome';         props: { name: string; dashboardUrl: string } }
  | { type: 'order-confirmed'; props: { name: string; blockName: string; repoUrl: string } }

export async function sendEmail(params: {
  to:       string
  template: EmailTemplate
  replyTo?: string
}): Promise<{ messageId: string }> {
  const { subject, html, text } = renderTemplate(params.template)

  const { data, error } = await resend.emails.send({
    from:     process.env.EMAIL_FROM ?? 'noreply@yourapp.com',
    to:       params.to,
    subject,
    html,
    text,
    reply_to: params.replyTo,
  })

  if (error) throw new Error(\`Resend error: \${error.message}\`)
  return { messageId: data!.id }
}

// renderTemplate, batchSend, previewEmail in purchased version`,
    usageCode: `import { sendEmail } from '@/blocks/email'

// Send a verification email
await sendEmail({
  to: 'user@example.com',
  template: {
    type: 'verify-email',
    props: { name: 'Jane', verifyUrl: 'https://yourapp.com/verify?token=...' },
  },
})

// Welcome email after registration
await sendEmail({
  to: user.email,
  template: {
    type: 'welcome',
    props: { name: user.name, dashboardUrl: 'https://yourapp.com/dashboard' },
  },
})`,
    fileCount: 1,
    linesOfCode: 280,
  },

  {
    id: 'profile',
    slug: 'profile',
    name: 'User Profile',
    tagline: 'Editable profiles with avatar upload.',
    description:
      'Complete user profile management: display name, bio, avatar upload to Supabase Storage with auto-resize, account deletion with cascade, and public profile pages.',
    category: 'utility',
    price: 9,
    tags: ['profile', 'avatar', 'storage', 'supabase', 'upload'],
    features: [
      'Editable display name, bio, and links',
      'Avatar upload with client-side resize',
      'Supabase Storage with signed URLs',
      'Account deletion with full cascade',
      'Public profile page at /u/[username]',
      'Username uniqueness validation',
      'SQL migration: profiles table with RLS',
    ],
    teaserCode: `'use server'

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(60),
  bio:         z.string().max(280).optional(),
  website:     z.string().url().optional().or(z.literal('')),
  username:    z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export async function updateProfile(
  userId: string,
  input:  UpdateProfileInput
): Promise<void> {
  const parsed = UpdateProfileSchema.parse(input)
  const db = getServiceClient()

  // Guard username uniqueness
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('username', parsed.username)
    .neq('id', userId)
    .maybeSingle()

  if (existing) throw new Error('Username already taken')

  const { error } = await db
    .from('profiles')
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

// uploadAvatar, deleteAccount in purchased version`,
    usageCode: `// Server action — update profile
import { updateProfile } from '@/blocks/profile'

await updateProfile(session.user.id, {
  displayName: 'Jane Doe',
  username:    'janedoe',
  bio:         'Building in public.',
  website:     'https://jane.dev',
})

// Upload avatar (client component)
import { uploadAvatar } from '@/blocks/profile'

const { avatarUrl } = await uploadAvatar(session.user.id, file)

// Public profile page
// app/u/[username]/page.tsx
import { getPublicProfile } from '@/blocks/profile'
const profile = await getPublicProfile(params.username)`,
    fileCount: 1,
    linesOfCode: 245,
  },

  {
    id: 'notifications',
    slug: 'notifications',
    name: 'Notifications System',
    tagline: 'Real-time in-app + Web Push notifications.',
    description:
      'Full notification infrastructure: Supabase Realtime for live delivery, Web Push via VAPID, in-app notification centre, read/unread state, and per-user preference controls.',
    category: 'utility',
    price: 19,
    tags: ['notifications', 'realtime', 'push', 'supabase', 'vapid'],
    features: [
      'In-app notification centre with read/unread',
      'Supabase Realtime live delivery',
      'Web Push via VAPID (no third-party service)',
      'Per-user notification preferences',
      'Notification types: info, success, warning, alert',
      'Bulk mark-as-read + delete',
      'SQL migration: notifications + push_subscriptions tables',
    ],
    teaserCode: `'use server'

export type NotificationType = 'info' | 'success' | 'warning' | 'alert'

export interface CreateNotificationParams {
  userId:  string
  type:    NotificationType
  title:   string
  body:    string
  linkUrl?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const db = getServiceClient()

  await db.from('notifications').insert({
    user_id:  params.userId,
    type:     params.type,
    title:    params.title,
    body:     params.body,
    link_url: params.linkUrl ?? null,
    metadata: params.metadata ?? null,
    read:     false,
  })

  // Fire Web Push if user has an active subscription
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('user_id', params.userId)

  if (subs?.length) {
    await sendWebPush(subs, { title: params.title, body: params.body, url: params.linkUrl })
  }
}

// markRead, markAllRead, deleteNotification in purchased version`,
    usageCode: `// Create a notification (server-side)
import { createNotification } from '@/blocks/notifications'

await createNotification({
  userId: order.user_id,
  type:   'success',
  title:  'Block delivered!',
  body:   'Your Auth block is ready on GitHub.',
  linkUrl: 'https://github.com/your-org/block-auth',
})

// Real-time subscription (client component)
import { useNotifications } from '@/blocks/notifications'

const { notifications, unreadCount, markRead } = useNotifications()`,
    fileCount: 1,
    linesOfCode: 360,
  },

  {
    id: 'search',
    slug: 'search',
    name: 'Full-Text Search',
    tagline: 'PostgreSQL tsvector search with highlighting.',
    description:
      'Production full-text search on PostgreSQL: tsvector/tsquery, weighted ranking, result highlighting, search-as-you-type with debounce, and query analytics.',
    category: 'utility',
    price: 19,
    tags: ['search', 'postgresql', 'full-text', 'tsvector', 'supabase'],
    features: [
      'tsvector/tsquery with A/B/C/D weight ranking',
      'Result snippet highlighting (ts_headline)',
      'Search-as-you-type with server action debounce',
      'Multi-table search with UNION ranking',
      'Search analytics (query logging + CTR)',
      'Autocomplete via trigram index',
      'SQL migration: search_index view + GIN indexes',
    ],
    teaserCode: `'use server'

export interface SearchResult {
  id:        string
  type:      'block' | 'doc' | 'user'
  title:     string
  snippet:   string
  rank:      number
  url:       string
}

export async function search(params: {
  query:  string
  types?: Array<'block' | 'doc' | 'user'>
  limit?: number
  offset?: number
}): Promise<{ results: SearchResult[]; total: number }> {
  const { query, types, limit = 20, offset = 0 } = params
  if (!query.trim()) return { results: [], total: 0 }

  const db = getServiceClient()

  // Sanitise: prevent tsquery injection
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .join(' & ')

  const { data, error } = await db
    .rpc('full_text_search', {
      p_query:  tsQuery,
      p_types:  types ?? ['block', 'doc'],
      p_limit:  limit,
      p_offset: offset,
    })

  if (error) throw new Error(error.message)
  return { results: (data ?? []) as SearchResult[], total: data?.length ?? 0 }
}

// highlight, logSearchQuery in purchased version`,
    usageCode: `// Instant search API route
// app/api/search/route.ts
import { search } from '@/blocks/search'

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const results = await search({ query: q, limit: 8 })
  return Response.json(results)
}

// Client-side hook
import { useSearch } from '@/blocks/search'

const { results, isLoading, query, setQuery } = useSearch({ debounceMs: 200 })`,
    fileCount: 1,
    linesOfCode: 290,
  },

  {
    id: 'fileupload',
    slug: 'fileupload',
    name: 'File Upload',
    tagline: 'Drag-and-drop upload to Supabase Storage.',
    description:
      'Production file upload: drag-and-drop UI, client-side validation, Supabase Storage with signed URLs, image optimisation, progress tracking, and bulk upload support.',
    category: 'utility',
    price: 9,
    tags: ['upload', 'storage', 'supabase', 'drag-and-drop', 'images'],
    features: [
      'Drag-and-drop + click-to-browse UI',
      'Client-side type + size validation',
      'Supabase Storage with per-user buckets',
      'Signed URL generation with TTL',
      'Image resize before upload (canvas API)',
      'Upload progress bar',
      'Bulk upload with concurrency limit',
      'SQL migration: file_uploads table with RLS',
    ],
    teaserCode: `'use server'

import { createClient } from '@supabase/supabase-js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB   = 10

export async function uploadFile(params: {
  userId:   string
  file:     File
  bucket:   string
  folder?:  string
}): Promise<{ path: string; url: string }> {
  const { userId, file, bucket, folder = '' } = params

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(\`File type \${file.type} is not allowed\`)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(\`File exceeds \${MAX_SIZE_MB} MB limit\`)
  }

  const ext  = file.name.split('.').pop()
  const path = [\`users/\${userId}\`, folder, \`\${crypto.randomUUID()}.\${ext}\`]
    .filter(Boolean).join('/')

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await db.storage.from(bucket).upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = db.storage.from(bucket).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

// deleteFile, getSignedUrl, bulkUpload in purchased version`,
    usageCode: `// Drop-in upload component
import { FileUpload } from '@/blocks/fileupload'

<FileUpload
  bucket="avatars"
  accept={['image/jpeg', 'image/png']}
  maxSizeMb={5}
  onUpload={({ path, url }) => updateAvatar(url)}
  onError={(e) => toast.error(e.message)}
/>

// Server-side upload (from API route)
import { uploadFile } from '@/blocks/fileupload'

const formData = await req.formData()
const file = formData.get('file') as File
const { path, url } = await uploadFile({ userId, file, bucket: 'uploads' })`,
    fileCount: 1,
    linesOfCode: 220,
  },

  {
    id: 'analytics',
    slug: 'analytics',
    name: 'Analytics Tracker',
    tagline: 'Typed event tracking with PostHog + Supabase fallback.',
    description:
      'Drop-in analytics: typed event schema, PostHog as primary sink, Supabase as self-hosted fallback, session tracking, funnel helpers, and a dashboard query layer.',
    category: 'utility',
    price: 9,
    tags: ['analytics', 'posthog', 'tracking', 'events', 'funnels'],
    features: [
      'Typed event schema (TypeScript discriminated union)',
      'PostHog as primary sink',
      'Supabase self-hosted fallback',
      'Server-side + client-side tracking',
      'Session + page view tracking',
      'Funnel query helpers',
      'User identity + traits',
    ],
    teaserCode: `'use client'

export type TrackEvent =
  | { event: 'page_view';        props: { path: string; referrer?: string } }
  | { event: 'block_viewed';     props: { blockId: string; blockName: string } }
  | { event: 'checkout_started'; props: { blockId: string; price: number; rail: string } }
  | { event: 'purchase_complete';props: { blockId: string; price: number; orderId: string } }
  | { event: 'cta_clicked';      props: { label: string; location: string } }
  | { event: 'search_performed'; props: { query: string; resultCount: number } }

export function track(e: TrackEvent): void {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.capture(e.event, e.props)
  }

  // Supabase fallback (fire-and-forget)
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: e.event, props: e.props }),
  }).catch(() => { /* non-fatal */ })
}

// usePageTracking, identify, getFunnelStats in purchased version`,
    usageCode: `// Track an event anywhere
import { track } from '@/blocks/analytics'

track({ event: 'checkout_started', props: { blockId: 'auth', price: 29, rail: 'dodo' } })

// Auto page-view tracking (layout.tsx)
import { PageTracker } from '@/blocks/analytics'

export default function RootLayout({ children }) {
  return <html><body><PageTracker />{children}</body></html>
}

// Identify user after login
import { identify } from '@/blocks/analytics'
identify(session.user.id, { email: session.user.email, plan: 'pro' })`,
    fileCount: 1,
    linesOfCode: 185,
  },

  {
    id: 'seo',
    slug: 'seo',
    name: 'SEO Toolkit',
    tagline: 'Metadata, sitemap, robots.txt, JSON-LD schemas.',
    description:
      'Complete SEO layer for Next.js: typed generateMetadata helpers, dynamic sitemap, robots.txt, JSON-LD for Article/Product/BreadcrumbList, and Open Graph image generation.',
    category: 'utility',
    price: 9,
    tags: ['seo', 'metadata', 'sitemap', 'json-ld', 'opengraph'],
    features: [
      'Typed generateMetadata helper with defaults',
      'Dynamic sitemap.xml with priority + changefreq',
      'robots.txt with crawl-delay',
      'JSON-LD: Article, Product, BreadcrumbList, FAQ',
      'Open Graph + Twitter card defaults',
      'Canonical URL generation',
      'Structured breadcrumb component',
    ],
    teaserCode: `import type { Metadata } from 'next'

export interface SeoConfig {
  title:       string
  description: string
  path:        string
  image?:      string
  type?:       'website' | 'article' | 'product'
  noIndex?:    boolean
}

const SITE = {
  name:    'Your App',
  url:     process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com',
  twitter: '@yourapp',
}

export function buildMetadata(config: SeoConfig): Metadata {
  const url    = \`\${SITE.url}\${config.path}\`
  const image  = config.image ?? \`\${SITE.url}/og-default.jpg\`
  const title  = \`\${config.title} — \${SITE.name}\`

  return {
    title,
    description: config.description,
    metadataBase: new URL(SITE.url),
    alternates:   { canonical: url },
    robots: config.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: { title, description: config.description, url, images: [image], type: config.type ?? 'website' },
    twitter:   { card: 'summary_large_image', title, description: config.description, images: [image] },
  }
}

// buildSitemap, buildJsonLd, BreadcrumbNav in purchased version`,
    usageCode: `// Per-page metadata (server component)
import { buildMetadata } from '@/blocks/seo'

export const metadata = buildMetadata({
  title:       'Auth Block',
  description: 'Production-ready auth in minutes.',
  path:        '/blocks/auth',
  type:        'product',
})

// JSON-LD product schema
import { ProductJsonLd } from '@/blocks/seo'
<ProductJsonLd name="Auth Block" price={29} currency="USD" url="/blocks/auth" />

// Dynamic sitemap
// app/sitemap.ts
import { buildSitemap } from '@/blocks/seo'
export default buildSitemap`,
    fileCount: 1,
    linesOfCode: 195,
  },

  {
    id: 'i18n',
    slug: 'i18n',
    name: 'Internationalization',
    tagline: 'Locale routing + RTL + currency formatting.',
    description:
      'Full i18n for Next.js App Router: locale-prefixed routing, next-intl message loading, RTL layout support, number/currency/date formatting, and a locale switcher component.',
    category: 'utility',
    price: 19,
    tags: ['i18n', 'localization', 'rtl', 'next-intl', 'routing'],
    features: [
      'Locale-prefixed routing (en, fr, ar, ja, ...)',
      'next-intl message loading per locale',
      'RTL layout flip (Arabic, Hebrew, Persian)',
      'Currency + number formatting per locale',
      'Date/time formatting with timezone',
      'Locale switcher component',
      'Middleware-based locale detection',
    ],
    teaserCode: `// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales:        ['en', 'fr', 'de', 'ar', 'ja'],
  defaultLocale:  'en',
  localeDetection: true,
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatCurrency(
  amount:   number,
  currency: string,
  locale:   string
): string {
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date:   Date | string,
  locale: string,
  opts?:  Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...opts,
  }).format(new Date(date))
}

// LocaleSwitcher component, RTL provider, getMessages in purchased version`,
    usageCode: `// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { RtlProvider } from '@/blocks/i18n'

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages()
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <RtlProvider locale={locale}>{children}</RtlProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

// Use translations
import { useTranslations } from 'next-intl'
const t = useTranslations('common')
<p>{t('welcome')}</p>`,
    fileCount: 1,
    linesOfCode: 310,
  },

  // ── Security ─────────────────────────────────────────────────────────────────

  {
    id: 'ratelimit',
    slug: 'ratelimit',
    name: 'Rate Limiting',
    tagline: 'Sliding window limiter for Next.js API routes.',
    description:
      'Sliding-window rate limiting backed by Upstash Redis: per-IP and per-user limits, burst allowance, 429 responses with Retry-After headers, and zero-config middleware.',
    category: 'security',
    price: 9,
    tags: ['rate-limit', 'redis', 'upstash', 'sliding-window', 'middleware'],
    features: [
      'Sliding window algorithm (accurate, no burst spikes)',
      'Upstash Redis backend (serverless-safe)',
      'Per-IP + per-user + per-route limits',
      'Burst allowance configuration',
      '429 response with Retry-After header',
      'Zero-config Next.js middleware wrapper',
      'In-memory fallback for local dev',
    ],
    teaserCode: `import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

// Sliding window — 20 requests per 10 seconds per IP
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: 'rl:api',
})

// Stricter limit for auth routes — 5 attempts per minute
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'rl:auth',
})

export async function withRateLimit(
  req:     NextRequest,
  limiter: Ratelimit,
  key?:    string
): Promise<NextResponse | null> {
  const identifier = key ?? req.ip ?? req.headers.get('x-forwarded-for') ?? 'anon'
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    )
  }
  return null // proceed
}`,
    usageCode: `// Protect any API route
import { withRateLimit, apiLimiter, authLimiter } from '@/blocks/ratelimit'

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, authLimiter)
  if (limited) return limited // 429

  // ... your handler
}

// Or as middleware (applies to all matched routes)
// middleware.ts
import { rateLimitMiddleware } from '@/blocks/ratelimit'
export default rateLimitMiddleware`,
    fileCount: 1,
    linesOfCode: 175,
  },

  {
    id: 'errorhandling',
    slug: 'errorhandling',
    name: 'Error Handling',
    tagline: 'Error boundaries, structured logging, typed errors.',
    description:
      'Production error infrastructure: typed AppError classes, React error boundaries, structured JSON logging, Sentry integration hook, and a global error page.',
    category: 'security',
    price: 9,
    tags: ['errors', 'logging', 'boundaries', 'sentry', 'typescript'],
    features: [
      'Typed AppError with code + status + context',
      'React error boundary with fallback UI',
      'Structured JSON logging (stdout, no deps)',
      'Sentry integration hook (optional)',
      'Global error.tsx + not-found.tsx pages',
      'Server action error normaliser',
      'HTTP error factory helpers (400, 401, 403, 404, 500)',
    ],
    teaserCode: `// Typed error classes
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code:    string,
    public readonly status:  number = 500,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError     extends AppError { constructor(m = 'Not found')    { super(m, 'NOT_FOUND',     404) } }
export class UnauthorizedError extends AppError { constructor(m = 'Unauthorized') { super(m, 'UNAUTHORIZED',  401) } }
export class ForbiddenError    extends AppError { constructor(m = 'Forbidden')    { super(m, 'FORBIDDEN',     403) } }
export class ValidationError   extends AppError { constructor(m: string)          { super(m, 'VALIDATION',    422) } }

// Structured logger
export const log = {
  info:  (msg: string, ctx?: object) => writeLog('INFO',  msg, ctx),
  warn:  (msg: string, ctx?: object) => writeLog('WARN',  msg, ctx),
  error: (msg: string, ctx?: object) => writeLog('ERROR', msg, ctx),
}

function writeLog(level: string, msg: string, ctx?: object) {
  process.stdout.write(JSON.stringify({
    ts: new Date().toISOString(), level, msg, ...ctx,
  }) + '\\n')
}

// normaliseError, withErrorBoundary, ErrorFallback in purchased version`,
    usageCode: `import { NotFoundError, UnauthorizedError, log } from '@/blocks/errorhandling'

// In server actions / route handlers
export async function getOrder(id: string) {
  const order = await db.orders.findById(id)
  if (!order)   throw new NotFoundError('Order not found')
  if (!isOwner) throw new ForbiddenError()

  log.info('order.fetched', { orderId: id })
  return order
}

// Wrap client trees with error boundary
import { ErrorBoundary } from '@/blocks/errorhandling'
<ErrorBoundary fallback={<ErrorFallback />}>
  <Dashboard />
</ErrorBoundary>`,
    fileCount: 1,
    linesOfCode: 230,
  },

  // ── UI ───────────────────────────────────────────────────────────────────────

  {
    id: 'darkmode',
    slug: 'darkmode',
    name: 'Dark Mode Toggle',
    tagline: 'Theme engine with accent colors + animated toggle.',
    description:
      'Complete theme system for Tailwind + Next.js: system preference detection, per-user override, accent color palette, auto schedule (sunrise/sunset), and an animated toggle component.',
    category: 'ui',
    price: 19,
    tags: ['dark-mode', 'theme', 'tailwind', 'next-themes', 'animation'],
    features: [
      'System preference detection + override',
      'next-themes persistence (localStorage)',
      'Accent color palette (8 options)',
      'Auto schedule by sunrise/sunset',
      'FOUC prevention script',
      'Animated toggle component (spring physics)',
      'CSS variable integration with Tailwind',
    ],
    teaserCode: `'use client'

import { useTheme }  from 'next-themes'
import { motion }    from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

export type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'red' | 'pink' | 'cyan' | 'amber'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      whileTap={{ scale: 0.92, y: 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className="relative w-14 h-7 rounded-full border transition-colors"
      style={{
        background:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        borderColor:  isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)',
      }}
      aria-label="Toggle theme"
    >
      <motion.div
        layout
        className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ left: isDark ? 'calc(100% - 1.75rem)' : '0.125rem', background: isDark ? '#fbbf24' : '#6d28d9' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? <Sun size={12} className="text-black" /> : <Moon size={12} className="text-white" />}
      </motion.div>
    </motion.button>
  )
}

// ThemeProvider, AccentPicker, useAutoSchedule in purchased version`,
    usageCode: `// app/layout.tsx
import { ThemeProvider } from '@/blocks/darkmode'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// Drop-in toggle
import { ThemeToggle } from '@/blocks/darkmode'
<ThemeToggle />

// Accent color picker
import { AccentPicker } from '@/blocks/darkmode'
<AccentPicker onChange={(color) => applyAccent(color)} />`,
    fileCount: 1,
    linesOfCode: 210,
  },

  {
    id: 'formvalidation',
    slug: 'formvalidation',
    name: 'Form Validation',
    tagline: 'React Hook Form + Zod + reusable Field components.',
    description:
      'Full form infrastructure: React Hook Form v7 + Zod schemas, reusable Field / Input / Select / Textarea components, inline error messages, async server validation, and form-level error display.',
    category: 'ui',
    price: 9,
    tags: ['forms', 'zod', 'react-hook-form', 'validation', 'accessibility'],
    features: [
      'React Hook Form v7 with Zod resolver',
      'Reusable Field / Input / Select / Checkbox / Textarea',
      'Inline error messages with ARIA attributes',
      'Async field validation (server-side uniqueness checks)',
      'Form-level error banner',
      'Loading + disabled state management',
      'Schema inference — one Zod schema, one TypeScript type',
    ],
    teaserCode: `'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Input, Button } from '@/blocks/formvalidation'

const SignUpSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter required')
    .regex(/[0-9]/, 'One number required'),
})

type SignUpInput = z.infer<typeof SignUpSchema>

export function SignUpForm() {
  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await registerUser(data)
    if (result.error) form.setError('email', { message: result.error })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name"     name="name"     form={form}><Input /></Field>
      <Field label="Email"    name="email"    form={form}><Input type="email" /></Field>
      <Field label="Password" name="password" form={form}><Input type="password" /></Field>
      <Button loading={form.formState.isSubmitting}>Create account</Button>
    </form>
  )
}`,
    usageCode: `// Drop in any form
import { Field, Input, Select, Textarea, Button } from '@/blocks/formvalidation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  role:    z.enum(['admin', 'member']),
  message: z.string().min(10),
})

const form = useForm({ resolver: zodResolver(schema) })

<form onSubmit={form.handleSubmit(onSubmit)}>
  <Field label="Role"    name="role"    form={form}><Select options={ROLES} /></Field>
  <Field label="Message" name="message" form={form}><Textarea rows={4} /></Field>
  <Button loading={form.formState.isSubmitting}>Submit</Button>
</form>`,
    fileCount: 1,
    linesOfCode: 265,
  },
]

export function getBlock(slug: string): MarrowBlock | undefined {
  return BLOCKS.find((b) => b.slug === slug)
}

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  core:         'Core',
  monetization: 'Monetization',
  utility:      'Utility',
  security:     'Security',
  ui:           'UI',
  solana:       'Solana',
}

export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  core:         'text-violet-700 dark:text-violet-400 bg-violet-600/10 dark:bg-violet-400/10 border-violet-600/25 dark:border-violet-400/20',
  monetization: 'text-amber-700  dark:text-amber-400  bg-amber-600/10  dark:bg-amber-400/10  border-amber-600/25  dark:border-amber-400/20',
  utility:      'text-cyan-700   dark:text-cyan-400   bg-cyan-600/10   dark:bg-cyan-400/10   border-cyan-600/25   dark:border-cyan-400/20',
  security:     'text-red-700    dark:text-red-400    bg-red-600/10    dark:bg-red-400/10    border-red-600/25    dark:border-red-400/20',
  ui:           'text-pink-700   dark:text-pink-400   bg-pink-600/10   dark:bg-pink-400/10   border-pink-600/25   dark:border-pink-400/20',
  solana:       'text-emerald-700 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-400/10 border-emerald-600/25 dark:border-emerald-400/20',
}
