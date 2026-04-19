import { getItemIds, updateItem } from "@/lib/db";

export const maxDuration = 300;

const BATCH = 100;
const DELAY_MS = 1100;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface RedditChild {
  kind: string;
  data: Record<string, unknown>;
}

async function fetchBatch(ids: string[]): Promise<RedditChild[]> {
  const res = await fetch(
    `https://www.reddit.com/api/info.json?id=${ids.join(",")}`,
    { headers: { "User-Agent": "RedditSave/1.0.0 (personal organiser)" } }
  );
  if (!res.ok) return [];
  const json = await res.json() as { data: { children: RedditChild[] } };
  return json.data?.children ?? [];
}

export async function POST() {
  const ids = getItemIds().map((r) => r.id);
  if (ids.length === 0) return Response.json({ updated: 0 });

  let updated = 0;

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const children = await fetchBatch(batch);

    for (const child of children) {
      const d = child.data;
      const id = d.name as string;
      if (!id) continue;

      if (child.kind === "t3") {
        updateItem(id, {
          title: (d.title as string) ?? "",
          author: (d.author as string) ?? "",
          subreddit: (d.subreddit as string) ?? "",
          url: (d.url as string) ?? "",
          permalink: (d.permalink as string) ?? "",
          body: (d.selftext as string) ?? "",
          score: (d.score as number) ?? 0,
          num_comments: (d.num_comments as number) ?? 0,
          created_utc: (d.created_utc as number) ?? 0,
        });
      } else if (child.kind === "t1") {
        updateItem(id, {
          title: (d.link_title as string) ?? "",
          author: (d.author as string) ?? "",
          subreddit: (d.subreddit as string) ?? "",
          url: (d.link_url as string) ?? "",
          permalink: (d.permalink as string) ?? "",
          body: (d.body as string) ?? "",
          score: (d.score as number) ?? 0,
          created_utc: (d.created_utc as number) ?? 0,
        });
      }
      updated++;
    }

    if (i + BATCH < ids.length) await sleep(DELAY_MS);
  }

  return Response.json({ updated, total: ids.length });
}
