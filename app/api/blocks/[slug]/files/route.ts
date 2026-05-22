import { NextRequest } from "next/server";
import { getBlockFile, BlockNotAvailableError, BlockPathError } from "@/lib/github/fetch";
import { safeLog } from "@/lib/log";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const filePath = req.nextUrl.searchParams.get("path");

  if (!filePath) {
    return Response.json({ error: "Missing path parameter" }, { status: 400 });
  }

  try {
    const content = await getBlockFile(slug, filePath);

    if (content.truncated) {
      return Response.json({
        truncated: true,
        bytes: content.bytes,
        message: "File too large to preview. Use the 'View on GitHub' link.",
      });
    }

    return Response.json(content);
  } catch (err) {
    if (err instanceof BlockNotAvailableError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof BlockPathError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    safeLog.error("[api/blocks/files] Unexpected error", { slug, filePath, err });
    return Response.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
