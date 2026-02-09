import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';

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

      // TODO: replace stub — use Math.min(params.limit, 50) and params.offset
      return [] as { id: string; title: string; lastMessageAt: string; unreadCount: number }[];
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_MESSAGES,
    async (_event, params: { chatId: string; limit: number; offset: number }) => {
      assertNonEmptyString(params?.chatId, 'chatId');
      assertPositiveInt(params?.limit, 'limit');
      assertPositiveInt(params?.offset, 'offset');

      // TODO: replace stub — use chatId, Math.min(params.limit, 50), params.offset
      return [] as { id: string; chatId: string; ts: string; sender: string; body: string }[];
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEARCH,
    async (_event, params: { chatId: string; q: string }) => {
      assertNonEmptyString(params?.chatId, 'chatId');
      assertNonEmptyString(params?.q, 'q');

      // TODO: replace stub — use chatId, q.slice(0, 200)
      return [] as { id: string; chatId: string; ts: string; sender: string; body: string }[];
    },
  );

  ipcMain.handle(IPC_CHANNELS.DB_SEED, async () => {
    // TODO: replace with actual seed routine
  });

  ipcMain.handle(IPC_CHANNELS.WS_SIMULATE_DROP, async () => {
    // TODO: replace with actual WS disconnect
  });

  ipcMain.handle(IPC_CHANNELS.WS_CONNECTION_STATE, async () => {
    // TODO: replace with actual WS state query
    return 'offline' as const;
  });
}
