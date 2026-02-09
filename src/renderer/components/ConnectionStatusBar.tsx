import { ReactElement } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  selectConnectionStatus,
  selectRetryCount,
} from '../store/connectionSlice';
import { WifiOff, Loader } from 'lucide-react';

export function ConnectionStatusBar(): ReactElement | null {
  const status = useAppSelector(selectConnectionStatus);
  const retryCount = useAppSelector(selectRetryCount);

  if (status === 'connected') return null;

  const icon =
    status === 'offline' ? (
      <WifiOff size={14} />
    ) : (
      <Loader size={14} className="animate-spin" />
    );

  const label =
    status === 'reconnecting'
      ? `Reconnecting (attempt ${retryCount})...`
      : 'Offline';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-100 text-amber-800 border-b border-amber-200">
      {icon}
      <span>{label}</span>
    </div>
  );
}
