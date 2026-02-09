import type { CSSProperties, ReactElement } from 'react';
import type { Message } from '../../shared/types';

interface MessageBubbleProps {
  index: number;
  style: CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  messages: Message[];
}

export function MessageBubble({
  index,
  style,
  ariaAttributes,
  messages,
}: MessageBubbleProps): ReactElement | null {
  const message = messages[index];
  if (!message) return null;

  const isMe = message.sender === 'me';
  const time = new Date(message.ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div {...ariaAttributes} style={style}>
      <div
        className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-4 py-1`}
      >
        <div
          className={`max-w-[70%] rounded-lg px-3 py-2 ${
            isMe
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          {!isMe && (
            <div className="text-xs font-semibold text-blue-600 mb-0.5">
              {message.sender}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.body}
          </p>
          <div
            className={`text-[10px] mt-1 ${
              isMe ? 'text-blue-100' : 'text-gray-400'
            } text-right`}
          >
            {time}
          </div>
        </div>
      </div>
    </div>
  );
}
