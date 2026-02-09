import { DBService } from '../db';

let dbService: DBService;

beforeEach(() => {
  dbService = new DBService();
  dbService.init();
});

afterEach(() => {
  dbService.close();
});

describe('seedIfEmpty', () => {
  it('produces exactly 200 chats and >= 20,000 messages', () => {
    dbService.seedIfEmpty();
    const chats = dbService.getChats(300, 0);
    expect(chats).toHaveLength(200);
    expect(dbService.getMessageCount()).toBeGreaterThanOrEqual(20_000);
  });

  it('is idempotent — second call is a no-op', () => {
    dbService.seedIfEmpty();
    const countBefore = dbService.getMessageCount();
    dbService.seedIfEmpty();
    const countAfter = dbService.getMessageCount();
    expect(countAfter).toBe(countBefore);
  });
});

describe('getChats', () => {
  beforeEach(() => {
    dbService.seedIfEmpty();
  });

  it('returns the requested limit', () => {
    const chats = dbService.getChats(10, 0);
    expect(chats).toHaveLength(10);
  });

  it('offset works correctly', () => {
    const first10 = dbService.getChats(10, 0);
    const next10 = dbService.getChats(10, 10);
    const ids1 = first10.map((c) => c.id);
    const ids2 = next10.map((c) => c.id);
    expect(ids1).not.toEqual(ids2);

    const all20 = dbService.getChats(20, 0);
    expect(all20.map((c) => c.id)).toEqual([...ids1, ...ids2]);
  });

  it('is sorted by lastMessageAt DESC', () => {
    const chats = dbService.getChats(50, 0);
    for (let i = 1; i < chats.length; i++) {
      expect(new Date(chats[i - 1].lastMessageAt).getTime())
        .toBeGreaterThanOrEqual(new Date(chats[i].lastMessageAt).getTime());
    }
  });

  it('returns ISO string timestamps', () => {
    const chats = dbService.getChats(1, 0);
    expect(chats[0].lastMessageAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('getMessages', () => {
  beforeEach(() => {
    dbService.seedIfEmpty();
  });

  it('returns messages scoped to chatId', () => {
    const msgs = dbService.getMessages('chat-001', 50, 0);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs.every((m) => m.chatId === 'chat-001')).toBe(true);
  });

  it('is sorted by ts DESC', () => {
    const msgs = dbService.getMessages('chat-001', 50, 0);
    for (let i = 1; i < msgs.length; i++) {
      expect(new Date(msgs[i - 1].ts).getTime())
        .toBeGreaterThanOrEqual(new Date(msgs[i].ts).getTime());
    }
  });

  it('returns ISO string timestamps', () => {
    const msgs = dbService.getMessages('chat-001', 1, 0);
    expect(msgs[0].ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns empty array for nonexistent chat', () => {
    const msgs = dbService.getMessages('nonexistent', 50, 0);
    expect(msgs).toEqual([]);
  });
});

describe('insertMessage', () => {
  beforeEach(() => {
    dbService.seedIfEmpty();
  });

  it('message appears in getMessages', () => {
    const ts = Math.floor(Date.now() / 1000);
    dbService.insertMessage('chat-001', {
      id: 'new-msg-1',
      sender: 'TestUser',
      body: 'Hello world',
      ts,
    });

    const msgs = dbService.getMessages('chat-001', 1, 0);
    expect(msgs[0].id).toBe('new-msg-1');
    expect(msgs[0].sender).toBe('TestUser');
    expect(msgs[0].body).toBe('Hello world');
  });

  it('updates chat lastMessageAt', () => {
    const ts = Math.floor(Date.now() / 1000) + 99999;
    dbService.insertMessage('chat-001', {
      id: 'new-msg-2',
      sender: 'TestUser',
      body: 'Future message',
      ts,
    });

    const chats = dbService.getChats(1, 0);
    expect(chats[0].id).toBe('chat-001');
    expect(new Date(chats[0].lastMessageAt).getTime()).toBe(ts * 1000);
  });

  it('increments unreadCount', () => {
    const chatsBefore = dbService.getChats(200, 0);
    const chat = chatsBefore.find((c) => c.id === 'chat-001');
    expect(chat).toBeDefined();
    const unreadBefore = chat?.unreadCount ?? 0;

    dbService.insertMessage('chat-001', {
      id: 'new-msg-3',
      sender: 'TestUser',
      body: 'Unread test',
      ts: Math.floor(Date.now() / 1000),
    });

    const chatsAfter = dbService.getChats(200, 0);
    const chatAfter = chatsAfter.find((c) => c.id === 'chat-001');
    expect(chatAfter).toBeDefined();
    expect(chatAfter?.unreadCount).toBe(unreadBefore + 1);
  });
});

describe('searchMessages', () => {
  beforeEach(() => {
    dbService.seedIfEmpty();
  });

  it('finds substring matches', () => {
    const results = dbService.searchMessages('chat-001', 'review my PR');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((m) => m.body.includes('review my PR'))).toBe(true);
  });

  it('is capped at 50 results', () => {
    const results = dbService.searchMessages('chat-001', 'a');
    expect(results.length).toBeLessThanOrEqual(50);
  });

  it('is scoped to chatId', () => {
    const results = dbService.searchMessages('chat-001', 'Hey');
    expect(results.every((m) => m.chatId === 'chat-001')).toBe(true);
  });

  it('returns empty for no match', () => {
    const results = dbService.searchMessages('chat-001', 'zzz_no_match_zzz');
    expect(results).toEqual([]);
  });
});
