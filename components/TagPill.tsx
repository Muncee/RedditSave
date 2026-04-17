"use client";

import { Tag } from "@/lib/types";

interface TagPillProps {
  tag: Tag;
  onRemove?: () => void;
  small?: boolean;
}

export default function TagPill({ tag, onRemove, small }: TagPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: tag.color + "33", color: tag.color, border: `1px solid ${tag.color}66` }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 hover:opacity-70 leading-none"
          aria-label={`Remove ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
