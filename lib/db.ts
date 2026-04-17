import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Tag, ItemMeta } from "./types";

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "redditsave.db");

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
  `);
}

export function getTags(userId: string): Tag[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC")
    .all(userId) as Tag[];
}

export function createTag(
  userId: string,
  id: string,
  name: string,
  color: string
): Tag {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    "INSERT INTO tags (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, userId, name, color, now);
  return { id, user_id: userId, name, color, created_at: now };
}

export function deleteTag(userId: string, tagId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM tags WHERE id = ? AND user_id = ?").run(tagId, userId);
}

export function getAllItemMeta(userId: string): ItemMeta[] {
  const db = getDb();

  const notes = db
    .prepare(
      "SELECT item_id, note FROM item_notes WHERE user_id = ?"
    )
    .all(userId) as { item_id: string; note: string }[];

  const itemTags = db
    .prepare(`
      SELECT it.item_id, t.id, t.name, t.color, t.created_at, t.user_id
      FROM item_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.user_id = ?
    `)
    .all(userId) as (Tag & { item_id: string })[];

  const metaMap: Record<string, ItemMeta> = {};

  for (const n of notes) {
    if (!metaMap[n.item_id]) metaMap[n.item_id] = { item_id: n.item_id, tags: [], note: "" };
    metaMap[n.item_id].note = n.note;
  }

  for (const t of itemTags) {
    if (!metaMap[t.item_id]) metaMap[t.item_id] = { item_id: t.item_id, tags: [], note: "" };
    metaMap[t.item_id].tags.push({
      id: t.id,
      user_id: t.user_id,
      name: t.name,
      color: t.color,
      created_at: t.created_at,
    });
  }

  return Object.values(metaMap);
}

export function addTagToItem(userId: string, itemId: string, tagId: string): void {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO item_tags (item_id, tag_id, user_id) VALUES (?, ?, ?)"
  ).run(itemId, tagId, userId);
}

export function removeTagFromItem(userId: string, itemId: string, tagId: string): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM item_tags WHERE item_id = ? AND tag_id = ? AND user_id = ?"
  ).run(itemId, tagId, userId);
}

export function setItemNote(userId: string, itemId: string, note: string): void {
  const db = getDb();
  if (note.trim() === "") {
    db.prepare(
      "DELETE FROM item_notes WHERE item_id = ? AND user_id = ?"
    ).run(itemId, userId);
  } else {
    db.prepare(
      "INSERT INTO item_notes (item_id, user_id, note, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(item_id, user_id) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at"
    ).run(itemId, userId, note, Date.now());
  }
}
