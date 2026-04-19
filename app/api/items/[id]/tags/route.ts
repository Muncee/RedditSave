import { addTagToItem, removeTagFromItem } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tagId } = await request.json() as { tagId: string };
  if (!tagId) return Response.json({ error: "tagId required" }, { status: 400 });
  const { id } = await params;
  addTagToItem(id, tagId);
  return new Response(null, { status: 204 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tagId } = await request.json() as { tagId: string };
  if (!tagId) return Response.json({ error: "tagId required" }, { status: 400 });
  const { id } = await params;
  removeTagFromItem(id, tagId);
  return new Response(null, { status: 204 });
}
