import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.error === "RefreshAccessTokenError") {
    return Response.json({ error: "TokenExpired" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100);

  const username = session.user?.name;
  if (!username) {
    return Response.json({ error: "No username" }, { status: 400 });
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (after) params.set("after", after);

  const res = await fetch(
    `https://oauth.reddit.com/user/${username}/saved?${params}`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "User-Agent": "RedditSave/1.0.0 by RedditSaveApp",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return Response.json(
      { error: "Reddit API error", detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return Response.json(data);
}
