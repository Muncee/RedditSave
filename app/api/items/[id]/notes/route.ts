import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setItemNote } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { note } = await request.json() as { note: string };
  const { id } = await params;
  setItemNote(session.user.name, id, note ?? "");
  return new Response(null, { status: 204 });
}
