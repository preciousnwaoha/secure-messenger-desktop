import type { CSSProperties, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { Chat } from '../../shared/types';
import { MessageSquare } from 'lucide-react';

interface ChatListItemProps {
  index: number;
  style: CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  chats: Chat[];
  selectedChatId: string | null;
  focusedIndex: number;
  onSelect: (chatId: string) => void;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ChatListItem({
  index,
  style,
  ariaAttributes,
  chats,
  selectedChatId,
  focusedIndex,
  onSelect,
}: ChatListItemProps): ReactElement | null {
  const chat = chats[index];
  if (!chat) return null;

  const isSelected = chat.id === selectedChatId;
  const isFocused = index === focusedIndex;
  const timeStr = formatRelativeTime(chat.lastMessageAt);

  return (
    <Box
      {...ariaAttributes}
      style={style}
      onClick={() => onSelect(chat.id)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        py: 1,
        cursor: 'pointer',
        borderBottom: 1,
        borderColor: 'grey.100',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
        ...(isFocused && {
          outline: '2px solid',
          outlineColor: 'primary.light',
          outlineOffset: -2,
        }),
      }}
    >
      <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.200', mr: 1.5 }}>
        <MessageSquare size={18} color="#9e9e9e" />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {chat.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
            {timeStr}
          </Typography>
        </Box>
      </Box>
      {chat.unreadCount > 0 && (
        <Chip
          size="small"
          color="primary"
          label={chat.unreadCount > 99 ? '99+' : chat.unreadCount}
          sx={{ ml: 1, height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
        />
      )}
    </Box>
  );
}
