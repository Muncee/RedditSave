import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteTag } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  deleteTag(session.user.name, id);
  return new Response(null, { status: 204 });
}
