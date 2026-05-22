import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const adminToken = process.env.ADMIN_REVALIDATE_TOKEN;

  if (!adminToken || token !== adminToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get("tag");
  if (!tag) {
    return Response.json({ error: "Missing tag parameter" }, { status: 400 });
  }

  revalidateTag(tag, "max");
  return Response.json({ revalidated: true, tag });
}
