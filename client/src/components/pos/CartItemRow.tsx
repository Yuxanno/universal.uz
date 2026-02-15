import { memo, useCallback, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../../types';
import ProductNameDisplay from '../shared/ProductNameDisplay';

interface CartItemRowProps {
 item: CartItem;
 localPrice: string | undefined;
 localName: string | undefined;
 isSelected: boolean;
 onQuantityChange: (id: string, quantity: number) => void;
 onPriceChange: (id: string, price: string) => void;
 onNameChange: (id: string, name: string) => void;
 onRemove: (id: string) => void;
 onClick: (id: string) => void;
 showAlert?: (message: string, title: string, type: 'success' | 'danger' | 'warning') => void;
 showToast?: (title: string, message: string) => void;
}

const CartItemRow = memo(({
 item,
 localPrice,
 localName,
 isSelected,
 onQuantityChange,
 onPriceChange,
 onNameChange,
 onRemove,
 onClick,
 showToast
}: CartItemRowProps) => {
 const [editingName, setEditingName] = useState(false);
 const [tempName, setTempName] = useState('');
 
 const handleNameDoubleClick = useCallback((e: React.MouseEvent) => {
 e.stopPropagation();
 const currentName = localName !== undefined ? localName : item.name;
 setTempName(currentName);
 setEditingName(true);
 }, [localName, item.name]);
 
 const handleNameBlur = useCallback(() => {
 if (tempName.trim()) {
 onNameChange(item._id, tempName.trim());
 }
 setEditingName(false);
 }, [tempName, item._id, onNameChange]);
 
 const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
 const val = e.target.value;
 if (val === '' || /^\d+$/.test(val)) {
 onQuantityChange(item._id, val === '' ? 0 : parseInt(val));
 }
 }, [item._id, onQuantityChange]);

 const handleQuantityBlur = useCallback(() => {
 if (item.cartQuantity === 0 || !item.cartQuantity) {
 onRemove(item._id);
 }
 }, [item.cartQuantity, item._id, onRemove]);

 const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
 const val = e.target.value.replace(/\s/g, '');
 if (val === '' || /^\d+$/.test(val)) {
 onPriceChange(item._id, val);
 }
 }, [item._id, onPriceChange]);

 const handlePriceBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
 const val = e.target.value.replace(/\s/g, '');
 const newPrice = val === '' ? 0 : parseInt(val);
 
 // Проверка на tan_narx для кассира только при выходе из инпута
 if (newPrice > 0 && item.tan_narx && newPrice < item.tan_narx) {
 // Автоматически поднимаем цену до tan_narx
 onPriceChange(item._id, String(item.tan_narx));
 
 // Показываем toast уведомление
 showToast?.(
 'Narx avtomatik ko\'tarildi',
 `Narx tan narxdan past bo'lgani uchun ${item.tan_narx.toLocaleString()} so'mga ko'tarildi`
 );
 }
 }, [item._id, item.tan_narx, onPriceChange, showToast]);

 const handleRemoveClick = useCallback((e: React.MouseEvent) => {
 e.stopPropagation();
 onRemove(item._id);
 }, [item._id, onRemove]);

 const handleRowClick = useCallback(() => {
 onClick(item._id);
 }, [item._id, onClick]);

 const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
 const totalPrice = price * item.cartQuantity;
 const remainingStock = (item.quantity || 0) - item.cartQuantity;
 const isInsufficientStock = remainingStock < 0;

 return (
 <>
 {/* Desktop: Table Row Layout */}
 <div
 className={`hidden md:grid px-4 py-3 items-center transition-all ${
 editingName ? 'grid-cols-1' : 'grid-cols-12'
 } ${
 isInsufficientStock
 ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 shadow-md'
 : isSelected
 ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 shadow-sm'
 : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
 }`}
 style={{ gap: '0.5rem' }}
 >
 {editingName ? (
 <input
 type="text"
 value={tempName}
 onChange={(e) => setTempName(e.target.value)}
 onBlur={handleNameBlur}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.currentTarget.blur();
 }
 if (e.key === 'Escape') {
 setEditingName(false);
 setTempName('');
 }
 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full px-3 py-2 text-sm font-bold border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-neutral-700 text-slate-900 dark:text-neutral-100"
 autoFocus
 />
 ) : (
 <>
 <div className="col-span-1">
 <span className="text-xs font-mono font-bold text-slate-900 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
 {item.code}
 </span>
 </div>
 <div className="col-span-2 min-w-0">
 <div 
 className="text-xs font-bold text-slate-900 dark:text-neutral-100 break-words leading-tight cursor-pointer hover:text-blue-600 transition-colors select-none"
 onDoubleClick={handleNameDoubleClick}
 title="Nomni tahrirlash uchun ikki marta bosing"
 >
 <ProductNameDisplay 
 name={localName !== undefined ? localName : item.name}
 hidePrice={true}
 />
 </div>
 </div>
 <div className="col-span-1 text-center">
 <div className="flex flex-col items-center gap-1">
 <span className={`text-xs font-bold ${isInsufficientStock ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-neutral-100'}`}>
 {remainingStock} ta
 </span>
 {isInsufficientStock && (
 <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
 Yetmaydi!
 </span>
 )}
 </div>
 </div>
 <div className="col-span-1 text-right" style={{ marginRight: '0.75rem' }}>
 <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">{((item as any).costPrice || 0).toLocaleString()}</span>
 </div>
 <div 
 className="col-span-1 flex items-center justify-center" 
 style={{ marginLeft: '0.75rem' }}
 >
 <input
 type="text"
 value={item.cartQuantity}
 onChange={handleQuantityChange}
 onBlur={handleQuantityBlur}
 onFocus={(e) => e.currentTarget.select()}
 readOnly={false}
 tabIndex={0}
 className="w-16 h-10 text-center font-bold text-base border-2 border-slate-300 dark:border-neutral-600 dark:bg-neutral-700 text-slate-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-white cursor-text"
 />
 </div>
 <div 
 className="col-span-2 text-right" 
 style={{ marginLeft: '-0.25rem' }}
 >
 <input
 type="text"
 value={localPrice !== undefined ? localPrice : item.price.toLocaleString()}
 onChange={handlePriceChange}
 onBlur={handlePriceBlur}
 onFocus={(e) => e.currentTarget.select()}
 readOnly={false}
 tabIndex={0}
 className="w-24 h-10 text-right text-sm font-bold border-2 border-slate-300 dark:border-neutral-600 dark:bg-neutral-700 text-slate-900 dark:text-neutral-100 rounded-lg px-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-white cursor-text"
 />
 </div>
 <div className="col-span-2 text-right" style={{ marginLeft: '-2.5rem' }}>
 <span className="text-base font-black text-slate-900 dark:text-neutral-100">
 {totalPrice.toLocaleString()}
 </span>
 </div>
 <div className="col-span-2 flex justify-center" style={{ marginLeft: '-1rem' }}>
 <button
 onClick={handleRemoveClick}
 className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-110"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </>
 )}
 </div>

 {/* Mobile: Card Layout - NO HORIZONTAL SCROLL */}
 <div
 onClick={handleRowClick}
 className={`md:hidden mx-1 my-2 rounded-xl border-2 transition-all shadow-sm overflow-hidden max-w-full ${
 isInsufficientStock
 ? 'bg-red-100 dark:bg-red-900/30 border-red-600 shadow-md'
 : isSelected
 ? 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-md'
 : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 active:bg-neutral-50 dark:active:bg-neutral-700/50'
 }`}
 >
 {/* Card Header */}
 <div className="flex items-start justify-between p-3 pb-2 border-b border-neutral-100 dark:border-neutral-700 gap-2">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <span className="inline-block text-xs font-mono font-bold text-slate-900 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded whitespace-nowrap">
 {item.code}
 </span>
 <span className={`text-xs font-semibold whitespace-nowrap ${isInsufficientStock ? 'text-red-600 dark:text-red-400 font-black' : 'text-neutral-500 dark:text-neutral-400'}`}>
 {remainingStock} ta {isInsufficientStock && '⚠️'}
 </span>
 {isInsufficientStock && (
 <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-200 dark:bg-red-900/50 px-2 py-0.5 rounded whitespace-nowrap">
 Yetmaydi!
 </span>
 )}
 </div>
 <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 leading-tight line-clamp-2 break-words">
 <ProductNameDisplay 
 name={item.name}
 hidePrice={true}
 />
 </h3>
 </div>
 <button
 onClick={handleRemoveClick}
 className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all active:scale-95"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 {/* Card Body */}
 <div className="p-3 space-y-2">
 {/* Soni va Narx - Bir qatorda, ixcham */}
 <div className="flex items-end justify-between gap-2">
 {/* Quantity Stepper - Kompakt */}
 <div className="space-y-0.5">
 <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block">Soni:</span>
 <div className="flex items-center gap-1">
 <button
 onClick={(e) => {
 e.stopPropagation();
 const newQty = item.cartQuantity - 1;
 if (newQty <= 0) {
 onRemove(item._id);
 } else {
 onQuantityChange(item._id, newQty);
 }
 }}
 className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-base transition-all active:scale-95 shadow-sm"
 >
 <span className="leading-none">−</span>
 </button>
 <input
 type="text"
 value={item.cartQuantity}
 onChange={handleQuantityChange}
 onBlur={handleQuantityBlur}
 onClick={(e) => e.stopPropagation()}
 onFocus={(e) => e.currentTarget.select()}
 readOnly={false}
 tabIndex={0}
 className="w-12 h-8 text-center text-sm font-black border-2 border-slate-300 dark:border-neutral-600 dark:bg-neutral-700 text-slate-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white cursor-text"
 />
 <button
 onClick={(e) => {
 e.stopPropagation();
 onQuantityChange(item._id, item.cartQuantity + 1);
 }}
 className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-base transition-all active:scale-95 shadow-sm"
 >
 <span className="leading-none">+</span>
 </button>
 </div>
 </div>

 {/* Price Input */}
 <div className="flex-1 space-y-0.5">
 <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block">Narx:</span>
 <input
 type="text"
 value={localPrice !== undefined ? localPrice : item.price.toLocaleString()}
 onChange={handlePriceChange}
 onBlur={handlePriceBlur}
 onMouseDown={(e) => {
 e.stopPropagation();
 }}
 onClick={(e) => {
 e.stopPropagation();
 e.currentTarget.focus();
 e.currentTarget.select();
 }}
 onFocus={(e) => e.currentTarget.select()}
 readOnly={false}
 tabIndex={0}
 className="w-full h-8 text-left text-sm font-bold border-2 border-slate-300 dark:border-neutral-600 dark:bg-neutral-700 text-slate-900 dark:text-neutral-100 rounded-lg px-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all bg-white cursor-text"
 />
 </div>
 </div>

 {/* Total - Pastda */}
 <div className="flex items-center justify-between pt-2 border-t-2 border-neutral-200 dark:border-neutral-700">
 <span className="text-sm font-bold text-neutral-700 dark:text-neutral-400">JAMI:</span>
 <span className="text-lg font-black text-slate-900 dark:text-neutral-100">
 {totalPrice.toLocaleString()} <span className="text-xs">so'm</span>
 </span>
 </div>
 </div>
 </div>
 </>
 );
});

CartItemRow.displayName = 'CartItemRow';

export default CartItemRow;
