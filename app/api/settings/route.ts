import { getSetting, setSetting } from "@/lib/db";

export async function GET() {
  return Response.json({
    provider: getSetting("ai_provider") ?? "claude",
    apiKey: getSetting("ai_api_key") ?? "",
  });
}

export async function PUT(request: Request) {
  const { provider, apiKey } = await request.json() as { provider: string; apiKey: string };
  if (!["claude", "openai", "gemini"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }
  setSetting("ai_provider", provider);
  setSetting("ai_api_key", apiKey);
  return Response.json({ ok: true });
}
