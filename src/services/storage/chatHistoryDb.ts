import * as SQLite from 'expo-sqlite';
import { ChatSession, ChatMessage } from '@/types/reports';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getChatDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gympulse_reports.db');
    await dbInstance.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_query TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls_json TEXT,
        raw_metrics_json TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      );
    `);
  }
  return dbInstance;
}

export async function createChatSession(id: string, title: string, initialQuery: string): Promise<ChatSession> {
  const db = await getChatDb();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO chat_sessions (id, title, created_at, last_query) VALUES (?, ?, ?, ?)',
    [id, title, now, initialQuery]
  );
  return { id, title, created_at: now, last_query: initialQuery };
}

export async function getAllSessions(): Promise<ChatSession[]> {
  const db = await getChatDb();
  const rows = await db.getAllAsync<ChatSession>(
    'SELECT * FROM chat_sessions ORDER BY created_at DESC'
  );
  return rows;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await getChatDb();
  const rows = await db.getAllAsync<ChatMessage>(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );
  return rows;
}

export async function insertMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCallsJson?: string,
  rawMetricsJson?: string
): Promise<ChatMessage> {
  const db = await getChatDb();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = Date.now();
  
  await db.runAsync(
    `INSERT INTO chat_messages (id, session_id, role, content, tool_calls_json, raw_metrics_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, sessionId, role, content, toolCallsJson || null, rawMetricsJson || null, now]
  );

  return {
    id,
    session_id: sessionId,
    role,
    content,
    tool_calls_json: toolCallsJson,
    raw_metrics_json: rawMetricsJson,
    created_at: now,
  };
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const db = await getChatDb();
  await db.runAsync('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);
}
