export async function POST() {
  return Response.json({ error: "Commerce is not enabled." }, { status: 410 });
}
