"use client";

import { useState } from "react";
import { Tag, TAG_COLORS } from "@/lib/types";

interface CreateTagModalProps {
  onClose: () => void;
  onCreated: (tag: Tag) => void;
}

export default function CreateTagModal({ onClose, onCreated }: CreateTagModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[5]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });

    if (res.ok) {
      const tag = await res.json() as Tag;
      onCreated(tag);
      onClose();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create tag");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">New Tag</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name..."
              maxLength={32}
              autoFocus
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-gray-900" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          {name && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Preview:</span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: color + "33", color, border: `1px solid ${color}66` }}
              >
                {name}
              </span>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-reddit text-white hover:bg-orange-500 disabled:opacity-40 transition-colors"
            >
              {loading ? "Creating..." : "Create Tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
