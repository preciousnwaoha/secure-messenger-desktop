import { useEffect, useRef, useCallback, ReactElement } from 'react';
import { List, useListRef } from 'react-window';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
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
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Select a chat to start messaging</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {selectedChat?.title ?? 'Chat'}
        </Typography>
        <Box sx={{ width: 256 }}>
          <SearchInput />
        </Box>
      </Box>

      {/* Load older button */}
      {hasOlder && !isSearching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'grey.100' }}>
          <Button
            size="small"
            onClick={handleLoadOlder}
            disabled={loadingOlder}
            startIcon={<ChevronUp size={14} />}
          >
            {loadingOlder ? 'Loading...' : 'Load older messages'}
          </Button>
        </Box>
      )}

      {/* Messages area */}
      <Box sx={{ flex: 1, bgcolor: 'grey.50' }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              Loading messages...
            </Typography>
          </Box>
        ) : displayMessages.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              {isSearching ? 'No results found' : 'No messages yet'}
            </Typography>
          </Box>
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
      </Box>
    </Box>
  );
}
