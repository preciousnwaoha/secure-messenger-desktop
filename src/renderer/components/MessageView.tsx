import { useEffect, useRef, useCallback, ReactElement } from 'react';
import { List, useListRef } from 'react-window';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectSelectedChatId, selectAllChats } from '../store/chatsSlice';
import {
  selectActiveMessages,
  selectMessagesLoading,
  selectHasOlder,
  selectLoadingOlder,
  selectSearchResults,
  selectSearchQuery,
  loadOlderMessages,
} from '../store/messagesSlice';
import { MessageBubble } from './MessageBubble';
import { SearchInput } from './SearchInput';
import { ChevronUp } from 'lucide-react';
import type { Message } from '../../shared/types';

const MESSAGE_ROW_HEIGHT = 72;

export function MessageView(): ReactElement {
  const dispatch = useAppDispatch();
  const selectedChatId = useAppSelector(selectSelectedChatId);
  const chats = useAppSelector(selectAllChats);
  const messages = useAppSelector(selectActiveMessages);
  const loading = useAppSelector(selectMessagesLoading);
  const hasOlder = useAppSelector(selectHasOlder);
  const loadingOlder = useAppSelector(selectLoadingOlder);
  const searchResults = useAppSelector(selectSearchResults);
  const searchQuery = useAppSelector(selectSearchQuery);

  const listRef = useListRef(null);
  const prevMessageCountRef = useRef(0);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const isSearching = searchQuery.trim().length >= 2;
  const displayMessages = isSearching ? searchResults : messages;

  // Auto-scroll to bottom when new messages arrive (not when loading older)
  useEffect(() => {
    if (displayMessages.length > prevMessageCountRef.current) {
      const isLoadOlder =
        displayMessages.length - prevMessageCountRef.current > 1 &&
        prevMessageCountRef.current > 0;
      if (!isLoadOlder && displayMessages.length > 0) {
        listRef.current?.scrollToRow({
          index: displayMessages.length - 1,
          align: 'end',
        });
      }
    }
    prevMessageCountRef.current = displayMessages.length;
  }, [displayMessages.length, listRef]);

  const handleLoadOlder = useCallback(() => {
    if (selectedChatId) {
      void dispatch(loadOlderMessages(selectedChatId));
    }
  }, [dispatch, selectedChatId]);

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-base">
          {selectedChat?.title ?? 'Chat'}
        </h2>
        <div className="w-64">
          <SearchInput />
        </div>
      </div>

      {/* Load older button */}
      {hasOlder && !isSearching && (
        <div className="flex justify-center py-2 bg-gray-50 border-b border-gray-100">
          <button
            onClick={handleLoadOlder}
            disabled={loadingOlder}
            className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            <ChevronUp size={14} />
            {loadingOlder ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading messages...
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {isSearching ? 'No results found' : 'No messages yet'}
          </div>
        ) : (
          <List<{ messages: Message[] }>
            listRef={listRef}
            rowCount={displayMessages.length}
            rowHeight={MESSAGE_ROW_HEIGHT}
            rowComponent={MessageBubble}
            rowProps={{ messages: displayMessages }}
            overscanCount={10}
            style={{ height: '100%' }}
          />
        )}
      </div>
    </div>
  );
}
