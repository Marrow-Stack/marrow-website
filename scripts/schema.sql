-- MarrowStack — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- All tables are prefixed with ms_ to avoid conflicts with Supabase internals.
-- RLS is enabled on every table; the service role bypasses for server-triggered operations.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ms_users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id       TEXT        UNIQUE,
  github_login    TEXT,
  wallet_address  TEXT        UNIQUE,
  email           TEXT,
  name            TEXT,
  role            TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ms_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own row"
  ON ms_users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Service role has full access to ms_users"
  ON ms_users
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Auth nonces (SIWS single-use, TTL enforced)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ms_nonces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce       TEXT        NOT NULL UNIQUE,
  wallet      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ms_nonces_wallet_idx ON ms_nonces (wallet);
CREATE INDEX IF NOT EXISTS ms_nonces_created_at_idx ON ms_nonces (created_at);

ALTER TABLE ms_nonces ENABLE ROW LEVEL SECURITY;

-- Only service role can touch nonces (server-side only)
CREATE POLICY "Service role only"
  ON ms_nonces
  USING (true)
  WITH CHECK (true);

-- Auto-clean expired nonces (optional: run via a scheduled function)
-- DELETE FROM ms_nonces WHERE created_at < NOW() - INTERVAL '10 minutes';

-- ─────────────────────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE ms_order_status AS ENUM (
  'created', 'awaiting_payment', 'paid', 'delivered', 'failed', 'refunded'
);

CREATE TYPE ms_payment_rail AS ENUM ('dodo', 'sol', 'usdc');

CREATE TABLE IF NOT EXISTS ms_orders (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID              NOT NULL REFERENCES ms_users (id) ON DELETE CASCADE,
  block_id            TEXT              NOT NULL,
  block_name          TEXT              NOT NULL,
  status              ms_order_status   NOT NULL DEFAULT 'created',
  rail                ms_payment_rail,
  amount_usd          NUMERIC(10, 2)    NOT NULL,
  -- Crypto-specific fields (NULL for fiat)
  crypto_amount       TEXT,
  crypto_currency     TEXT              CHECK (crypto_currency IN ('SOL', 'USDC')),
  quote_price_usd     NUMERIC(10, 6),
  quote_expires_at    TIMESTAMPTZ,
  -- External payment reference
  external_payment_id TEXT              UNIQUE,
  -- Timestamps
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ms_orders_user_id_idx ON ms_orders (user_id);
CREATE INDEX IF NOT EXISTS ms_orders_block_id_idx ON ms_orders (block_id);
CREATE INDEX IF NOT EXISTS ms_orders_status_idx ON ms_orders (status);
CREATE INDEX IF NOT EXISTS ms_orders_external_payment_id_idx ON ms_orders (external_payment_id);

ALTER TABLE ms_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own orders"
  ON ms_orders FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role full access to ms_orders"
  ON ms_orders
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Deliveries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE ms_delivery_status AS ENUM (
  'pending', 'invited', 'delivered', 'failed', 'needs_github'
);

CREATE TABLE IF NOT EXISTS ms_deliveries (
  id                UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID                NOT NULL REFERENCES ms_orders (id) ON DELETE CASCADE,
  block_id          TEXT                NOT NULL,
  github_login      TEXT,
  github_invite_id  BIGINT,
  status            ms_delivery_status  NOT NULL DEFAULT 'pending',
  attempts          INT                 NOT NULL DEFAULT 0,
  last_error        TEXT,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ms_deliveries_order_id_idx ON ms_deliveries (order_id);
CREATE INDEX IF NOT EXISTS ms_deliveries_status_idx ON ms_deliveries (status);

ALTER TABLE ms_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own deliveries via order"
  ON ms_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ms_orders
      WHERE ms_orders.id = ms_deliveries.order_id
        AND auth.uid()::text = ms_orders.user_id::text
    )
  );

CREATE POLICY "Service role full access to ms_deliveries"
  ON ms_deliveries
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-update updated_at on all tables
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ms_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ms_users_updated_at
  BEFORE UPDATE ON ms_users
  FOR EACH ROW EXECUTE FUNCTION ms_set_updated_at();

CREATE TRIGGER ms_orders_updated_at
  BEFORE UPDATE ON ms_orders
  FOR EACH ROW EXECUTE FUNCTION ms_set_updated_at();

CREATE TRIGGER ms_deliveries_updated_at
  BEFORE UPDATE ON ms_deliveries
  FOR EACH ROW EXECUTE FUNCTION ms_set_updated_at();
