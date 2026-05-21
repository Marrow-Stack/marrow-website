import { getAdminClient } from "./supabase"
import { markOrderDelivered, recordDeliveryAttempt, getOrderById } from "./orders"

// ─── Per-block delivery repos ─────────────────────────────────────────────────
// Each block lives in its own private repo.
// Env var pattern: GITHUB_REPO_{BLOCK_ID_UPPERCASE}
//   e.g. GITHUB_REPO_AUTH, GITHUB_REPO_SOLANA_AUTH, GITHUB_REPO_SOLANA_PAYMENTS
// The buyer receives a collaborator invitation to the repo for their purchased block.

export function getRepoForBlock(blockId: string): string[] {
  const key = `GITHUB_REPO_${blockId.toUpperCase().replace(/-/g, "_")}`
  const repo = process.env[key]
  if (!repo) throw new Error(`${key} is not set — add the GitHub repo for block '${blockId}'`)
  return [repo]
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

async function githubFetch(path: string, method = "GET", body?: unknown) {
  const pat = process.env.GITHUB_DELIVERY_PAT
  if (!pat) throw new Error("GITHUB_DELIVERY_PAT is not set")

  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return res
}

// Validate that a GitHub username exists and is a user (not an org)
export async function validateGithubUsername(
  username: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const res = await githubFetch(`/users/${encodeURIComponent(username)}`)
    if (res.status === 404) return { valid: false, reason: "GitHub user not found" }
    if (!res.ok) return { valid: false, reason: `GitHub API error: ${res.status}` }
    const data = await res.json()
    if (data.type === "Organization") {
      return { valid: false, reason: "That is an organization account, not a user account" }
    }
    return { valid: true }
  } catch {
    return { valid: false, reason: "Could not reach GitHub API" }
  }
}

// Add a collaborator to the delivery repo. Idempotent — 201 (new invite) or 204 (already added).
async function addCollaborator(
  repo: string,
  githubUsername: string
): Promise<{ ok: boolean; error?: string }> {
  const [owner, repoName] = repo.split("/")
  if (!owner || !repoName) return { ok: false, error: `Invalid repo format: ${repo}` }

  const res = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/collaborators/${encodeURIComponent(githubUsername)}`,
    "PUT",
    { permission: "read" }
  )

  if (res.status === 201 || res.status === 204) return { ok: true }

  let errText = `HTTP ${res.status}`
  try {
    const body = await res.json()
    errText = body.message ?? errText
  } catch { /* ignore */ }

  return { ok: false, error: errText }
}

// ─── Main delivery function ───────────────────────────────────────────────────

export async function deliverBlock(orderId: string): Promise<{
  delivered: boolean
  needsGithubUsername: boolean
  error?: string
}> {
  const order = await getOrderById(orderId)
  if (!order) return { delivered: false, needsGithubUsername: false, error: "Order not found" }
  if (order.status !== "paid" && order.status !== "delivered") {
    return { delivered: false, needsGithubUsername: false, error: "Order not paid" }
  }

  // Resolve GitHub username from order or user record
  let githubUsername = order.github_username
  if (!githubUsername) {
    const db = getAdminClient()
    const { data: user } = await db
      .from("ms_users")
      .select("github_login")
      .eq("id", order.user_id)
      .single()
    githubUsername = user?.github_login ?? null
  }

  if (!githubUsername) {
    return { delivered: false, needsGithubUsername: true }
  }

  let repo: string
  try {
    repo = getRepoForBlock(order.block_id)[0]
  } catch (e) {
    return { delivered: false, needsGithubUsername: false, error: String(e) }
  }

  const result = await addCollaborator(repo, githubUsername)
  await recordDeliveryAttempt({
    orderId,
    githubUsername,
    repo,
    status: result.ok ? "delivered" : "failed",
    error:  result.error,
  })

  if (!result.ok) {
    return { delivered: false, needsGithubUsername: false, error: `${repo}: ${result.error}` }
  }

  await markOrderDelivered(orderId)
  return { delivered: true, needsGithubUsername: false }
}
