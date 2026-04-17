import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await fetch("https://oauth.reddit.com/api/unsave", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "RedditSave/1.0.0 by RedditSaveApp",
    },
    body: new URLSearchParams({ id }),
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to unsave" }, { status: res.status });
  }

  return new Response(null, { status: 204 });
}
