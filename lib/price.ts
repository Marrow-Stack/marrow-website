// ─── SOL / USD price feed ────────────────────────────────────────────────────
//
// Source: CoinGecko simple price endpoint (no key required for basic rate).
// Cache: 30s server-side. Quote lock: 90s (shown to buyer with countdown).
// Tolerance: ±1.5% on the received SOL/USDC amount vs the quoted amount.

const CACHE_TTL_MS = 30_000
const QUOTE_WINDOW_MS = 90_000
export const PRICE_TOLERANCE = 0.015 // 1.5%

interface CachedPrice {
  solUsd: number
  fetchedAt: number
}

let cache: CachedPrice | null = null

async function fetchSolPrice(): Promise<number> {
  const apiKey = process.env.COINGECKO_API_KEY
  const url = apiKey
    ? `https://pro-api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&x_cg_pro_api_key=${apiKey}`
    : "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"

  const res = await fetch(url, { next: { revalidate: 30 } })
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const data: { solana: { usd: number } } = await res.json()
  return data.solana.usd
}

export async function getSolPrice(): Promise<number> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.solUsd

  const price = await fetchSolPrice()
  cache = { solUsd: price, fetchedAt: now }
  return price
}

export interface PriceQuote {
  solAmount: string          // exact SOL string, 9 decimal places
  usdcAmount: string         // USDC is 1:1 USD, 6 decimal places
  solPriceUsd: number        // SOL/USD rate used
  quoteExpiresAt: string     // ISO 8601
}

export async function buildQuote(amountUsd: number): Promise<PriceQuote> {
  const solPrice = await getSolPrice()
  const rawSol = amountUsd / solPrice

  // Round to 5 significant decimal places (smallest Solana unit is 1e-9 lamport, but
  // buyer-visible precision at 5 dp is fine and avoids floating-point drift).
  const solAmount = rawSol.toFixed(5)

  // USDC: 1 USDC = $1 USD, amount in USDC equals amount in USD
  const usdcAmount = amountUsd.toFixed(2)

  const expiresAt = new Date(Date.now() + QUOTE_WINDOW_MS).toISOString()

  return {
    solAmount,
    usdcAmount,
    solPriceUsd: solPrice,
    quoteExpiresAt: expiresAt,
  }
}

export function isQuoteExpired(quoteExpiresAt: string): boolean {
  return new Date(quoteExpiresAt) < new Date()
}

// Check if received amount is within tolerance of quoted amount
export function amountWithinTolerance(
  quotedStr: string,
  receivedStr: string
): boolean {
  const quoted = parseFloat(quotedStr)
  const received = parseFloat(receivedStr)
  if (isNaN(quoted) || isNaN(received)) return false
  const ratio = received / quoted
  return ratio >= 1 - PRICE_TOLERANCE && ratio <= 1 + PRICE_TOLERANCE
}
