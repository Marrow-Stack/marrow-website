import { createClient } from "@supabase/supabase-js"

// ─── DB row types ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string
  email: string | null
  name: string | null
  github_id: string | null
  github_login: string | null
  wallet_address: string | null
  created_at: string
}

export interface DbNonce {
  id: string
  nonce: string
  wallet: string
  domain: string
  created_at: string
  consumed_at: string | null
}

export type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "paid"
  | "delivered"
  | "failed"
  | "refunded"

export type PaymentRail = "dodo" | "solana" | "usdc" | "paypal"

export interface DbOrder {
  id: string
  user_id: string | null
  block_id: string
  block_name: string
  status: OrderStatus
  rail: PaymentRail | null
  amount_usd: number | null
  crypto_amount: string | null
  crypto_currency: "SOL" | "USDC" | null
  quote_price_usd: number | null
  quote_expires_at: string | null
  external_payment_id: string | null
  github_username: string | null
  created_at: string
  paid_at: string | null
  delivered_at: string | null
  failed_reason: string | null
}

export type DeliveryStatus = "pending" | "delivered" | "failed"

export interface DbDelivery {
  id: string
  order_id: string
  github_username: string
  repo: string
  status: DeliveryStatus
  error: string | null
  attempted_at: string
  delivered_at: string | null
}

// ─── SQL migration (run once in Supabase SQL Editor) ─────────────────────────
// Paste MIGRATION below into Supabase → SQL Editor → New query → Run.

export const MIGRATION = `
-- MarrowStack — database migration
-- Run this once in Supabase SQL Editor.

create table if not exists public.ms_users (
  id              uuid default gen_random_uuid() primary key,
  email           text,
  name            text,
  github_id       text unique,
  github_login    text,
  wallet_address  text unique,
  created_at      timestamptz default now()
);
alter table public.ms_users enable row level security;

create table if not exists public.ms_nonces (
  id           uuid default gen_random_uuid() primary key,
  nonce        text unique not null,
  wallet       text not null,
  domain       text not null,
  created_at   timestamptz default now(),
  consumed_at  timestamptz
);
alter table public.ms_nonces enable row level security;

create table if not exists public.ms_orders (
  id                   uuid default gen_random_uuid() primary key,
  user_id              uuid references public.ms_users(id) on delete set null,
  block_id             text not null,
  block_name           text not null,
  status               text not null default 'created',
  rail                 text,
  amount_usd           numeric(10,2),
  crypto_amount        text,
  crypto_currency      text,
  quote_price_usd      numeric(10,4),
  quote_expires_at     timestamptz,
  external_payment_id  text,
  github_username      text,
  created_at           timestamptz default now(),
  paid_at              timestamptz,
  delivered_at         timestamptz,
  failed_reason        text
);
alter table public.ms_orders enable row level security;

create table if not exists public.ms_deliveries (
  id               uuid default gen_random_uuid() primary key,
  order_id         uuid references public.ms_orders(id) on delete cascade,
  github_username  text not null,
  repo             text not null,
  status           text not null default 'pending',
  error            text,
  attempted_at     timestamptz default now(),
  delivered_at     timestamptz
);
alter table public.ms_deliveries enable row level security;

-- Service role key bypasses RLS — all server-side ops use it.
-- These policies allow the service role full access:
create policy "service_role full access ms_users"    on public.ms_users    using (true) with check (true);
create policy "service_role full access ms_nonces"   on public.ms_nonces   using (true) with check (true);
create policy "service_role full access ms_orders"   on public.ms_orders   using (true) with check (true);
create policy "service_role full access ms_deliveries" on public.ms_deliveries using (true) with check (true);
`

// ─── Client factory ──────────────────────────────────────────────────────────

function assertEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var: ${key}`)
  return v
}

// Service-role client — server-side ONLY, bypasses RLS
export function getAdminClient() {
  return createClient(
    assertEnv("NEXT_PUBLIC_SUPABASE_URL"),
    assertEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
