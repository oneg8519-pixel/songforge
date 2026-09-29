import fs from 'node:fs';
import path from 'node:path';
import { Track, UserAccount, TrackVersion, TrackSection } from '../src/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUDIO_DIR = path.resolve(process.cwd(), 'storage', 'audio');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// In-memory + SQLite synced storage for high performance and durability
interface StorageState {
  users: Map<string, UserAccount>;
  tracks: Map<string, Track>;
}

const state: StorageState = {
  users: new Map(),
  tracks: new Map(),
};

let sqliteDb: any = null;

try {
  // Use Node 22 built-in SQLite
  // @ts-ignore
  const { DatabaseSync } = await import('node:sqlite');
  const dbFile = path.join(DATA_DIR, 'songforge.db');
  sqliteDb = new DatabaseSync(dbFile);

  // Initialize tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      tier TEXT,
      credits INTEGER,
      avatar_url TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      prompt TEXT,
      genre TEXT,
      mood TEXT,
      instruments TEXT,
      vocal_style TEXT,
      bpm INTEGER,
      duration INTEGER,
      instrumental INTEGER,
      language TEXT,
      lyrics TEXT,
      audio_url TEXT,
      format TEXT,
      sections_json TEXT,
      versions_json TEXT,
      current_version INTEGER,
      is_favorite INTEGER,
      tags TEXT,
      reference_images TEXT,
      ai_generated INTEGER,
      model_used TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);
  console.log('[DB] SQLite database initialized successfully at', dbFile);
} catch (err: any) {
  console.warn('[DB] Using fallback JSON-persistent storage:', err.message);
}

// JSON fallback path
const JSON_BACKUP_FILE = path.join(DATA_DIR, 'songforge_store.json');

function saveToDisk() {
  try {
    const data = {
      users: Array.from(state.users.values()),
      tracks: Array.from(state.tracks.values()),
    };
    fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Error writing JSON backup:', e);
  }
}

