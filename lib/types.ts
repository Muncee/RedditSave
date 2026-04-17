export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: number;
}

export interface ItemMeta {
  item_id: string;
  tags: Tag[];
  note: string;
}

export interface RedditPostData {
  id: string;
  name: string;
  title: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  url: string;
  permalink: string;
  thumbnail: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  is_self: boolean;
  over_18: boolean;
  saved: boolean;
  post_hint?: string;
  preview?: {
    images: Array<{
      source: { url: string; width: number; height: number };
      resolutions: Array<{ url: string; width: number; height: number }>;
    }>;
  };
}

export interface RedditCommentData {
  id: string;
  name: string;
  author: string;
  body: string;
  body_html: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  link_title: string;
  link_permalink: string;
  link_url: string;
  permalink: string;
  score: number;
  created_utc: number;
  saved: boolean;
}

export type RedditItem =
  | { kind: "t3"; data: RedditPostData }
  | { kind: "t1"; data: RedditCommentData };

export const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];
