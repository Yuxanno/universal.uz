import { Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface FilterOption {
  value: string;
  label: string;
}

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
}

export default function Header({ title, showSearch, onSearch, actions, filterOptions, filterValue, onFilterChange }: HeaderProps) {
  const { tKey } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-gray-200 hidden lg:block">
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Title */}
        <h1 className="text-lg font-semibold text-slate-900">{tKey(title)}</h1>
        
        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          {filterOptions && filterOptions.length > 0 && (
            <div className="relative">
              <select
                value={filterValue}
                onChange={(e) => onFilterChange?.(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 cursor-pointer transition-all"
              >
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={tKey("Qidirish...")}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-48 lg:w-64 pl-9 pr-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
              />
            </div>
          )}
          
          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
