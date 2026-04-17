"use client";

import { RedditItem, ItemMeta } from "@/lib/types";
import TagPill from "./TagPill";

interface SavedItemProps {
  item: RedditItem;
  meta?: ItemMeta;
  onClick: () => void;
  isSelected: boolean;
}

function timeAgo(utc: number): string {
  const diff = Date.now() / 1000 - utc;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function SavedItem({ item, meta, onClick, isSelected }: SavedItemProps) {
  const isPost = item.kind === "t3";
  const title = item.kind === "t3" ? item.data.title : item.data.link_title;
  const body = item.kind === "t3" ? item.data.selftext : item.data.body;
  const subreddit = item.data.subreddit;
  const author = item.data.author;
  const score = item.data.score;
  const createdUtc = item.data.created_utc;

  const thumbnail = item.kind === "t3"
    ? (() => {
        const res = item.data.preview?.images?.[0]?.resolutions;
        if (res && res.length > 0) {
          return res[Math.min(1, res.length - 1)].url.replace(/&amp;/g, "&");
        }
        return null;
      })()
    : null;

  return (
    <article
      onClick={onClick}
      className={`group relative bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-gray-600 ${
        isSelected ? "border-reddit/60 bg-gray-900/80" : "border-gray-800"
      }`}
    >
      <div className="flex gap-3">
        {thumbnail && (
          <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                isPost ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
              }`}
            >
              {isPost ? "post" : "comment"}
            </span>
            <span className="text-xs text-gray-500">r/{subreddit}</span>
            <span className="text-xs text-gray-600">{timeAgo(createdUtc)}</span>
            {meta?.note && (
              <span className="text-xs text-yellow-500/70 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-2.207 2.207L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Note
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium text-gray-200 leading-snug mb-1 line-clamp-2 group-hover:text-white transition-colors">
            {title}
          </h3>

          {body && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {body.replace(/\n+/g, " ")}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {formatScore(score ?? 0)}
            </span>
            {item.kind === "t3" && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {formatScore(item.data.num_comments ?? 0)}
              </span>
            )}
            <span className="text-xs text-gray-600">u/{author}</span>
          </div>
        </div>
      </div>

      {meta?.tags && meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-800">
          {meta.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} small />
          ))}
        </div>
      )}
    </article>
  );
}
