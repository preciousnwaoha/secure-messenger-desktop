// src/man/ipcBridge.ts
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { db } from './db';
import { syncServer } from './syncServer';

function assertPositiveInt(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

function assertNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value.trim();
}

export function registerIpcHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CHAT_GET,
    async (_event, params: { limit: number; offset: number }) => {
      assertPositiveInt(params?.limit, 'limit');
      assertPositiveInt(params?.offset, 'offset');

      return db.getChats(Math.min(params.limit, 50), params.offset);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_MESSAGES,
    async (_event, params: { chatId: string; limit: number; offset: number }) => {
      assertNonEmptyString(params?.chatId, 'chatId');
      assertPositiveInt(params?.limit, 'limit');
      assertPositiveInt(params?.offset, 'offset');

      return db.getMessages(params.chatId, Math.min(params.limit, 50), params.offset);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEARCH,
    async (_event, params: { chatId: string; q: string }) => {
      assertNonEmptyString(params?.chatId, 'chatId');
      assertNonEmptyString(params?.q, 'q');

      return db.searchMessages(params.chatId, params.q.slice(0, 200));
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_MARK_READ,
    async (_event, params: { chatId: string }) => {
      assertNonEmptyString(params?.chatId, 'chatId');
      db.markAsRead(params.chatId);
    },
  );

  ipcMain.handle(IPC_CHANNELS.DB_SEED, async () => {
    db.seedIfEmpty();
  });

  ipcMain.handle(IPC_CHANNELS.WS_SIMULATE_DROP, async () => {
    syncServer.simulateDrop();
  });

  ipcMain.handle(IPC_CHANNELS.WS_CONNECTION_STATE, async () => {
    return 'offline' as const;
  });

  ipcMain.handle(IPC_CHANNELS.WS_PORT, async () => {
    return syncServer.getPort();
  });
}
