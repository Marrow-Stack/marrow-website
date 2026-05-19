export type BlockCategory = 'auth' | 'admin' | 'workspace' | 'solana'

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
    category: 'auth',
    price: 39,
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
    category: 'admin',
    price: 49,
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
    category: 'workspace',
    price: 49,
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
]

export function getBlock(slug: string): MarrowBlock | undefined {
  return BLOCKS.find((b) => b.slug === slug)
}

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  auth: 'Auth',
  admin: 'Admin',
  workspace: 'Workspace',
  solana: 'Solana',
}

export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  auth:      'text-violet-700 dark:text-violet-400 bg-violet-600/10 dark:bg-violet-400/10 border-violet-600/25 dark:border-violet-400/20',
  admin:     'text-amber-700  dark:text-amber-400  bg-amber-600/10  dark:bg-amber-400/10  border-amber-600/25  dark:border-amber-400/20',
  workspace: 'text-cyan-700   dark:text-cyan-400   bg-cyan-600/10   dark:bg-cyan-400/10   border-cyan-600/25   dark:border-cyan-400/20',
  solana:    'text-emerald-700 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-400/10 border-emerald-600/25 dark:border-emerald-400/20',
}
