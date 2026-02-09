import type { CSSProperties, ReactElement } from 'react';
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
    <div
      {...ariaAttributes}
      style={style}
      className={`flex items-center px-3 py-2 cursor-pointer border-b border-gray-100 ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      } ${isFocused ? 'ring-2 ring-inset ring-blue-300' : ''}`}
      onClick={() => onSelect(chat.id)}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
        <MessageSquare size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="font-medium text-sm truncate">{chat.title}</span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {timeStr}
          </span>
        </div>
      </div>
      {chat.unreadCount > 0 && (
        <span className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
        </span>
      )}
    </div>
  );
}
