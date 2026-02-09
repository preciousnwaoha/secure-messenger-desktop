import type { CSSProperties, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
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
    <Box {...ariaAttributes} style={style}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          px: 2,
          py: 0.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: '70%',
            px: 1.5,
            py: 1,
            borderRadius: 2,
            borderBottomRightRadius: isMe ? 0 : 8,
            borderBottomLeftRadius: isMe ? 8 : 0,
            bgcolor: isMe ? 'primary.main' : 'grey.100',
            color: isMe ? 'primary.contrastText' : 'text.primary',
          }}
        >
          {!isMe && (
            <Typography variant="caption" fontWeight={600} color="primary">
              {message.sender}
            </Typography>
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.body}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: 10,
              mt: 0.5,
              textAlign: 'right',
              display: 'block',
              color: isMe ? 'primary.light' : 'text.secondary',
            }}
          >
            {time}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
