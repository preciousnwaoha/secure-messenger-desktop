import { useCallback, useState, useRef, ReactElement } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Search, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  searchMessages,
  setSearchQuery,
} from '../store/messagesSlice';
import { selectSelectedChatId } from '../store/chatsSlice';

export function SearchInput(): ReactElement {
  const dispatch = useAppDispatch();
  const chatId = useAppSelector(selectSelectedChatId);
  const [localValue, setLocalValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      dispatch(setSearchQuery(val));

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (val.trim().length >= 2 && chatId) {
        debounceRef.current = setTimeout(() => {
          void dispatch(searchMessages({ chatId, q: val.trim() }));
        }, 300);
      }
    },
    [dispatch, chatId],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    dispatch(setSearchQuery(''));
  }, [dispatch]);

  return (
    <TextField
      size="small"
      fullWidth
      placeholder="Search messages..."
      value={localValue}
      onChange={handleChange}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
          endAdornment: localValue ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear} edge="end">
                <X size={14} />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
}
