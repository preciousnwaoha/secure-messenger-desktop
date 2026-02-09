/** DB row shape — timestamps stored as INTEGER (Unix epoch seconds) */
export interface ChatRow {
  id: string;
  title: string;
  lastMessageAt: number;
  unreadCount: number;
}

/** Renderer shape — timestamps as ISO-8601 strings */
export interface Chat {
  id: string;
  title: string;
  lastMessageAt: string;
  unreadCount: number;
}

/** DB row shape */
export interface MessageRow {
  id: string;
  chatId: string;
  ts: number;
  sender: string;
  body: string;
}

/** Renderer shape */
export interface Message {
  id: string;
  chatId: string;
  ts: string;
  sender: string;
  body: string;
}

/** Input for inserting a new message */
export interface InsertMessageInput {
  id: string;
  sender: string;
  body: string;
  ts: number;
}

/** WS event payload: server -> renderer when a new message is persisted. */
export interface WsNewMessageEvent {
  type: 'new-message';
  chatId: string;
  messageId: string;
  ts: number;
  sender: string;
  // body intentionally excluded for security hygiene
}
