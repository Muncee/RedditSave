"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RedditItem, Tag, ItemMeta } from "@/lib/types";
import TagPill from "./TagPill";

interface ItemModalProps {
  item: RedditItem;
  meta?: ItemMeta;
  tags: Tag[];
  onClose: () => void;
  onMetaChange: (itemId: string, meta: ItemMeta) => void;
  onUnsave: (itemId: string) => void;
}

function redditUrl(path: string): string {
  return `https://www.reddit.com${path}`;
}

export default function ItemModal({
  item,
  meta,
  tags,
  onClose,
  onMetaChange,
  onUnsave,
}: ItemModalProps) {
  const isPost = item.kind === "t3";
  const itemId = item.data.name;
  const title = item.kind === "t3" ? item.data.title : item.data.link_title;
  const body = item.kind === "t3" ? item.data.selftext : item.data.body;
  const permalink = item.data.permalink;
  const subreddit = item.data.subreddit;
  const author = item.data.author;

  const [note, setNote] = useState(meta?.note ?? "");
  const [itemTags, setItemTags] = useState<Tag[]>(meta?.tags ?? []);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [confirmUnsave, setConfirmUnsave] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNote(meta?.note ?? "");
    setItemTags(meta?.tags ?? []);
  }, [meta]);

  const saveNote = useCallback(
    (value: string) => {
      fetch(`/api/items/${itemId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: value }),
      });
      onMetaChange(itemId, { item_id: itemId, tags: itemTags, note: value });
    },
    [itemId, itemTags, onMetaChange]
  );

  function handleNoteChange(value: string) {
    setNote(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(value), 800);
  }

  async function handleAddTag(tag: Tag) {
    if (itemTags.find((t) => t.id === tag.id)) return;
    const next = [...itemTags, tag];
    setItemTags(next);
    setShowTagPicker(false);
    await fetch(`/api/items/${itemId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag.id }),
    });
    onMetaChange(itemId, { item_id: itemId, tags: next, note });
  }

  async function handleRemoveTag(tagId: string) {
    const next = itemTags.filter((t) => t.id !== tagId);
    setItemTags(next);
    await fetch(`/api/items/${itemId}/tags`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    onMetaChange(itemId, { item_id: itemId, tags: next, note });
  }

  async function handleUnsave() {
    setUnsaving(true);
    await fetch(`/api/items/${itemId}/unsave`, { method: "POST" });
    setUnsaving(false);
    onUnsave(itemId);
  }

  const availableTags = tags.filter((t) => !itemTags.find((it) => it.id === t.id));

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mr-3">
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                isPost ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
              }`}
            >
              {isPost ? "post" : "comment"}
            </span>
            <span className="text-sm text-gray-400">r/{subreddit}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white leading-snug mb-1">
              {title}
            </h2>
            <p className="text-xs text-gray-500">by u/{author}</p>
          </div>

          {body && (
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              {body}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {itemTags.map((tag) => (
                <TagPill key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-2 py-1 rounded-full transition-colors"
                >
                  + Add tag
                </button>
                {showTagPicker && availableTags.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-2 min-w-40">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-gray-700 text-sm text-left"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-gray-200">{tag.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showTagPicker && availableTags.length === 0 && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-3 min-w-40">
                    <p className="text-xs text-gray-500">No more tags to add</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Add a personal note..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-800 shrink-0">
          <a
            href={redditUrl(permalink)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-center text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            Open on Reddit
          </a>
          {!confirmUnsave ? (
            <button
              onClick={() => setConfirmUnsave(true)}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 rounded-lg transition-colors"
            >
              Unsave
            </button>
          ) : (
            <button
              onClick={handleUnsave}
              disabled={unsaving}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              {unsaving ? "Removing..." : "Confirm unsave"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
