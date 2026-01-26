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
 <header className="sticky top-0 z-30 bg-white dark:bg-neutral-950 border-b-2 border-neutral-200 dark:border-neutral-800 hidden lg:block shadow-sm">
 <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
 {/* Title */}
 <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{tKey(title)}</h1>
 
 {/* Right Section */}
 <div className="flex items-center gap-3">
 {/* Filter Dropdown */}
 {filterOptions && filterOptions.length > 0 && (
 <div className="relative">
 <select
 value={filterValue}
 onChange={(e) => onFilterChange?.(e.target.value)}
 className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 cursor-pointer transition-all shadow-sm hover:shadow-md"
 >
 {filterOptions.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400 pointer-events-none" />
 </div>
 )}

 {/* Search */}
 {showSearch && (
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 dark:text-neutral-400" />
 <input
 type="text"
 placeholder={tKey("Qidirish...")}
 value={searchQuery}
 onChange={(e) => handleSearch(e.target.value)}
 className="w-48 lg:w-64 pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all shadow-sm"
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
