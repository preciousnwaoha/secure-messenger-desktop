import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/constants';

const api: ElectronAPI = {
  db: {
    getChats: (params: { limit: number; offset: number }) =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_GET, params),
    getMessages: (params: { chatId: string; limit: number; offset: number }) =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_MESSAGES, params),
    searchMessages: (params: { chatId: string; q: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEARCH, params),
    seedDatabase: () => ipcRenderer.invoke(IPC_CHANNELS.DB_SEED),
  },
  ws: {
    simulateDrop: () => ipcRenderer.invoke(IPC_CHANNELS.WS_SIMULATE_DROP),
    getConnectionState: () => ipcRenderer.invoke(IPC_CHANNELS.WS_CONNECTION_STATE),
  },
};

contextBridge.exposeInMainWorld('electron', api);
