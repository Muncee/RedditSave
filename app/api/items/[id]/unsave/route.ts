import { deleteItem } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteItem(id);
  return new Response(null, { status: 204 });
}
