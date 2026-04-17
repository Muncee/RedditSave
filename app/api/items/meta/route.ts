import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllItemMeta } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const meta = getAllItemMeta(session.user.name);
  return Response.json(meta);
}
