import { useCallback, useState, useRef, ReactElement } from 'react';
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
    <div className="relative">
      <Search
        size={14}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Search messages..."
        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
