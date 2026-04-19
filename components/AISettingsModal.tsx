"use client";

import { useState, useEffect } from "react";

type Provider = "claude" | "openai" | "gemini";

const PROVIDERS: { value: Provider; label: string; hint: string; link: string }[] = [
  { value: "claude", label: "Claude (Anthropic)", hint: "claude-opus-4-7", link: "https://console.anthropic.com/" },
  { value: "openai", label: "ChatGPT (OpenAI)", hint: "gpt-4o-mini", link: "https://platform.openai.com/api-keys" },
  { value: "gemini", label: "Gemini (Google)", hint: "gemini-1.5-flash", link: "https://aistudio.google.com/app/apikey" },
];

interface Props {
  onClose: () => void;
}

export default function AISettingsModal({ onClose }: Props) {
  const [provider, setProvider] = useState<Provider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { provider: Provider; apiKey: string }) => {
        setProvider(d.provider ?? "claude");
        setApiKey(d.apiKey ?? "");
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } finally {
      setSaving(false);
    }
  }

  const selected = PROVIDERS.find((p) => p.value === provider)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">AI Provider Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    provider === p.value
                      ? "bg-purple-700 border-purple-600 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">API Key</label>
              <a
                href={selected.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Get key →
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`${selected.label} API key`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                {showKey ? "hide" : "show"}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Model used: {selected.hint}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
