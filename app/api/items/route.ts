import { getItems } from "@/lib/db";
import type { SavedItemRow } from "@/lib/db";
import type { RedditItem } from "@/lib/types";

function rowToRedditItem(row: SavedItemRow): RedditItem {
  if (row.kind === "t3") {
    return {
      kind: "t3",
      data: {
        id: row.id.replace("t3_", ""),
        name: row.id,
        title: row.title,
        author: row.author,
        subreddit: row.subreddit,
        subreddit_name_prefixed: `r/${row.subreddit}`,
        url: row.url,
        permalink: row.permalink,
        thumbnail: "",
        selftext: row.body,
        score: row.score,
        num_comments: row.num_comments,
        created_utc: row.created_utc,
        is_self: !row.url || row.url.includes("reddit.com"),
        over_18: false,
        saved: true,
      },
    };
  }
  return {
    kind: "t1",
    data: {
      id: row.id.replace("t1_", ""),
      name: row.id,
      author: row.author,
      body: row.body,
      body_html: "",
      subreddit: row.subreddit,
      subreddit_name_prefixed: `r/${row.subreddit}`,
      link_title: row.title,
      link_permalink: row.permalink,
      link_url: row.url,
      permalink: row.permalink,
      score: row.score,
      created_utc: row.created_utc,
      saved: true,
    },
  };
}

export function GET() {
  const rows = getItems();
  return Response.json(rows.map(rowToRedditItem));
}
