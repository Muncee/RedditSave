import { setItemNote } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { note } = await request.json() as { note: string };
  const { id } = await params;
  setItemNote(id, note ?? "");
  return new Response(null, { status: 204 });
}
