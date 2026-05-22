export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let githubRemaining = -1;
  let githubResetAt = "";

  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      githubRemaining = data.rate?.remaining ?? -1;
      githubResetAt = data.rate?.reset
        ? new Date(data.rate.reset * 1000).toISOString()
        : "";
    }
  } catch {}

  return Response.json({
    ok: true,
    env: process.env.NODE_ENV,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    github: {
      remaining: githubRemaining,
      resetAt: githubResetAt,
    },
  });
}