// Initialize seed data
export function initDb() {
  // Load existing records if SQLite exists
  if (sqliteDb) {
    try {
      const userRows = sqliteDb.prepare('SELECT * FROM users').all();
      for (const row of userRows) {
        state.users.set(row.id, {
          id: row.id,
          email: row.email,
          name: row.name,
          tier: row.tier as any,
          credits: Number(row.credits),
          avatarUrl: row.avatar_url,
        });
      }

      const trackRows = sqliteDb.prepare('SELECT * FROM tracks').all();
      for (const row of trackRows) {
        state.tracks.set(row.id, {
          id: row.id,
          userId: row.user_id,
          title: row.title,
          prompt: row.prompt,
          genre: row.genre,
          mood: row.mood,
          instruments: JSON.parse(row.instruments || '[]'),
          vocalStyle: row.vocal_style,
          bpm: Number(row.bpm),
          duration: Number(row.duration),
          instrumental: Boolean(row.instrumental),
          language: row.language,
          lyrics: row.lyrics,
          audioUrl: row.audio_url,
          format: row.format,
          sections: JSON.parse(row.sections_json || '[]'),
          versions: JSON.parse(row.versions_json || '[]'),
          currentVersion: Number(row.current_version),
          isFavorite: Boolean(row.is_favorite),
          tags: JSON.parse(row.tags || '[]'),
          referenceImages: JSON.parse(row.reference_images || '[]'),
          aiGenerated: Boolean(row.ai_generated),
          modelUsed: row.model_used,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    } catch (e) {
      console.error('[DB] Error loading from SQLite:', e);
    }
  } else if (fs.existsSync(JSON_BACKUP_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(JSON_BACKUP_FILE, 'utf-8'));
      if (data.users) data.users.forEach((u: UserAccount) => state.users.set(u.id, u));
      if (data.tracks) data.tracks.forEach((t: Track) => state.tracks.set(t.id, t));
    } catch (e) {
      console.error('[DB] Error loading JSON backup:', e);
    }
  }

  // Ensure default demo user exists
  const defaultUser: UserAccount = {
    id: 'user_studio_1',
    email: 'producer@songforge.studio',
    name: 'SongForge Producer',
    tier: 'free',
    credits: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  if (!state.users.has(defaultUser.id)) {
    saveUser(defaultUser);
  }

  console.log(`[DB] Database ready. Users: ${state.users.size}, Tracks: ${state.tracks.size}`);
}

// User methods
export function getUser(id: string): UserAccount | undefined {
  return state.users.get(id);
}

export function getDefaultUser(): UserAccount {
  const user = state.users.get('user_studio_1');
  if (user) return user;
  const created: UserAccount = {
    id: 'user_studio_1',
    email: 'producer@songforge.studio',
    name: 'SongForge Producer',
    tier: 'free',
    credits: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };
  saveUser(created);
  return created;
}

export function saveUser(user: UserAccount): void {
  state.users.set(user.id, user);

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO users (id, email, name, tier, credits, avatar_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          email=excluded.email,
          name=excluded.name,
          tier=excluded.tier,
          credits=excluded.credits,
          avatar_url=excluded.avatar_url;
      `);
      stmt.run(
        user.id,
        user.email,
        user.name,
        user.tier,
        user.credits,
        user.avatarUrl,
        new Date().toISOString()
      );
    } catch (e) {
      console.error('[DB] SQLite saveUser error:', e);
    }
  }
  saveToDisk();
}

export function deductUserCredits(userId: string, amount: number = 1): boolean {
  const user = state.users.get(userId);
  if (!user) return false;
  if (user.tier === 'studio') return true; // unlimited
  if (user.credits < amount) return false;
  user.credits -= amount;
  saveUser(user);
  return true;
}

export function addUserCredits(userId: string, amount: number): UserAccount | undefined {
  const user = state.users.get(userId);
  if (!user) return undefined;
  user.credits += amount;
  saveUser(user);
  return user;
}

// Track methods
export function getAllTracks(userId?: string): Track[] {
  const tracks = Array.from(state.tracks.values());
  const filtered = userId ? tracks.filter(t => t.userId === userId) : tracks;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTrackById(id: string): Track | undefined {
  return state.tracks.get(id);
}

export function saveTrack(track: Track): void {
  state.tracks.set(track.id, track);

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO tracks (
          id, user_id, title, prompt, genre, mood, instruments, vocal_style,
          bpm, duration, instrumental, language, lyrics, audio_url, format,
          sections_json, versions_json, current_version, is_favorite, tags,
          reference_images, ai_generated, model_used, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title,
          lyrics=excluded.lyrics,
          audio_url=excluded.audio_url,
          sections_json=excluded.sections_json,
          versions_json=excluded.versions_json,
          current_version=excluded.current_version,
          is_favorite=excluded.is_favorite,
          updated_at=excluded.updated_at;
      `);
      stmt.run(
        track.id,
        track.userId,
        track.title,
        track.prompt,
        track.genre,
        track.mood,
        JSON.stringify(track.instruments || []),
        track.vocalStyle,
        track.bpm,
        track.duration,
        track.instrumental ? 1 : 0,
        track.language,
        track.lyrics,
        track.audioUrl,
        track.format,
        JSON.stringify(track.sections || []),
        JSON.stringify(track.versions || []),
        track.currentVersion,
        track.isFavorite ? 1 : 0,
        JSON.stringify(track.tags || []),
        JSON.stringify(track.referenceImages || []),
        track.aiGenerated ? 1 : 0,
        track.modelUsed,
        track.createdAt,
        track.updatedAt
      );
    } catch (e) {
      console.error('[DB] SQLite saveTrack error:', e);
    }
  }
  saveToDisk();
}

export function deleteTrack(id: string): boolean {
  const track = state.tracks.get(id);
  if (!track) return false;
  state.tracks.delete(id);

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM tracks WHERE id = ?');
      stmt.run(id);
    } catch (e) {
      console.error('[DB] SQLite deleteTrack error:', e);
    }
  }
  saveToDisk();
  return true;
}
