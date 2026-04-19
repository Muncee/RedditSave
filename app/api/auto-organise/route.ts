import Anthropic from "@anthropic-ai/sdk";
import { getItems, getTags, createTag, addTagToItem } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 300;

const client = new Anthropic();

const CATEGORIES = [
  "Programming",
  "Science",
  "Gaming",
  "Finance",
  "Politics",
  "Sports",
  "Technology",
  "Health",
  "Art & Design",
  "Music",
  "Food",
  "Travel",
  "Funny",
  "News",
  "Philosophy",
  "DIY",
  "Nature",
  "Business",
  "Movies & TV",
  "Books",
  "Relationships",
  "Education",
  "History",
  "Space",
  "Fitness",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Programming": "#6366f1",
  "Science": "#06b6d4",
  "Gaming": "#8b5cf6",
  "Finance": "#10b981",
  "Politics": "#ef4444",
  "Sports": "#f59e0b",
  "Technology": "#3b82f6",
  "Health": "#ec4899",
  "Art & Design": "#a855f7",
  "Music": "#f97316",
  "Food": "#84cc16",
  "Travel": "#14b8a6",
  "Funny": "#eab308",
  "News": "#64748b",
  "Philosophy": "#6366f1",
  "DIY": "#78716c",
  "Nature": "#22c55e",
  "Business": "#0ea5e9",
  "Movies & TV": "#c084fc",
  "Books": "#fb923c",
  "Relationships": "#f43f5e",
  "Education": "#2563eb",
  "History": "#92400e",
  "Space": "#1e1b4b",
  "Fitness": "#16a34a",
};

const BATCH_SIZE = 20;

function buildPrompt(items: { id: string; title: string; body: string; subreddit: string; kind: string }[]): string {
  const list = items.map((item, i) =>
    `${i + 1}. [${item.id}] r/${item.subreddit} - ${item.kind === "t3" ? "Post" : "Comment"}: ${item.title}${item.body ? `\n   Content: ${item.body.slice(0, 200)}` : ""}`
  ).join("\n\n");

  return `Categorise each of the following Reddit saved items into one or more of these categories:
${CATEGORIES.join(", ")}

Items:
${list}

Respond with a JSON array where each element has:
- "id": the item ID (the value in square brackets)
- "categories": array of 1-3 category names from the list above that best fit the content

Only use categories from the provided list. Respond with only the JSON array, no other text.`;
}

export async function POST() {
  const items = getItems();
  if (items.length === 0) return Response.json({ tagged: 0 });

  const existingTags = getTags();
  const tagMap = new Map<string, string>(existingTags.map((t) => [t.name, t.id]));

  function ensureTag(name: string): string {
    if (tagMap.has(name)) return tagMap.get(name)!;
    const id = uuidv4();
    const color = CATEGORY_COLORS[name] ?? "#6366f1";
    createTag(id, name, color);
    tagMap.set(name, id);
    return id;
  }

  let tagged = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      subreddit: item.subreddit,
      kind: item.kind,
    }));

    try {
      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 2048,
        messages: [{ role: "user", content: buildPrompt(batch) }],
      });

      let text = "";
      for (const block of response.content) {
        if (block.type === "text") text = block.text;
      }

      const parsed = JSON.parse(text) as { id: string; categories: string[] }[];

      for (const result of parsed) {
        for (const cat of result.categories) {
          if (!CATEGORIES.includes(cat)) continue;
          const tagId = ensureTag(cat);
          addTagToItem(result.id, tagId);
        }
        tagged++;
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return Response.json({ tagged, total: items.length, errors });
}
