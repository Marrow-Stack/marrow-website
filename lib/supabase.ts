import { createClient } from "@supabase/supabase-js"

// ─── DB row types ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  github_id: string | null
  github_login: string | null
  wallet_address: string | null
  created_at: string
  updated_at: string
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
-- MarrowStack — full database migration v2
-- Run this in Supabase → SQL Editor → New query → Run.
-- Safe to run on an existing database (uses IF NOT EXISTS / IF EXISTS guards).

-- ── ms_users ────────────────────────────────────────────────────────────────
create table if not exists public.ms_users (
  id              uuid default gen_random_uuid() primary key,
  email           text,
  name            text,
  avatar_url      text,
  github_id       text unique,
  github_login    text,
  wallet_address  text unique,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.ms_users enable row level security;

-- auto-update updated_at
create or replace function public.ms_handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists ms_users_updated_at on public.ms_users;
create trigger ms_users_updated_at
  before update on public.ms_users
  for each row execute function public.ms_handle_updated_at();

-- indexes
create index if not exists ms_users_github_id_idx     on public.ms_users(github_id);
create index if not exists ms_users_wallet_idx         on public.ms_users(wallet_address);
create index if not exists ms_users_email_idx          on public.ms_users(email);

-- ── ms_nonces ───────────────────────────────────────────────────────────────
create table if not exists public.ms_nonces (
  id           uuid default gen_random_uuid() primary key,
  nonce        text unique not null,
  wallet       text not null,
  domain       text not null,
  created_at   timestamptz default now(),
  consumed_at  timestamptz
);
alter table public.ms_nonces enable row level security;

create index if not exists ms_nonces_wallet_idx   on public.ms_nonces(wallet, created_at);
create index if not exists ms_nonces_cleanup_idx  on public.ms_nonces(created_at) where consumed_at is null;

-- ── ms_orders ───────────────────────────────────────────────────────────────
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

create index if not exists ms_orders_user_id_idx on public.ms_orders(user_id);
create index if not exists ms_orders_status_idx  on public.ms_orders(status);

-- ── ms_deliveries ───────────────────────────────────────────────────────────
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

create index if not exists ms_deliveries_order_id_idx on public.ms_deliveries(order_id);

-- ── feedback_votes ──────────────────────────────────────────────────────────
create table if not exists public.feedback_votes (
  id         uuid default gen_random_uuid() primary key,
  block_slug text not null,
  ip_hash    text not null,
  vote       text not null check (vote in ('up', 'down')),
  created_at timestamptz default now(),
  constraint feedback_votes_block_ip_unique unique (block_slug, ip_hash)
);
alter table public.feedback_votes enable row level security;

-- ── teaser_signups ──────────────────────────────────────────────────────────
create table if not exists public.teaser_signups (
  id         uuid default gen_random_uuid() primary key,
  email      text not null,
  slug       text not null,
  ip_hash    text,
  created_at timestamptz default now(),
  constraint teaser_signups_email_slug_unique unique (email, slug)
);
alter table public.teaser_signups enable row level security;

-- ── copy_events ─────────────────────────────────────────────────────────────
create table if not exists public.copy_events (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.ms_users(id) on delete set null,
  block_slug text not null,
  file_path  text,
  copied_at  timestamptz default now()
);
alter table public.copy_events enable row level security;

create index if not exists copy_events_user_id_idx    on public.copy_events(user_id);
create index if not exists copy_events_block_slug_idx on public.copy_events(block_slug, copied_at desc);

-- ── RLS policies (service role bypasses RLS; these grant anon read where safe)
-- All server-side writes use the service role key which bypasses RLS entirely.
-- The policies below allow the service role through just in case.
do $$ begin
  -- ms_users
  if not exists (select 1 from pg_policies where tablename='ms_users' and policyname='service full access') then
    create policy "service full access" on public.ms_users using (true) with check (true);
  end if;
  -- ms_nonces
  if not exists (select 1 from pg_policies where tablename='ms_nonces' and policyname='service full access') then
    create policy "service full access" on public.ms_nonces using (true) with check (true);
  end if;
  -- ms_orders
  if not exists (select 1 from pg_policies where tablename='ms_orders' and policyname='service full access') then
    create policy "service full access" on public.ms_orders using (true) with check (true);
  end if;
  -- ms_deliveries
  if not exists (select 1 from pg_policies where tablename='ms_deliveries' and policyname='service full access') then
    create policy "service full access" on public.ms_deliveries using (true) with check (true);
  end if;
  -- feedback_votes
  if not exists (select 1 from pg_policies where tablename='feedback_votes' and policyname='service full access') then
    create policy "service full access" on public.feedback_votes using (true) with check (true);
  end if;
  -- teaser_signups
  if not exists (select 1 from pg_policies where tablename='teaser_signups' and policyname='service full access') then
    create policy "service full access" on public.teaser_signups using (true) with check (true);
  end if;
  -- copy_events
  if not exists (select 1 from pg_policies where tablename='copy_events' and policyname='service full access') then
    create policy "service full access" on public.copy_events using (true) with check (true);
  end if;
end $$;

-- ── Additive migration (safe to run on existing databases) ──────────────────
-- Adds new columns to ms_users if they don't exist
alter table public.ms_users add column if not exists avatar_url text;
alter table public.ms_users add column if not exists updated_at timestamptz default now();
`

export const MIGRATION_V2 = `
-- MarrowStack — additive migration v2 (for existing databases)
-- Run this if you already ran the v1 migration.

alter table public.ms_users add column if not exists avatar_url text;
alter table public.ms_users add column if not exists updated_at timestamptz default now();

create or replace function public.ms_handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists ms_users_updated_at on public.ms_users;
create trigger ms_users_updated_at
  before update on public.ms_users
  for each row execute function public.ms_handle_updated_at();

create index if not exists ms_users_github_id_idx     on public.ms_users(github_id);
create index if not exists ms_users_wallet_idx         on public.ms_users(wallet_address);
create index if not exists ms_users_email_idx          on public.ms_users(email);
create index if not exists ms_nonces_wallet_idx        on public.ms_nonces(wallet, created_at);
create index if not exists ms_nonces_cleanup_idx       on public.ms_nonces(created_at) where consumed_at is null;
create index if not exists ms_orders_user_id_idx       on public.ms_orders(user_id);
create index if not exists ms_orders_status_idx        on public.ms_orders(status);

create table if not exists public.feedback_votes (
  id         uuid default gen_random_uuid() primary key,
  block_slug text not null,
  ip_hash    text not null,
  vote       text not null check (vote in ('up', 'down')),
  created_at timestamptz default now(),
  constraint feedback_votes_block_ip_unique unique (block_slug, ip_hash)
);
alter table public.feedback_votes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='feedback_votes' and policyname='service full access') then
    create policy "service full access" on public.feedback_votes using (true) with check (true);
  end if;
end $$;

create table if not exists public.teaser_signups (
  id         uuid default gen_random_uuid() primary key,
  email      text not null,
  slug       text not null,
  ip_hash    text,
  created_at timestamptz default now(),
  constraint teaser_signups_email_slug_unique unique (email, slug)
);
alter table public.teaser_signups enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='teaser_signups' and policyname='service full access') then
    create policy "service full access" on public.teaser_signups using (true) with check (true);
  end if;
end $$;

create table if not exists public.copy_events (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.ms_users(id) on delete set null,
  block_slug text not null,
  file_path  text,
  copied_at  timestamptz default now()
);
alter table public.copy_events enable row level security;
create index if not exists copy_events_user_id_idx    on public.copy_events(user_id);
create index if not exists copy_events_block_slug_idx on public.copy_events(block_slug, copied_at desc);
do $$ begin
  if not exists (select 1 from pg_policies where tablename='copy_events' and policyname='service full access') then
    create policy "service full access" on public.copy_events using (true) with check (true);
  end if;
end $$;
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
