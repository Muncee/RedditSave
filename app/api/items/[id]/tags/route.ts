import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addTagToItem, removeTagFromItem } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tagId } = await request.json() as { tagId: string };
  if (!tagId) return Response.json({ error: "tagId required" }, { status: 400 });

  const { id } = await params;
  addTagToItem(session.user.name, id, tagId);
  return new Response(null, { status: 204 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tagId } = await request.json() as { tagId: string };
  if (!tagId) return Response.json({ error: "tagId required" }, { status: 400 });

  const { id } = await params;
  removeTagFromItem(session.user.name, id, tagId);
  return new Response(null, { status: 204 });
}
