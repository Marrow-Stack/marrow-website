import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";
import { safeLog } from "@/lib/log";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { slug, filePath } = body ?? {};
  if (!slug || typeof slug !== "string") {
    return Response.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const db = getAdminClient();
    await db.from("copies").insert({
      user_id: session.user.id,
      block_slug: slug,
      file_path: filePath ?? null,
    });
    return Response.json({ ok: true });
  } catch (err) {
    safeLog.error("[api/copy-record] Failed to record copy", { err });
    return Response.json({ ok: false }, { status: 500 });
  }
}
