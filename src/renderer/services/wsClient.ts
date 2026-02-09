import { store } from '../store';
import {
  connected,
  reconnecting,
  disconnected,
  pongReceived,
} from '../store/connectionSlice';
import { newMessageReceived, markChatAsRead } from '../store/chatsSlice';
import { newMessageAdded, selectActiveChatId } from '../store/messagesSlice';
import { SecurityService } from './securityService';
import type { WsNewMessageEvent } from '../../shared/types';

const HEARTBEAT_INTERVAL = 10_000;
const MAX_BACKOFF = 60_000;
const BASE_DELAY = 1_000;

class WsClient {
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private stopped = false;
  private cachedPort = 0;

  async connect(): Promise<void> {
    this.cleanup();
    this.stopped = false;

    try {
      if (this.cachedPort === 0) {
        this.cachedPort = await window.electron.ws.getPort();
      }

      if (this.cachedPort === 0) {
        console.warn('[wsClient] Server not ready (port 0), scheduling retry');
        this.scheduleReconnect();
        return;
      }

      const ws = new WebSocket(`ws://127.0.0.1:${this.cachedPort}`);

      ws.onopen = () => {
        console.log('[wsClient] Connected');
        this.retryCount = 0;
        store.dispatch(connected());
        this.startHeartbeat();
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(String(event.data)) as { type: string };

          if (data.type === 'pong') {
            store.dispatch(pongReceived());
            return;
          }

          if (data.type === 'new-message') {
            const msg = data as unknown as WsNewMessageEvent;
            console.log(
              `[wsClient] Received message ${msg.messageId} for ${msg.chatId}`,
            );

            const tsIso = new Date(msg.ts * 1000).toISOString();

            // Update chat list: bump lastMessageAt, increment unread
            store.dispatch(
              newMessageReceived({
                chatId: msg.chatId,
                ts: tsIso,
                sender: msg.sender,
              }),
            );

            // If user is viewing this chat, fetch the full message and append
            const activeChatId = selectActiveChatId(store.getState());
            if (activeChatId === msg.chatId) {
              window.electron.db
                .getMessages({ chatId: msg.chatId, limit: 1, offset: 0 })
                .then((msgs) => {
                  if (msgs.length > 0 && msgs[0].id === msg.messageId) {
                    store.dispatch(
                      newMessageAdded({
                        chatId: msg.chatId,
                        message: {
                          ...msgs[0],
                          body: SecurityService.decrypt(msgs[0].body),
                        },
                      }),
                    );
                  }
                })
                .catch(() => {
                  // Message will appear on next fetch
                });

              // Mark as read since user is viewing this chat
              void store.dispatch(markChatAsRead(msg.chatId));
            }
          }
        } catch {
          console.warn('[wsClient] Failed to parse message');
        }
      };

      ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.stopped) {
          console.log('[wsClient] Connection closed, reconnecting...');
          store.dispatch(reconnecting());
          this.scheduleReconnect();
        }
      };

      ws.onerror = () => {
        console.warn('[wsClient] Connection error');
      };

      this.ws = ws;
    } catch (err) {
      console.warn('[wsClient] Failed to connect:', err);
      if (!this.stopped) {
        store.dispatch(reconnecting());
        this.scheduleReconnect();
      }
    }
  }

  stop(): void {
    this.stopped = true;
    this.cleanup();
    store.dispatch(disconnected());
    console.log('[wsClient] Stopped');
  }

  private cleanup(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(MAX_BACKOFF, BASE_DELAY * Math.pow(2, this.retryCount));
    this.retryCount += 1;
    console.log(`[wsClient] Reconnecting in ${delay}ms (attempt ${this.retryCount})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }
}

export const wsClient = new WsClient();
