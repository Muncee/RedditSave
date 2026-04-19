"use client";

import { useState, useEffect } from "react";

type Provider = "claude" | "openai" | "gemini";

const PROVIDER_MODELS: Record<Provider, { value: string; label: string }[]> = {
  claude: [
    { value: "claude-opus-4-7", label: "Claude Opus 4.7 (best)" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (faster)" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (fastest)" },
  ],
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1 (latest)" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini (faster)" },
    { value: "o4-mini", label: "o4-mini (reasoning)" },
    { value: "gpt-4o", label: "GPT-4o" },
  ],
  gemini: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (best)" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (faster)" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
};

const DEFAULT_MODEL: Record<Provider, string> = {
  claude: "claude-opus-4-7",
  openai: "gpt-4.1",
  gemini: "gemini-2.5-flash",
};

const PROVIDER_META: Record<Provider, { label: string; link: string }> = {
  claude: { label: "Claude (Anthropic)", link: "https://console.anthropic.com/" },
  openai: { label: "ChatGPT (OpenAI)", link: "https://platform.openai.com/api-keys" },
  gemini: { label: "Gemini (Google)", link: "https://aistudio.google.com/app/apikey" },
};

interface Props {
  onClose: () => void;
}

export default function AISettingsModal({ onClose }: Props) {
  const [provider, setProvider] = useState<Provider>("claude");
  const [model, setModel] = useState("claude-opus-4-7");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { provider: Provider; model: string; apiKey: string }) => {
        const p = d.provider ?? "claude";
        setProvider(p);
        setModel(d.model ?? DEFAULT_MODEL[p]);
        setApiKey(d.apiKey ?? "");
      })
      .catch(() => {});
  }, []);

  function handleProviderChange(p: Provider) {
    setProvider(p);
    setModel(DEFAULT_MODEL[p]);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, apiKey }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } finally {
      setSaving(false);
    }
  }

  const meta = PROVIDER_META[provider];
  const models = PROVIDER_MODELS[provider];

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
          {/* Provider */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    provider === p
                      ? "bg-purple-700 border-purple-600 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                  }`}
                >
                  {PROVIDER_META[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
            >
              {models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">API Key</label>
              <a
                href={meta.link}
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
                placeholder={`${meta.label} API key`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                {showKey ? "hide" : "show"}
              </button>
            </div>
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
