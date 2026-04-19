import { getAllItemMeta } from "@/lib/db";

export function GET() {
  return Response.json(getAllItemMeta());
}
