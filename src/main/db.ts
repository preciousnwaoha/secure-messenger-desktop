import Database from 'better-sqlite3';
import type { Chat, ChatRow, InsertMessageInput, Message, MessageRow } from '../shared/types';

export class DBService {
  private db: Database.Database | null = null;
  private ftsAvailable = false;

  private stmtGetChats!: Database.Statement;
  private stmtGetMessages!: Database.Statement;
  private stmtInsertMessage!: Database.Statement;
  private stmtUpdateChatLastMessage!: Database.Statement;
  private stmtIncrementUnread!: Database.Statement;
  private stmtSearchFts!: Database.Statement | null;
  private stmtSearchLike!: Database.Statement;
  private stmtChatCount!: Database.Statement;
  private stmtMessageCount!: Database.Statement;

  init(dbPath?: string): void {
    this.db = new Database(dbPath ?? ':memory:');
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.createSchema();
    this.attemptFts();
    this.prepareStatements();
  }

  private createSchema(): void {
    const db = this.getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        lastMessageAt INTEGER NOT NULL,
        unreadCount INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        ts INTEGER NOT NULL,
        sender TEXT NOT NULL,
        body TEXT NOT NULL,
        FOREIGN KEY(chatId) REFERENCES chats(id)
      );
      CREATE INDEX IF NOT EXISTS idx_chats_lastMessageAt ON chats(lastMessageAt DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_chat_ts ON messages(chatId, ts DESC);
    `);
  }

  private attemptFts(): void {
    const db = this.getDb();
    try {
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
          USING fts5(body, content='messages', content_rowid='rowid');

        CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
          INSERT INTO messages_fts(rowid, body) VALUES (new.rowid, new.body);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
          INSERT INTO messages_fts(messages_fts, rowid, body) VALUES('delete', old.rowid, old.body);
        END;

        CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
          INSERT INTO messages_fts(messages_fts, rowid, body) VALUES('delete', old.rowid, old.body);
          INSERT INTO messages_fts(rowid, body) VALUES (new.rowid, new.body);
        END;
      `);
      this.ftsAvailable = true;
    } catch {
      this.ftsAvailable = false;
    }
  }

  private prepareStatements(): void {
    const db = this.getDb();

    this.stmtGetChats = db.prepare(
      'SELECT id, title, lastMessageAt, unreadCount FROM chats ORDER BY lastMessageAt DESC LIMIT ? OFFSET ?'
    );

    this.stmtGetMessages = db.prepare(
      'SELECT id, chatId, ts, sender, body FROM messages WHERE chatId = ? ORDER BY ts DESC LIMIT ? OFFSET ?'
    );

    this.stmtInsertMessage = db.prepare(
      'INSERT INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)'
    );

    this.stmtUpdateChatLastMessage = db.prepare(
      'UPDATE chats SET lastMessageAt = ? WHERE id = ? AND lastMessageAt < ?'
    );

    this.stmtIncrementUnread = db.prepare(
      'UPDATE chats SET unreadCount = unreadCount + 1 WHERE id = ?'
    );

    if (this.ftsAvailable) {
      this.stmtSearchFts = db.prepare(
        `SELECT m.id, m.chatId, m.ts, m.sender, m.body
         FROM messages_fts AS f
         JOIN messages AS m ON m.rowid = f.rowid
         WHERE f.body MATCH ? AND m.chatId = ?
         LIMIT 50`
      );
    } else {
      this.stmtSearchFts = null;
    }

    this.stmtSearchLike = db.prepare(
      `SELECT id, chatId, ts, sender, body
       FROM messages
       WHERE chatId = ? AND body LIKE ?
       LIMIT 50`
    );

    this.stmtChatCount = db.prepare('SELECT COUNT(*) AS count FROM chats');
    this.stmtMessageCount = db.prepare('SELECT COUNT(*) AS count FROM messages');
  }

  private getDb(): Database.Database {
    if (!this.db) {
      throw new Error('DBService not initialized — call init() first');
    }
    return this.db;
  }

  /** Simple deterministic 32-bit PRNG (mulberry32). */
  private static prng(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  seedIfEmpty(): void {
    const db = this.getDb();
    const { count } = this.stmtChatCount.get() as { count: number };
    if (count > 0) return;

    const rand = DBService.prng(42);

    const otherSenders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const firstNames = [
      'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace',
      'Hector', 'Ivy', 'Jack', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia',
    ];
    const groupNames = [
      'Project Alpha', 'Backend Team', 'Design Review', 'Standup Notes',
      'Launch Planning', 'Bug Triage', 'Coffee Chat', 'Book Club',
      'Travel Plans', 'Game Night', 'Fitness Goals', 'Music Recs',
    ];

    const bodies = [
      'Hey, how are you?',
      'Did you see the latest update?',
      'Meeting at 3pm today.',
      'Can you review my PR?',
      'Sounds good, let me check.',
      'I will get back to you shortly.',
      'Thanks for the heads up!',
      'Let me know if you need anything.',
      'Working on it now.',
      'Sure, I can help with that.',
      'On my way!',
      'Just finished the report.',
      'Good morning!',
      'See you tomorrow.',
      'Got it, thanks!',
    ];

    const chatCount = 200;
    const now = Math.floor(Date.now() / 1000);

    // Distribute 20,000+ messages unevenly: each chat gets 20–200 messages.
    const weights = Array.from({ length: chatCount }, () => 20 + Math.floor(rand() * 181));
    const rawTotal = weights.reduce((a, b) => a + b, 0);
    const scale = Math.max(1, 20_000 / rawTotal);
    const messageCounts = weights.map((w) => Math.max(20, Math.round(w * scale)));

    const insertChat = db.prepare(
      'INSERT INTO chats (id, title, lastMessageAt, unreadCount) VALUES (?, ?, ?, ?)'
    );
    const insertMsg = db.prepare(
      'INSERT INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)'
    );
    const updateChatTs = db.prepare(
      'UPDATE chats SET lastMessageAt = ? WHERE id = ?'
    );

    let totalMessages = 0;

    const txn = db.transaction(() => {
      for (let c = 0; c < chatCount; c++) {
        const chatId = `chat-${String(c + 1).padStart(3, '0')}`;

        // Realistic title: ~60% DM-style, ~40% group-style
        const title = rand() < 0.6
          ? firstNames[Math.floor(rand() * firstNames.length)]
          : groupNames[Math.floor(rand() * groupNames.length)];

        const msgCount = messageCounts[c];
        // Insert chat first (FK requires it), with placeholder timestamp
        insertChat.run(chatId, title, 0, 0);

        // Spread messages over recent time, random gaps of 30s–300s
        let ts = now - Math.floor(rand() * 7 * 86400); // start up to 7 days ago
        let lastTs = ts;

        for (let m = 0; m < msgCount; m++) {
          ts += 30 + Math.floor(rand() * 271); // 30–300s gap
          const msgId = `msg-${chatId}-${String(m).padStart(4, '0')}`;
          const sender = rand() < 0.4
            ? 'me'
            : otherSenders[Math.floor(rand() * otherSenders.length)];
          const body = bodies[Math.floor(rand() * bodies.length)];
          insertMsg.run(msgId, chatId, ts, sender, body);
          lastTs = ts;
        }

        updateChatTs.run(lastTs, chatId);
        totalMessages += msgCount;
      }
    });

    txn();
    console.log(`[DBService] Seeded ${chatCount} chats, ${totalMessages} messages`);
  }

  getChats(limit: number, offset: number): Chat[] {
    const rows = this.stmtGetChats.all(limit, offset) as ChatRow[];
    return rows.map((row) => ({
      ...row,
      lastMessageAt: new Date(row.lastMessageAt * 1000).toISOString(),
    }));
  }

  getMessages(chatId: string, limit: number, offset: number): Message[] {
    const rows = this.stmtGetMessages.all(chatId, limit, offset) as MessageRow[];
    return rows.map((row) => ({
      ...row,
      ts: new Date(row.ts * 1000).toISOString(),
    }));
  }

  insertMessage(chatId: string, msg: InsertMessageInput): void {
    const db = this.getDb();
    const txn = db.transaction(() => {
      this.stmtInsertMessage.run(msg.id, chatId, msg.ts, msg.sender, msg.body);
      this.stmtUpdateChatLastMessage.run(msg.ts, chatId, msg.ts);
      this.stmtIncrementUnread.run(chatId);
    });
    txn();
    console.log(`[DBService] Inserted message ${msg.id} into ${chatId}`);
  }

  searchMessages(chatId: string, q: string): Message[] {
    let rows: MessageRow[] = [];

    if (this.ftsAvailable && this.stmtSearchFts) {
      try {
        const escaped = '"' + q.replace(/"/g, '""') + '"';
        rows = this.stmtSearchFts.all(escaped, chatId) as MessageRow[];
      } catch {
        rows = this.fallbackSearch(chatId, q);
      }
    } else {
      rows = this.fallbackSearch(chatId, q);
    }

    return rows.map((row) => ({
      ...row,
      ts: new Date(row.ts * 1000).toISOString(),
    }));
  }

  private fallbackSearch(chatId: string, q: string): MessageRow[] {
    return this.stmtSearchLike.all(chatId, `%${q}%`) as MessageRow[];
  }

  getMessageCount(): number {
    const { count } = this.stmtMessageCount.get() as { count: number };
    return count;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const db = new DBService();
