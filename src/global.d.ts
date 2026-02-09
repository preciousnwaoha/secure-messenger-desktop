// src/global.d.ts
declare global {
  interface ElectronAPI {
    db: {
      getChats(params: { limit: number; offset: number }): Promise<
        {
          id: string;
          title: string;
          lastMessageAt: string;
          unreadCount: number;
        }[]
      >;
      getMessages(params: {
        chatId: string;
        limit: number;
        offset: number;
      }): Promise<
        {
          id: string;
          chatId: string;
          ts: string;
          sender: string;
          body: string;
        }[]
      >;
      searchMessages(params: { chatId: string; q: string }): Promise<
        {
          id: string;
          chatId: string;
          ts: string;
          sender: string;
          body: string;
        }[]
      >;
      markAsRead(params: { chatId: string }): Promise<void>;
      seedDatabase(): Promise<void>;
    };
    ws: {
      simulateDrop(): Promise<void>;
      getConnectionState(): Promise<"connected" | "reconnecting" | "offline">;
      getPort(): Promise<number>;
    };
  }

  interface Window {
    electron: ElectronAPI;
  }

  declare module "*.svg" {
    import { FC, SVGProps } from "react";
    const content: FC<SVGProps<SVGSVGElement>>;
    export default content;
  }
}

export {};
