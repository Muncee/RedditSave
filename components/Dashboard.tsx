"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { RedditItem, Tag, ItemMeta } from "@/lib/types";
import Sidebar from "./Sidebar";
import FilterBar from "./FilterBar";
import SavedItem from "./SavedItem";
import ItemModal from "./ItemModal";

interface Filters {
  type: "all" | "post" | "comment";
  subreddit: string;
  tags: string[];
  search: string;
}

interface DashboardProps {
  username: string;
}

export default function Dashboard({ username }: DashboardProps) {
  const [items, setItems] = useState<RedditItem[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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

  const fetchItems = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "25" });
      if (cursor) params.set("after", cursor);
      const res = await fetch(`/api/saved?${params}`);
      if (res.status === 401) {
        setError("Session expired. Please sign in again.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch saved items");
      const data = await res.json();
      const newItems = (data.data?.children ?? []) as RedditItem[];
      setItems((prev) => (cursor ? [...prev, ...newItems] : newItems));
      setAfter(data.data?.after ?? null);
      setHasMore(!!data.data?.after);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchItems(),
      fetch("/api/tags").then((r) => r.json()).then(setTags),
      fetch("/api/items/meta")
        .then((r) => r.json())
        .then((data: ItemMeta[]) => {
          const map: Record<string, ItemMeta> = {};
          for (const m of data) map[m.item_id] = m;
          setItemMeta(map);
        }),
    ]);
  }, [fetchItems]);

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
        const isPost = item.kind === "t3";
        const title = isPost ? item.data.title : (item.data as { link_title: string }).link_title;
        const body = isPost
          ? (item.data as { selftext: string }).selftext
          : (item.data as { body: string }).body;
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
          username={username}
          onSignOut={() => signOut({ callbackUrl: "/" })}
        />

        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {!error && !loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg font-medium">No saved items found</p>
              <p className="text-sm mt-1">Items you save on Reddit will appear here</p>
            </div>
          )}

          {!error && !loading && items.length > 0 && filteredItems.length === 0 && (
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
            {filteredItems.map((item) => (
              <SavedItem
                key={item.data.name}
                item={item}
                meta={itemMeta[item.data.name]}
                onClick={() => setSelectedItem(item)}
                isSelected={selectedItem?.data.name === item.data.name}
              />
            ))}

            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-800 rounded w-1/4" />
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && hasMore && (
              <button
                onClick={() => fetchItems(after!)}
                className="w-full py-3 text-sm text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-600 rounded-xl transition-colors"
              >
                Load more
              </button>
            )}

            {!loading && !hasMore && items.length > 0 && (
              <p className="text-center text-xs text-gray-600 py-4">
                All {items.length} saved items loaded
              </p>
            )}
          </div>
        </main>
      </div>

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
