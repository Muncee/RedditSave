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
  if (!raw) return `${prefix}_unknown_${Math.random()}`;
  return raw.startsWith(`${prefix}_`) ? raw : `${prefix}_${raw}`;
}

// Strip BOM and normalise line endings
function cleanText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}

function parseCSV(text: string): Record<string, string>[] {
  return parse(cleanText(text), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];
}

// Reddit export uses various column name styles — normalise them
function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

// Reddit's minimal export only has id + permalink
// Permalink format: /r/subreddit/comments/postid/title_slug/[commentid/]
function parsePermalink(permalink: string): { subreddit: string; title: string } {
  const parts = permalink.replace(/^\/|\/$/g, "").split("/");
  // ["r", "subreddit", "comments", "postid", "title_slug", ...]
  const subreddit = parts[1] ?? "";
  const slug = parts[4] ?? "";
  const title = slug.replace(/_/g, " ").trim();
  return { subreddit, title };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  let total = 0;
  const debug: string[] = [];

  const postsFile = formData.get("posts") as File | null;
  if (postsFile) {
    const text = await postsFile.text();
    let records: Record<string, string>[] = [];
    try {
      records = parseCSV(text);
    } catch (e) {
      return Response.json({ error: `Failed to parse posts CSV: ${e}` }, { status: 400 });
    }

    if (records.length > 0) {
      debug.push(`posts columns: ${Object.keys(records[0]).join(", ")}`);
    } else {
      debug.push("posts: no rows found");
    }

    const items: Omit<SavedItemRow, "imported_at">[] = records
      .filter((r) => Object.values(r).some((v) => v !== ""))
      .map((r) => {
        const permalink = col(r, "permalink");
        const parsed = parsePermalink(permalink);
        return {
          id: normaliseId(col(r, "id"), "t3"),
          kind: "t3" as const,
          title: col(r, "title") || parsed.title,
          author: col(r, "author"),
          subreddit: (col(r, "subreddit", "subreddit_name_prefixed") || parsed.subreddit).replace(/^r\//, ""),
          url: col(r, "url") || `https://www.reddit.com${permalink}`,
          permalink,
          body: col(r, "selftext", "body", "text"),
          score: parseInt(col(r, "score") || "0") || 0,
          num_comments: parseInt(col(r, "num_comments", "comments") || "0") || 0,
          created_utc: parseTimestamp(col(r, "created_utc", "date", "created")),
        };
      })
      .filter((item) => item.permalink);

    upsertItems(items);
    total += items.length;
    debug.push(`posts imported: ${items.length}`);
  }

  const commentsFile = formData.get("comments") as File | null;
  if (commentsFile) {
    const text = await commentsFile.text();
    let records: Record<string, string>[] = [];
    try {
      records = parseCSV(text);
    } catch (e) {
      return Response.json({ error: `Failed to parse comments CSV: ${e}` }, { status: 400 });
    }

    if (records.length > 0) {
      debug.push(`comments columns: ${Object.keys(records[0]).join(", ")}`);
    } else {
      debug.push("comments: no rows found");
    }

    const items: Omit<SavedItemRow, "imported_at">[] = records
      .filter((r) => Object.values(r).some((v) => v !== ""))
      .map((r) => {
        const permalink = col(r, "permalink");
        const parsed = parsePermalink(permalink);
        return {
          id: normaliseId(col(r, "id"), "t1"),
          kind: "t1" as const,
          title: col(r, "link_title", "post_title", "title") || parsed.title,
          author: col(r, "author"),
          subreddit: (col(r, "subreddit", "subreddit_name_prefixed") || parsed.subreddit).replace(/^r\//, ""),
          url: col(r, "link_url", "url") || `https://www.reddit.com${permalink}`,
          permalink,
          body: col(r, "body", "comment"),
          score: parseInt(col(r, "score") || "0") || 0,
          num_comments: 0,
          created_utc: parseTimestamp(col(r, "created_utc", "date", "created")),
        };
      })
      .filter((item) => item.permalink);

    upsertItems(items);
    total += items.length;
    debug.push(`comments imported: ${items.length}`);
  }

  return Response.json({ count: total, debug });
}
