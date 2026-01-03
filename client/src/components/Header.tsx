import { Bell, Globe, Moon, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
}

export default function Header({ title, showSearch, onSearch, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              onChange={e => onSearch?.(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
        )}
        
        {actions}
        
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900">
          <Moon className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900">
          <Globe className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
