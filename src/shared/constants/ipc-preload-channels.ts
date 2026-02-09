export const IPC_CHANNELS = {
  CHAT_GET: 'chat:get',
  CHAT_MESSAGES: 'chat:messages',
  CHAT_SEARCH: 'chat:search',
  DB_SEED: 'db:seed',
  WS_SIMULATE_DROP: 'ws:simulate-drop',
  WS_CONNECTION_STATE: 'ws:connection-state',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
