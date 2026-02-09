import { useCallback, useEffect, useState, ReactElement } from 'react';
import { List, useListRef } from 'react-window';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchChats,
  loadMoreChats,
  selectChat,
  markChatAsRead,
  selectAllChats,
  selectSelectedChatId,
  selectChatsLoading,
  selectChatsHasMore,
} from '../store/chatsSlice';
import { fetchMessages, setActiveChatId } from '../store/messagesSlice';
import { ChatListItem } from './ChatListItem';
import type { Chat } from '../../shared/types';

const CHAT_ITEM_HEIGHT = 64;

export function ChatList(): ReactElement {
  const dispatch = useAppDispatch();
  const chats = useAppSelector(selectAllChats);
  const selectedChatId = useAppSelector(selectSelectedChatId);
  const loading = useAppSelector(selectChatsLoading);
  const hasMore = useAppSelector(selectChatsHasMore);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useListRef(null);

  useEffect(() => {
    void dispatch(fetchChats());
  }, [dispatch]);

  const handleSelect = useCallback(
    (chatId: string) => {
      if (chatId === selectedChatId) return;
      dispatch(selectChat(chatId));
      dispatch(setActiveChatId(chatId));
      void dispatch(fetchMessages(chatId));
      void dispatch(markChatAsRead(chatId));
    },
    [dispatch, selectedChatId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = Math.min(prev + 1, chats.length - 1);
          listRef.current?.scrollToRow({ index: next, align: 'smart' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          listRef.current?.scrollToRow({ index: next, align: 'smart' });
          return next;
        });
      } else if (e.key === 'Enter' && focusedIndex >= 0 && chats[focusedIndex]) {
        handleSelect(chats[focusedIndex].id);
      }
    },
    [chats, focusedIndex, handleSelect, listRef],
  );

  const handleRowsRendered = useCallback(
    (
      _visibleRows: { startIndex: number; stopIndex: number },
      allRows: { startIndex: number; stopIndex: number },
    ) => {
      if (hasMore && allRows.stopIndex >= chats.length - 10) {
        void dispatch(loadMoreChats());
      }
    },
    [dispatch, hasMore, chats.length],
  );

  if (loading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading chats...
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="h-full outline-none"
    >
      <List<{
        chats: Chat[];
        selectedChatId: string | null;
        focusedIndex: number;
        onSelect: (chatId: string) => void;
      }>
        listRef={listRef}
        rowCount={chats.length}
        rowHeight={CHAT_ITEM_HEIGHT}
        rowComponent={ChatListItem}
        rowProps={{
          chats,
          selectedChatId,
          focusedIndex,
          onSelect: handleSelect,
        }}
        onRowsRendered={handleRowsRendered}
        overscanCount={5}
        style={{ height: '100%' }}
      />
    </div>
  );
}
