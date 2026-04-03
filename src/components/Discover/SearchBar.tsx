import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search podcasts...' }: SearchBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (v.trim().length > 1) onSearch(v.trim());
    }, 400);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center bg-white/10 rounded-xl px-4 py-3">
      <Search size={18} className="text-white/50 shrink-0 mr-3" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
      />
      {value && (
        <button onClick={handleClear} className="text-white/50 hover:text-white ml-2">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
