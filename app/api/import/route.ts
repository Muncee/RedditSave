import { parse } from "csv-parse/sync";
import { upsertItems } from "@/lib/db";
import type { SavedItemRow } from "@/lib/db";

function parseTimestamp(value: string): number {
  if (!value) return 0;
  const num = parseFloat(value);
  if (!isNaN(num)) return Math.floor(num);
  const date = new Date(value);
  if (!isNaN(date.getTime())) return Math.floor(date.getTime() / 1000);
  return 0;
}

function normaliseId(raw: string, prefix: "t3" | "t1"): string {
  if (!raw) return "";
  return raw.startsWith(`${prefix}_`) ? raw : `${prefix}_${raw}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  let total = 0;

  const postsFile = formData.get("posts") as File | null;
  if (postsFile) {
    const text = await postsFile.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const items: Omit<SavedItemRow, "imported_at">[] = records
      .filter((r) => r.id && r.subreddit)
      .map((r) => ({
        id: normaliseId(r.id, "t3"),
        kind: "t3",
        title: r.title ?? "",
        author: r.author ?? "",
        subreddit: r.subreddit ?? "",
        url: r.url ?? "",
        permalink: r.permalink ?? "",
        body: r.selftext ?? r.body ?? r.text ?? "",
        score: parseInt(r.score ?? "0") || 0,
        num_comments: parseInt(r.num_comments ?? "0") || 0,
        created_utc: parseTimestamp(r.created_utc ?? r.date ?? ""),
      }));

    upsertItems(items);
    total += items.length;
  }

  const commentsFile = formData.get("comments") as File | null;
  if (commentsFile) {
    const text = await commentsFile.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const items: Omit<SavedItemRow, "imported_at">[] = records
      .filter((r) => r.id && r.subreddit)
      .map((r) => ({
        id: normaliseId(r.id, "t1"),
        kind: "t1",
        title: r.link_title ?? "",
        author: r.author ?? "",
        subreddit: r.subreddit ?? "",
        url: r.link_url ?? r.url ?? "",
        permalink: r.permalink ?? "",
        body: r.body ?? "",
        score: parseInt(r.score ?? "0") || 0,
        num_comments: 0,
        created_utc: parseTimestamp(r.created_utc ?? r.date ?? ""),
      }));

    upsertItems(items);
    total += items.length;
  }

  return Response.json({ count: total });
}
