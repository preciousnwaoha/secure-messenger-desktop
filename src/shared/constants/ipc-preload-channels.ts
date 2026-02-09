export const IPC_CHANNELS = {
  CHAT_GET: 'chat:get',
  CHAT_MESSAGES: 'chat:messages',
  CHAT_SEARCH: 'chat:search',
  CHAT_MARK_READ: 'chat:mark-read',
  DB_SEED: 'db:seed',
  WS_SIMULATE_DROP: 'ws:simulate-drop',
  WS_CONNECTION_STATE: 'ws:connection-state',
  WS_PORT: 'ws:port',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
