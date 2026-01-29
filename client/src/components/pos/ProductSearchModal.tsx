import { useState, useMemo, useEffect } from 'react';
import { Search, X, Package } from 'lucide-react';
import { Product } from '../../types';
import { formatNumber } from '../../utils/format';

interface ProductSearchModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSelect: (product: Product) => void;
 products: Product[];
 title?: string;
 isReturnMode?: boolean;
}

export default function ProductSearchModal({
 isOpen,
 onClose,
 onSelect,
 products,
 title = "Tovar qidirish",
 isReturnMode
}: ProductSearchModalProps) {
 const [searchQuery, setSearchQuery] = useState('');

 // Debug: log when modal opens
 useEffect(() => {
 if (isOpen) {
 console.log('🔍 [MODAL] Opened with', products.length, 'products');
 }
 }, [isOpen, products.length]);

 const filteredProducts = useMemo(() => {
 const query = searchQuery.toLowerCase().trim();
 
 console.log('🔍 [SEARCH] Query:', query, 'Products:', products.length);
 
 if (!query) return products.slice(0, 50);
 
 // Filter products
 const filtered = products.filter(p => 
 p.name.toLowerCase().includes(query) || 
 p.code.toLowerCase().includes(query)
 );
 
 console.log('✅ [SEARCH] Filtered count:', filtered.length);
 
 // Sort with detailed logging
 const sorted = [...filtered].sort((a, b) => {
 const aCode = a.code.toLowerCase();
 const bCode = b.code.toLowerCase();
 
 const aCodeStartsWith = aCode.startsWith(query);
 const bCodeStartsWith = bCode.startsWith(query);
 
 // Priority 1: Kod boshidan boshlanadigan
 if (aCodeStartsWith && !bCodeStartsWith) return -1;
 if (!aCodeStartsWith && bCodeStartsWith) return 1;
 
 // Priority 2: Agar ikkisi ham kod boshidan boshlansa, qisqaroq kod birinchi
 if (aCodeStartsWith && bCodeStartsWith) {
 const lengthDiff = aCode.length - bCode.length;
 if (lengthDiff !== 0) return lengthDiff;
 return aCode.localeCompare(bCode);
 }
 
 // Priority 3: Kod ichida bo'lsa, qisqaroq kod birinchi
 const lengthDiff = aCode.length - bCode.length;
 if (lengthDiff !== 0) return lengthDiff;
 
 // Default: alfabetik
 return aCode.localeCompare(bCode);
 });
 
 console.log('🎯 [SEARCH] First 10 sorted:', sorted.slice(0, 10).map(p => ({ code: p.code, name: p.name })));
 
 return sorted.slice(0, 50);
 }, [products, searchQuery]);

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20 px-4">
 <div className="fixed inset-0 bg-black/50" onClick={onClose} />
 <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
 {/* Header */}
 <div className="p-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
 <h3 className={`font-semibold ${isReturnMode ? 'text-warning-600' : 'text-surface-900'}`}>
 {title}
 </h3>
 <button 
 onClick={onClose}
 className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Search Input */}
 <div className="p-4 border-b border-neutral-100 flex-shrink-0">
 <div className="relative flex items-center">
 <Search className="absolute left-3 w-5 h-5 text-neutral-400 pointer-events-none" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Nom yoki kod bo'yicha qidirish..."
 className="w-full h-12 pl-10 pr-4 bg-white text-neutral-900 placeholder-gray-400 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600 dark:placeholder-gray-500"
 autoFocus
 />
 </div>
 </div>

 {/* Products List - Grid Layout */}
 <div className="flex-1 overflow-auto p-3">
 {filteredProducts.length === 0 ? (
 <div className="py-12 text-center text-surface-400">
 <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
 <p>Tovar topilmadi</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-2">
 {filteredProducts.map(product => (
 <button
 key={product._id}
 onClick={() => {
 onSelect(product);
 setSearchQuery('');
 }}
 className="p-3 text-left bg-white border-2 border-surface-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all"
 >
 <div className="flex items-start gap-2 mb-2">
 <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center flex-shrink-0">
 <Package className="w-5 h-5 text-surface-400" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm text-surface-900 line-clamp-2 leading-tight">{product.name}</p>
 <p className="text-xs text-surface-500 mt-0.5">Kod: {product.code}</p>
 </div>
 </div>
 <div className="space-y-1">
 <p className="font-bold text-sm text-red-600">{formatNumber(product.price)}</p>
 <p className={`text-xs font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
 {product.quantity > 0 ? `${product.quantity} ta` : 'Tugagan'}
 </p>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
