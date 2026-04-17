import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTags, createTag } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tags = getTags(session.user.name);
  return Response.json(tags);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, color } = body as { name: string; color: string };

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const tag = createTag(session.user.name, uuidv4(), name.trim(), color || "#6366f1");
    return Response.json(tag, { status: 201 });
  } catch {
    return Response.json({ error: "Tag name already exists" }, { status: 409 });
  }
}
