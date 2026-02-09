# Secure Messenger Desktop

An Electron desktop app simulating a secure messenger client with SQLite persistence, WebSocket real-time sync, virtualized UI, and a security-conscious architecture.

## Quick Start

```bash
npm install
npm start
```

On first launch, click the **database icon** in the sidebar header to seed 200 chats and 20,000+ messages.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the app in development mode |
| `npm test` | Run Jest unit tests |
| `npm run lint` | Run ESLint |
| `npm run package` | Package the app for distribution |
| `npm run make` | Build platform-specific distributables |

## Architecture

### Module Overview

```
src/
├── main/                    # Electron main process
│   ├── db.ts                # SQLite operations (better-sqlite3, WAL, FTS5)
│   ├── security.ts          # SecurityService — encryption boundary
│   ├── syncServer.ts        # WebSocket server simulating real-time messages
│   ├── ipcBridge.ts         # IPC handlers with input validation
│   └── __tests__/           # Unit tests for main-process modules
├── renderer/                # React renderer process
│   ├── components/          # UI components (ChatList, MessageView, etc.)
│   ├── store/               # Redux Toolkit slices (chats, messages, connection)
│   ├── services/            # SecurityService (renderer), wsClient
│   └── __tests__/           # Unit tests for renderer modules
├── shared/                  # Types and constants shared across processes
│   ├── types/index.ts       # Chat, Message, WsNewMessageEvent, etc.
│   └── constants/           # IPC channel names
└── preload.ts               # contextBridge API surface
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Main Process                                               │
│                                                             │
│  SyncServer ──(insert)──► SQLite DB                         │
│      │                        ▲                             │
│      │ WS broadcast           │ IPC (getChats, getMessages) │
│      │ (no body)              │                             │
│      ▼                        │                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ contextBridge ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                             │
│  Renderer Process                                           │
│                                                             │
│  WsClient ──► Redux Store ◄── IPC calls                    │
│                    │                                        │
│                    ▼                                        │
│              React Components (react-window virtualization) │
└─────────────────────────────────────────────────────────────┘
```

1. **SyncServer** generates random messages every 1–3 seconds, inserts them into SQLite, and broadcasts a notification over WebSocket (with the message body intentionally omitted).
2. **WsClient** in the renderer receives the notification, updates the Redux store (chat ordering, unread counts), and fetches the full message from the DB via IPC if the user is viewing that chat.
3. **React components** subscribe to Redux state and re-render. The chat list uses `react-window` virtualization for smooth scrolling over hundreds of items.

### Database

- **Engine**: better-sqlite3 with WAL journaling mode
- **Tables**: `chats` (indexed on `lastMessageAt DESC`), `messages` (indexed on `chatId, ts DESC`)
- **Full-text search**: FTS5 virtual table on `messages.body` with automatic triggers
- **Pagination**: All queries use `LIMIT/OFFSET` (50 per page) — no full table scans

### WebSocket / Connection Health

- **Heartbeat**: Client sends `ping` every 10 seconds; server replies `pong`
- **Reconnection**: Exponential backoff — 1s, 2s, 4s, 8s, … up to 60s max
- **Connection states**: `connected` | `reconnecting` | `offline` (displayed as a status bar)
- **Simulate drop**: Button in the sidebar triggers `ws.close()` on all clients to test reconnection

## Security Architecture

### Encryption Boundary

The `SecurityService` class (`src/main/security.ts`) defines the encryption/decryption boundary for message content. In the current implementation it uses base64 encoding as a placeholder to prove the roundtrip works. In production, this would be replaced with AES-256-GCM.

**Where encryption would be applied:**

- **Before DB write**: `db.insertMessage()` would call `securityService.encrypt(body)` before the `INSERT` statement
- **After DB read**: `db.getMessages()` and `db.searchMessages()` would call `securityService.decrypt(row.body)` on each returned row
- **Renderer boundary**: The renderer's `SecurityService` mirrors this API and would decrypt data received via IPC

This design keeps plaintext confined to the brief window between user input and encryption, and between decryption and display.

### Key Storage

In production, encryption keys would be stored using OS-level secure storage:

| Platform | Mechanism | Electron API |
|----------|-----------|-------------|
| macOS | Keychain | `safeStorage.encryptString()` |
| Windows | DPAPI | `safeStorage.encryptString()` |
| Linux | libsecret / kwallet | `safeStorage.encryptString()` |

Electron's `safeStorage` API encrypts data using the OS credential store, meaning keys are protected by the user's login session and are not accessible to other OS users or processes.

### Anti-Logging Measures

- **`SecurityService.redactBody()`**: All log statements that reference message content must use this method, which replaces the body with `[MESSAGE_CONTENT]`
- **WebSocket broadcasts exclude `body`**: The `SyncServer` intentionally omits the message body from WS payloads (see `syncServer.ts:108-115`). The renderer fetches the full message from the DB via IPC only when needed.
- **Console logs**: All existing `console.log` calls in the codebase reference only message IDs and chat IDs, never message content

### Crash Dump Protection

- **`contextIsolation: true`**: Renderer process cannot access main-process memory, so a renderer crash dump cannot leak encryption keys or plaintext stored in the main process
- **Production hardening**: Disable `crashReporter` or configure it to strip sensitive fields before upload. Electron's crash dumps can contain heap snapshots, so minimizing in-memory plaintext retention is critical.

### DevTools Hardening

In production builds:

- **Electron Fuses**: Set `EnableNodeCliInspectArguments: false` to prevent attaching a debugger via `--inspect` flags
- **Disable DevTools**: Remove `webContents.openDevTools()` calls and block `Ctrl+Shift+I` / `Cmd+Option+I` shortcuts
- The project already uses `@electron/fuses` in `forge.config.ts` for fuse-based hardening

### IPC Input Validation

All IPC handlers in `ipcBridge.ts` validate inputs using `assertNonEmptyString` and type guards before passing them to the database layer. This prevents injection of malformed chat IDs or query strings.

## Trade-offs and Future Improvements

- **Placeholder encryption**: Base64 is not encryption — it's used here to demonstrate the architectural boundary. Production would use `crypto.createCipheriv()` with AES-256-GCM and authenticated encryption.
- **Per-chat keys**: The current design uses a single `SecurityService` instance. A real implementation would derive per-chat keys from a master key using HKDF, enabling selective key rotation.
- **Message search with encryption**: FTS5 cannot search encrypted content. Production options include: (a) searchable encryption schemes, (b) client-side index decrypted on unlock, or (c) accepting that search requires decryption.
- **Key rotation**: No key rotation mechanism exists yet. This would require re-encrypting all messages with the new key, ideally as a background migration.
- **End-to-end encryption**: The current model encrypts at-rest only. True E2E would require key exchange (e.g., Signal Protocol / Double Ratchet) between clients, which is beyond the scope of this prototype.

## Testing

```bash
npm test
```

Tests cover:
- **Database**: Seed correctness (200 chats, 20k+ messages), pagination, search, insert/update
- **SecurityService (main)**: Encrypt/decrypt roundtrip, Unicode handling, empty strings, base64 output verification, `redactBody` placeholder
- **SecurityService (renderer)**: Identity-passthrough roundtrip, `redactBody` placeholder
