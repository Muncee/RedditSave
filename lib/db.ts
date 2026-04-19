import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Tag, ItemMeta } from "./types";

export interface SavedItemRow {
  id: string;
  kind: "t3" | "t1";
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  body: string;
  score: number;
  num_comments: number;
  created_utc: number;
  imported_at: number;
}

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "redditsave.db");

const LOCAL_USER = "local";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_items (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK(kind IN ('t3','t1')),
      title TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      subreddit TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      permalink TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      score INTEGER NOT NULL DEFAULT 0,
      num_comments INTEGER NOT NULL DEFAULT 0,
      created_utc INTEGER NOT NULL DEFAULT 0,
      imported_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (item_id, tag_id, user_id),
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS item_notes (
      item_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      note TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (item_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// ── Items ──────────────────────────────────────────────────────────────────

export function upsertItems(items: Omit<SavedItemRow, "imported_at">[]): number {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO saved_items (id, kind, title, author, subreddit, url, permalink, body, score, num_comments, created_utc, imported_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      score = excluded.score,
      num_comments = excluded.num_comments,
      imported_at = excluded.imported_at
  `);

  const insertMany = db.transaction((rows: Omit<SavedItemRow, "imported_at">[]) => {
    for (const item of rows) {
      stmt.run(item.id, item.kind, item.title, item.author, item.subreddit, item.url, item.permalink, item.body, item.score, item.num_comments, item.created_utc, now);
    }
  });

  insertMany(items);
  return items.length;
}

export function getItems(): SavedItemRow[] {
  return getDb()
    .prepare("SELECT * FROM saved_items ORDER BY created_utc DESC")
    .all() as SavedItemRow[];
}

export function getItemIds(): { id: string }[] {
  return getDb().prepare("SELECT id FROM saved_items").all() as { id: string }[];
}

export function updateItem(id: string, data: Partial<Omit<SavedItemRow, "id" | "kind" | "imported_at">>): void {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);
  getDb().prepare(`UPDATE saved_items SET ${sets} WHERE id = ?`).run(...values, id);
}

export function deleteItem(id: string): void {
  getDb().prepare("DELETE FROM saved_items WHERE id = ?").run(id);
}

export function getItemCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) as count FROM saved_items").get() as { count: number };
  return row.count;
}

// ── Tags ───────────────────────────────────────────────────────────────────

export function getTags(): Tag[] {
  return getDb()
    .prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC")
    .all(LOCAL_USER) as Tag[];
}

export function createTag(id: string, name: string, color: string): Tag {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    "INSERT INTO tags (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, LOCAL_USER, name, color, now);
  return { id, user_id: LOCAL_USER, name, color, created_at: now };
}

export function deleteTag(tagId: string): void {
  getDb().prepare("DELETE FROM tags WHERE id = ? AND user_id = ?").run(tagId, LOCAL_USER);
}

// ── Item meta ──────────────────────────────────────────────────────────────

export function getAllItemMeta(): ItemMeta[] {
  const db = getDb();

  const notes = db
    .prepare("SELECT item_id, note FROM item_notes WHERE user_id = ?")
    .all(LOCAL_USER) as { item_id: string; note: string }[];

  const itemTags = db
    .prepare(`
      SELECT it.item_id, t.id, t.name, t.color, t.created_at, t.user_id
      FROM item_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.user_id = ?
    `)
    .all(LOCAL_USER) as (Tag & { item_id: string })[];

  const metaMap: Record<string, ItemMeta> = {};

  for (const n of notes) {
    if (!metaMap[n.item_id]) metaMap[n.item_id] = { item_id: n.item_id, tags: [], note: "" };
    metaMap[n.item_id].note = n.note;
  }

  for (const t of itemTags) {
    if (!metaMap[t.item_id]) metaMap[t.item_id] = { item_id: t.item_id, tags: [], note: "" };
    metaMap[t.item_id].tags.push({ id: t.id, user_id: t.user_id, name: t.name, color: t.color, created_at: t.created_at });
  }

  return Object.values(metaMap);
}

export function addTagToItem(itemId: string, tagId: string): void {
  getDb()
    .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id, user_id) VALUES (?, ?, ?)")
    .run(itemId, tagId, LOCAL_USER);
}

export function removeTagFromItem(itemId: string, tagId: string): void {
  getDb()
    .prepare("DELETE FROM item_tags WHERE item_id = ? AND tag_id = ? AND user_id = ?")
    .run(itemId, tagId, LOCAL_USER);
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

export function setItemNote(itemId: string, note: string): void {
  const db = getDb();
  if (note.trim() === "") {
    db.prepare("DELETE FROM item_notes WHERE item_id = ? AND user_id = ?").run(itemId, LOCAL_USER);
  } else {
    db.prepare(`
      INSERT INTO item_notes (item_id, user_id, note, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(item_id, user_id) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at
    `).run(itemId, LOCAL_USER, note, Date.now());
  }
}
