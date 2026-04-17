"use client";

import { useState } from "react";
import { Tag } from "@/lib/types";
import TagPill from "./TagPill";
import CreateTagModal from "./CreateTagModal";

interface Filters {
  type: "all" | "post" | "comment";
  subreddit: string;
  tags: string[];
  search: string;
}

interface SidebarProps {
  tags: Tag[];
  subreddits: { name: string; count: number }[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  onTagsChange: (tags: Tag[]) => void;
}

export default function Sidebar({ tags, subreddits, filters, setFilters, onTagsChange }: SidebarProps) {
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [subsExpanded, setSubsExpanded] = useState(true);

  function toggleTag(tagId: string) {
    const next = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    setFilters({ ...filters, tags: next });
  }

  function toggleSubreddit(name: string) {
    setFilters({ ...filters, subreddit: filters.subreddit === name ? "" : name });
  }

  async function handleDeleteTag(tagId: string) {
    await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
    onTagsChange(tags.filter((t) => t.id !== tagId));
  }

  return (
    <>
      <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">RedditSave</h1>
          <p className="text-xs text-gray-500 mt-0.5">Saved posts organizer</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Tags section */}
          <div className="px-3 py-2">
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 mb-2"
            >
              <span>Tags</span>
              <span>{tagsExpanded ? "−" : "+"}</span>
            </button>
            {tagsExpanded && (
              <div className="space-y-1">
                {tags.length === 0 && (
                  <p className="text-xs text-gray-600 px-1 py-1">No tags yet</p>
                )}
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
                      filters.tags.includes(tag.id) ? "bg-gray-700" : "hover:bg-gray-800"
                    }`}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-gray-300 truncate">{tag.name}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                      className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0 ml-1"
                      aria-label="Delete tag"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowCreateTag(true)}
                  className="flex items-center gap-2 px-2 py-1.5 w-full text-left text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="text-base leading-none">+</span>
                  <span>New tag</span>
                </button>
              </div>
            )}
          </div>

          {/* Subreddits section */}
          {subreddits.length > 0 && (
            <div className="px-3 py-2 mt-2">
              <button
                onClick={() => setSubsExpanded(!subsExpanded)}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 mb-2"
              >
                <span>Subreddits</span>
                <span>{subsExpanded ? "−" : "+"}</span>
              </button>
              {subsExpanded && (
                <div className="space-y-0.5">
                  {subreddits.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => toggleSubreddit(name)}
                      className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        filters.subreddit === name
                          ? "bg-gray-700 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                      }`}
                    >
                      <span className="truncate">r/{name}</span>
                      <span className="text-xs text-gray-600 ml-1 shrink-0">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear filters */}
        {(filters.subreddit || filters.tags.length > 0) && (
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={() => setFilters({ ...filters, subreddit: "", tags: [] })}
              className="w-full text-xs text-gray-500 hover:text-gray-300 py-1"
            >
              Clear filters
            </button>
          </div>
        )}
      </aside>

      {showCreateTag && (
        <CreateTagModal
          onClose={() => setShowCreateTag(false)}
          onCreated={(tag) => onTagsChange([...tags, tag])}
        />
      )}
    </>
  );
}
