// src/main/syncServer.ts
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import type { InsertMessageInput } from "../shared/types";

const SENDERS = ["Alice", "Bob", "Charlie", "Diana", "Eve"] as const;

const CANNED_PHRASES = [
  "Hey, how are you?",
  "Did you see the latest update?",
  "Meeting at 3pm today.",
  "Can you review my PR?",
  "Sounds good, let me check.",
  "I will get back to you shortly.",
  "Thanks for the heads up!",
  "Let me know if you need anything.",
  "Working on it now.",
  "Sure, I can help with that.",
  "On my way!",
  "Just finished the report.",
  "Good morning!",
  "See you tomorrow.",
  "Got it, thanks!",
] as const;

function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

class SyncServer {
  private wss: WebSocketServer | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private port = 0;
  private chatIds: string[] = [];

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: 0, host: "127.0.0.1" });

      this.wss.on("connection", (ws) => {
        ws.on("message", (raw) => {
          try {
            const data = JSON.parse(
              typeof raw === "string" ? raw : raw.toString(),
            ) as { type: string };
            if (data.type === "ping") {
              ws.send(JSON.stringify({ type: "pong" }));
            }
          } catch {
            // ignore malformed messages
          }
        });
      });

      this.wss.on("listening", () => {
        const addr = this.wss?.address();
        if (typeof addr === "object" && addr !== null) {
          this.port = addr.port;
        }

        const chats = db.getChats(200, 0);
        this.chatIds = chats.map((c) => c.id);

        this.scheduleNext();

        console.log(`[SyncServer] Listening on port ${this.port}`);
        resolve(this.port);
      });

      this.wss.on("error", (err) => {
        reject(err);
      });
    });
  }

  private scheduleNext(): void {
    const delay = 1000 + Math.random() * 2000;
    this.timer = setTimeout(() => {
      this.emitMessage();
      this.scheduleNext();
    }, delay);
  }

  private emitMessage(): void {
    if (this.chatIds.length === 0) {
      const chats = db.getChats(200, 0);
      this.chatIds = chats.map((c) => c.id);
      if (this.chatIds.length === 0) return;
    }

    const chatId =
      this.chatIds[Math.floor(Math.random() * this.chatIds.length)];
    const sender = SENDERS[Math.floor(Math.random() * SENDERS.length)];
    const body =
      CANNED_PHRASES[Math.floor(Math.random() * CANNED_PHRASES.length)];

    const msg: InsertMessageInput = {
      id: `sync-${Date.now()}-${randomHex(6)}`,
      sender,
      body,
      ts: Math.floor(Date.now() / 1000),
    };

    db.insertMessage(chatId, msg);

    const payload = JSON.stringify({
      type: "new-message",
      chatId,
      messageId: msg.id,
      ts: msg.ts,
      sender: msg.sender,
      // body intentionally omitted — renderer fetches from DB via IPC
    });

    this.wss?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    console.log(`[SyncServer] Emitted message ${msg.id} to ${chatId}`);
  }

  simulateDrop(): void {
    this.wss?.clients.forEach((client) => client.close());
    console.log("[SyncServer] Simulated connection drop");
  }

  getPort(): number {
    return this.port;
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.port = 0;
  }
}

export const syncServer = new SyncServer();
