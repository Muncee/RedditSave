"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadZone() {
  const router = useRouter();
  const [posts, setPosts] = useState<File | null>(null);
  const [comments, setComments] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const postsRef = useRef<HTMLInputElement | null>(null);
  const commentsRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload() {
    if (!posts && !comments) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    if (posts) formData.append("posts", posts);
    if (comments) formData.append("comments", comments);

    const res = await fetch("/api/import", { method: "POST", body: formData });

    if (res.ok) {
      const { count } = await res.json() as { count: number };
      router.push(`/dashboard?imported=${count}`);
    } else {
      setError("Import failed. Make sure you uploaded valid Reddit CSV files.");
      setLoading(false);
    }
  }

  function FileSlot({
    label,
    hint,
    file,
    onFile,
    inputRef,
  }: {
    label: string;
    hint: string;
    file: File | null;
    onFile: (f: File | null) => void;
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
  }) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          file
            ? "border-green-600 bg-green-900/10"
            : "border-gray-700 hover:border-gray-500 bg-gray-900/50"
        }`}
      >
        <input
          ref={(el) => { inputRef.current = el; }}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-400 font-medium truncate max-w-48">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none ml-1"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-300">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </>
        )}
      </div>
    );
  }

  const canUpload = (posts || comments) && !loading;

  return (
    <div className="space-y-4 w-full">
      <FileSlot
        label="saved_posts.csv"
        hint="Drop file here or click to browse"
        file={posts}
        onFile={setPosts}
        inputRef={postsRef}
      />
      <FileSlot
        label="saved_comments.csv"
        hint="Drop file here or click to browse"
        file={comments}
        onFile={setComments}
        inputRef={commentsRef}
      />

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full py-3 bg-reddit hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
      >
        {loading ? "Importing..." : "Import saved items"}
      </button>
    </div>
  );
}
