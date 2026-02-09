import { ReactElement } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useAppSelector } from '../store/hooks';
import {
  selectConnectionStatus,
  selectRetryCount,
} from '../store/connectionSlice';
import { WifiOff } from 'lucide-react';

export function ConnectionStatusBar(): ReactElement | null {
  const status = useAppSelector(selectConnectionStatus);
  const retryCount = useAppSelector(selectRetryCount);

  if (status === 'connected') return null;

  const label =
    status === 'reconnecting'
      ? `Reconnecting (attempt ${retryCount})...`
      : 'Offline';

  return (
    <Alert
      severity="warning"
      sx={{ py: 0, borderRadius: 0 }}
      icon={
        status === 'offline' ? (
          <WifiOff size={16} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={16} color="warning" />
          </Box>
        )
      }
    >
      {label}
    </Alert>
  );
}
