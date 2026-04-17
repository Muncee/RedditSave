"use client";

interface Filters {
  type: "all" | "post" | "comment";
  subreddit: string;
  tags: string[];
  search: string;
}

interface FilterBarProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: "newest" | "oldest" | "top";
  setSort: (s: "newest" | "oldest" | "top") => void;
  count: number;
  totalCount: number;
  username: string;
  onSignOut: () => void;
}

export default function FilterBar({
  filters,
  setFilters,
  sort,
  setSort,
  count,
  totalCount,
  username,
  onSignOut,
}: FilterBarProps) {
  const types: { label: string; value: Filters["type"] }[] = [
    { label: "All", value: "all" },
    { label: "Posts", value: "post" },
    { label: "Comments", value: "comment" },
  ];

  const sorts: { label: string; value: typeof sort }[] = [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "Top", value: "top" },
  ];

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 shrink-0">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search saved items..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
            >
              ×
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex bg-gray-800 rounded-lg p-0.5 gap-0.5">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilters({ ...filters, type: t.value })}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filters.type === t.value
                  ? "bg-gray-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-300 focus:outline-none"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {count === totalCount ? `${totalCount} items` : `${count} / ${totalCount}`}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{username}</span>
            <button
              onClick={onSignOut}
              className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-2 py-1 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
