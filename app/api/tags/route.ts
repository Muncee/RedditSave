import { getTags, createTag } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export function GET() {
  return Response.json(getTags());
}

export async function POST(request: Request) {
  const { name, color } = await request.json() as { name: string; color: string };

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const tag = createTag(uuidv4(), name.trim(), color || "#6366f1");
    return Response.json(tag, { status: 201 });
  } catch {
    return Response.json({ error: "Tag name already exists" }, { status: 409 });
  }
}
