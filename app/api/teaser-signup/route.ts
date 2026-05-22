import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { safeLog } from "@/lib/log";
import { createHmac } from "crypto";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  slug: z.string().min(1).max(64),
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

    // Idempotent upsert: same email + slug = update confirmed_at only on confirmation
    const { error } = await db.from("teaser_signups").upsert(
      {
        email: parsed.data.email.toLowerCase(),
        slug: parsed.data.slug,
        ip_hash: ipHash,
      },
      { onConflict: "email,slug", ignoreDuplicates: true }
    );

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    safeLog.error("[api/teaser-signup] Failed to store signup", { err });
    return Response.json({ error: "Failed to save signup" }, { status: 500 });
  }
}
