import { getItemCount } from "@/lib/db";
import { redirect } from "next/navigation";
import UploadZone from "@/components/UploadZone";

export default function Home() {
  const count = getItemCount();
  if (count > 0) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-reddit/10 border border-reddit/20 mb-5">
            <svg className="w-7 h-7 text-reddit" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">RedditSave</h1>
          <p className="text-gray-400 text-sm">Import your Reddit data export to get started</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">How to get your export</p>
          {[
            ["1", "Go to reddit.com/settings/data-request"],
            ["2", "Request your data — Reddit emails you a link"],
            ["3", "Download the ZIP and extract it"],
            ["4", "Upload saved_posts.csv and/or saved_comments.csv below"],
          ].map(([n, text]) => (
            <div key={n} className="flex gap-2.5 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-800 text-gray-400 text-xs flex items-center justify-center font-medium mt-0.5">{n}</span>
              <span className="text-xs text-gray-400">{text}</span>
            </div>
          ))}
        </div>

        <UploadZone />
      </div>
    </main>
  );
}
