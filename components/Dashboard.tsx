"use client";

import { useState, useEffect, useCallback } from "react";
import { RedditItem, Tag, ItemMeta } from "@/lib/types";
import Sidebar from "./Sidebar";
import FilterBar from "./FilterBar";
import SavedItem from "./SavedItem";
import ItemModal from "./ItemModal";
import AISettingsModal from "./AISettingsModal";

interface Filters {
  type: "all" | "post" | "comment";
  subreddit: string;
  tags: string[];
  search: string;
}

export default function Dashboard() {
  const [items, setItems] = useState<RedditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [itemMeta, setItemMeta] = useState<Record<string, ItemMeta>>({});
  const [selectedItem, setSelectedItem] = useState<RedditItem | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    subreddit: "",
    tags: [],
    search: "",
  });
  const [sort, setSort] = useState<"newest" | "oldest" | "top">("newest");
  const [error, setError] = useState("");
  const [fetchingContent, setFetchingContent] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [organising, setOrganising] = useState(false);
  const [organiseDone, setOrganiseDone] = useState(false);
  const [organiseError, setOrganiseError] = useState("");
  const [showAISettings, setShowAISettings] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [itemsRes, tagsRes, metaRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/tags"),
        fetch("/api/items/meta"),
      ]);

      if (!itemsRes.ok) throw new Error("Failed to load items");

      const itemsData = await itemsRes.json() as RedditItem[];
      const tagsData = await tagsRes.json() as Tag[];
      const metaData = await metaRes.json() as ItemMeta[];

      setItems(itemsData);
      setTags(tagsData);

      const metaMap: Record<string, ItemMeta> = {};
      for (const m of metaData) metaMap[m.item_id] = m;
      setItemMeta(metaMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContent = useCallback(async () => {
    setFetchingContent(true);
    try {
      await fetch("/api/fetch-content", { method: "POST" });
      await fetchData();
      setFetchDone(true);
    } finally {
      setFetchingContent(false);
    }
  }, [fetchData]);

  const autoOrganise = useCallback(async () => {
    setOrganising(true);
    setOrganiseError("");
    try {
      const res = await fetch("/api/auto-organise", { method: "POST" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      await fetchData();
      setOrganiseDone(true);
    } catch (e) {
      setOrganiseError(e instanceof Error ? e.message : "Auto-organise failed");
    } finally {
      setOrganising(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData().then(() => {
      // Auto-fetch content on first load if items lack timestamps
      const params = new URLSearchParams(window.location.search);
      if (params.get("imported")) {
        loadContent();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = items
    .filter((item) => {
      if (filters.type === "post" && item.kind !== "t3") return false;
      if (filters.type === "comment" && item.kind !== "t1") return false;
      if (filters.subreddit && item.data.subreddit !== filters.subreddit) return false;
      if (filters.tags.length > 0) {
        const m = itemMeta[item.data.name];
        if (!m) return false;
        const itemTagIds = m.tags.map((t) => t.id);
        if (!filters.tags.every((id) => itemTagIds.includes(id))) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const title = item.kind === "t3" ? item.data.title : item.data.link_title;
        const body = item.kind === "t3" ? item.data.selftext : item.data.body;
        if (
          !title?.toLowerCase().includes(q) &&
          !body?.toLowerCase().includes(q) &&
          !item.data.subreddit?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return a.data.created_utc - b.data.created_utc;
      if (sort === "top") return (b.data.score ?? 0) - (a.data.score ?? 0);
      return b.data.created_utc - a.data.created_utc;
    });

  const subreddits = Array.from(
    items.reduce((map, item) => {
      const s = item.data.subreddit;
      map.set(s, (map.get(s) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar
        tags={tags}
        subreddits={subreddits}
        filters={filters}
        setFilters={setFilters}
        onTagsChange={setTags}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
          count={filteredItems.length}
          totalCount={items.length}
          onReimport={() => window.location.href = "/"}
          onAutoOrganise={autoOrganise}
          onOpenAISettings={() => setShowAISettings(true)}
          organising={organising}
        />

        <main className="flex-1 overflow-y-auto">
          {fetchingContent && (
            <div className="mx-4 mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-xl flex items-center gap-3">
              <svg className="w-4 h-4 text-blue-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-blue-300 text-sm">Loading post content from Reddit — this may take a moment for large libraries...</p>
            </div>
          )}
          {!fetchingContent && !fetchDone && !loading && items.length > 0 && (
            <div className="mx-4 mt-4 p-3 bg-gray-800/60 border border-gray-700 rounded-xl flex items-center justify-between gap-3">
              <p className="text-gray-400 text-sm">Content not loaded yet — titles and timestamps may be missing.</p>
              <button
                onClick={loadContent}
                className="text-xs shrink-0 bg-reddit hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Load content
              </button>
            </div>
          )}
          {fetchDone && (
            <div className="mx-4 mt-4 p-3 bg-green-900/30 border border-green-700/50 rounded-xl">
              <p className="text-green-300 text-sm">Content loaded successfully.</p>
            </div>
          )}
          {organising && (
            <div className="mx-4 mt-4 p-3 bg-purple-900/30 border border-purple-700/50 rounded-xl flex items-center gap-3">
              <svg className="w-4 h-4 text-purple-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-purple-300 text-sm">AI is categorising your saved items — this may take a minute...</p>
            </div>
          )}
          {organiseDone && !organising && (
            <div className="mx-4 mt-4 p-3 bg-green-900/30 border border-green-700/50 rounded-xl">
              <p className="text-green-300 text-sm">Items organised! Category tags have been applied automatically.</p>
            </div>
          )}
          {organiseError && (
            <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl">
              <p className="text-red-300 text-sm">{organiseError}</p>
            </div>
          )}
          {error && (
            <div className="m-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {!loading && items.length > 0 && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-base font-medium">No items match your filters</p>
              <button
                onClick={() => setFilters({ type: "all", subreddit: "", tags: [], search: "" })}
                className="text-sm mt-2 text-gray-400 hover:text-white underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          <div className="p-4 space-y-3 max-w-3xl mx-auto">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-800 rounded w-1/4" />
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredItems.map((item) => (
                <SavedItem
                  key={item.data.name}
                  item={item}
                  meta={itemMeta[item.data.name]}
                  onClick={() => setSelectedItem(item)}
                  isSelected={selectedItem?.data.name === item.data.name}
                />
              ))
            )}

            {!loading && items.length > 0 && (
              <p className="text-center text-xs text-gray-600 py-4">
                {items.length} saved items
              </p>
            )}
          </div>
        </main>
      </div>

      {showAISettings && (
        <AISettingsModal onClose={() => setShowAISettings(false)} />
      )}

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          meta={itemMeta[selectedItem.data.name]}
          tags={tags}
          onClose={() => setSelectedItem(null)}
          onMetaChange={(id, m) => setItemMeta((prev) => ({ ...prev, [id]: m }))}
          onUnsave={(id) => {
            setItems((prev) => prev.filter((i) => i.data.name !== id));
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
