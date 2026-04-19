import { getSetting, setSetting } from "@/lib/db";

export async function GET() {
  return Response.json({
    provider: getSetting("ai_provider") ?? "claude",
    model: getSetting("ai_model") ?? "claude-opus-4-7",
    apiKey: getSetting("ai_api_key") ?? "",
  });
}

export async function PUT(request: Request) {
  const { provider, model, apiKey } = await request.json() as { provider: string; model: string; apiKey: string };
  if (!["claude", "openai", "gemini"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }
  setSetting("ai_provider", provider);
  setSetting("ai_model", model ?? "");
  setSetting("ai_api_key", apiKey);
  return Response.json({ ok: true });
}
