import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { safeLog } from "@/lib/log";
import { createHmac } from "crypto";
import { z } from "zod";

const Schema = z.object({
  slug: z.string().min(1).max(64),
  vote: z.enum(["up", "down"]),
});

function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET ?? "fallback-dev-secret";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  try {
    const db = getAdminClient();
    const { error } = await db.from("feedback_votes").upsert(
      {
        block_slug: parsed.data.slug,
        ip_hash: ipHash,
        vote: parsed.data.vote,
      },
      { onConflict: "block_slug,ip_hash" }
    );

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    safeLog.error("[api/feedback/vote] Failed to record vote", { err });
    return Response.json({ error: "Failed to save vote" }, { status: 500 });
  }
}
