// src/renderer/store/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Chat } from '../../shared/types';
import type { RootState } from './index';

const PAGE_SIZE = 50;

interface ChatsState {
  items: Chat[];
  selectedChatId: string | null;
  hasMore: boolean;
  loading: boolean;
}

const initialState: ChatsState = {
  items: [],
  selectedChatId: null,
  hasMore: true,
  loading: false,
};

export const fetchChats = createAsyncThunk('chats/fetchChats', async () => {
  return window.electron.db.getChats({ limit: PAGE_SIZE, offset: 0 });
});

export const loadMoreChats = createAsyncThunk(
  'chats/loadMoreChats',
  async (_: void, { getState }) => {
    const state = getState() as RootState;
    const offset = state.chats.items.length;
    return window.electron.db.getChats({ limit: PAGE_SIZE, offset });
  },
);

export const markChatAsRead = createAsyncThunk(
  'chats/markAsRead',
  async (chatId: string) => {
    await window.electron.db.markAsRead({ chatId });
    return chatId;
  },
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    selectChat(state, action: PayloadAction<string>) {
      state.selectedChatId = action.payload;
    },
    newMessageReceived(
      state,
      action: PayloadAction<{ chatId: string; ts: string; sender: string }>,
    ) {
      const { chatId, ts } = action.payload;
      const chat = state.items.find((c) => c.id === chatId);
      if (chat) {
        chat.lastMessageAt = ts;
        if (state.selectedChatId !== chatId) {
          chat.unreadCount += 1;
        }
      }
      state.items.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.items = action.payload;
        state.hasMore = action.payload.length === PAGE_SIZE;
        state.loading = false;
      })
      .addCase(fetchChats.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loadMoreChats.fulfilled, (state, action) => {
        state.items.push(...action.payload);
        state.hasMore = action.payload.length === PAGE_SIZE;
      })
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const chat = state.items.find((c) => c.id === action.payload);
        if (chat) {
          chat.unreadCount = 0;
        }
      });
  },
});

export const { selectChat, newMessageReceived } = chatsSlice.actions;

export const selectAllChats = (state: RootState): Chat[] => state.chats.items;
export const selectSelectedChatId = (state: RootState): string | null =>
  state.chats.selectedChatId;
export const selectChatsLoading = (state: RootState): boolean =>
  state.chats.loading;
export const selectChatsHasMore = (state: RootState): boolean =>
  state.chats.hasMore;

export default chatsSlice.reducer;
