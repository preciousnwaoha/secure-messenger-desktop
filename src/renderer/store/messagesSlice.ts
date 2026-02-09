import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Message } from '../../shared/types';
import type { RootState } from './index';
import { SecurityService } from '../services/securityService';

const PAGE_SIZE = 50;

interface ChatMessages {
  items: Message[];
  hasOlder: boolean;
}

interface MessagesState {
  byChat: Record<string, ChatMessages>;
  activeChatId: string | null;
  loading: boolean;
  loadingOlder: boolean;
  searchResults: Message[];
  searchQuery: string;
}

const initialState: MessagesState = {
  byChat: {},
  activeChatId: null,
  loading: false,
  loadingOlder: false,
  searchResults: [],
  searchQuery: '',
};

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (chatId: string) => {
    const messages = await window.electron.db.getMessages({
      chatId,
      limit: PAGE_SIZE,
      offset: 0,
    });
    return {
      chatId,
      messages: messages.map((m) => ({
        ...m,
        body: SecurityService.decrypt(m.body),
      })),
    };
  },
);

export const loadOlderMessages = createAsyncThunk(
  'messages/loadOlder',
  async (chatId: string, { getState }) => {
    const state = getState() as RootState;
    const existing = state.messages.byChat[chatId];
    const offset = existing ? existing.items.length : 0;
    const messages = await window.electron.db.getMessages({
      chatId,
      limit: PAGE_SIZE,
      offset,
    });
    return {
      chatId,
      messages: messages.map((m) => ({
        ...m,
        body: SecurityService.decrypt(m.body),
      })),
    };
  },
);

export const searchMessages = createAsyncThunk(
  'messages/search',
  async (params: { chatId: string; q: string }) => {
    const results = await window.electron.db.searchMessages(params);
    return results.map((m) => ({
      ...m,
      body: SecurityService.decrypt(m.body),
    }));
  },
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
      state.searchResults = [];
      state.searchQuery = '';
    },
    newMessageAdded(
      state,
      action: PayloadAction<{ chatId: string; message: Message }>,
    ) {
      const { chatId, message } = action.payload;
      const chat = state.byChat[chatId];
      if (chat) {
        chat.items.push(message);
      }
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      if (action.payload === '') {
        state.searchResults = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        // DB returns newest-first; reverse for chronological display
        state.byChat[chatId] = {
          items: messages.reverse(),
          hasOlder: messages.length === PAGE_SIZE,
        };
        state.loading = false;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loadOlderMessages.pending, (state) => {
        state.loadingOlder = true;
      })
      .addCase(loadOlderMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        const chat = state.byChat[chatId];
        if (chat) {
          // Older messages (newest-first from DB), reverse and prepend
          chat.items.unshift(...messages.reverse());
          chat.hasOlder = messages.length === PAGE_SIZE;
        }
        state.loadingOlder = false;
      })
      .addCase(loadOlderMessages.rejected, (state) => {
        state.loadingOlder = false;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  },
});

export const { setActiveChatId, newMessageAdded, setSearchQuery } =
  messagesSlice.actions;

export const selectActiveMessages = (state: RootState): Message[] => {
  const chatId = state.messages.activeChatId;
  if (!chatId) return [];
  return state.messages.byChat[chatId]?.items ?? [];
};
export const selectHasOlder = (state: RootState): boolean => {
  const chatId = state.messages.activeChatId;
  if (!chatId) return false;
  return state.messages.byChat[chatId]?.hasOlder ?? false;
};
export const selectMessagesLoading = (state: RootState): boolean =>
  state.messages.loading;
export const selectLoadingOlder = (state: RootState): boolean =>
  state.messages.loadingOlder;
export const selectSearchResults = (state: RootState): Message[] =>
  state.messages.searchResults;
export const selectSearchQuery = (state: RootState): string =>
  state.messages.searchQuery;
export const selectActiveChatId = (state: RootState): string | null =>
  state.messages.activeChatId;

export default messagesSlice.reducer;
