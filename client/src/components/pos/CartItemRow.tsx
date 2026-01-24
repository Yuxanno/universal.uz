import { memo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { CartItem } from '../../types';

interface CartItemRowProps {
  item: CartItem;
  localPrice: string | undefined;
  isSelected: boolean;
  onQuantityChange: (id: string, quantity: number) => void;
  onPriceChange: (id: string, price: string) => void;
  onRemove: (id: string) => void;
  onClick: (id: string) => void;
}

const CartItemRow = memo(({
  item,
  localPrice,
  isSelected,
  onQuantityChange,
  onPriceChange,
  onRemove,
  onClick
}: CartItemRowProps) => {
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

  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(item._id);
  }, [item._id, onRemove]);

  const handleRowClick = useCallback(() => {
    onClick(item._id);
  }, [item._id, onClick]);

  const price = localPrice !== undefined ? (parseInt(localPrice.replace(/\s/g, '')) || 0) : item.price;
  const totalPrice = price * item.cartQuantity;

  return (
    <div
      onClick={handleRowClick}
      className={`grid grid-cols-12 gap-3 px-6 py-4 items-center cursor-pointer transition-all ${
        isSelected
          ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 shadow-sm'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="col-span-1">
        <span className="text-sm font-mono font-bold text-slate-900 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {item.code}
        </span>
      </div>
      <div className="col-span-3">
        <span className="text-sm font-bold text-slate-900 dark:text-gray-100">{item.name}</span>
      </div>
      <div className="col-span-2">
        <span className="text-sm font-semibold text-slate-600 dark:text-gray-400">Asosiy</span>
      </div>
      <div className="col-span-2 flex items-center justify-center">
        <input
          type="text"
          value={item.cartQuantity}
          onChange={handleQuantityChange}
          onBlur={handleQuantityBlur}
          className="w-24 h-12 text-center font-black text-xl border-2 border-slate-300 dark:border-gray-600 dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all bg-white"
        />
      </div>
      <div className="col-span-2 text-right">
        <input
          type="text"
          value={localPrice !== undefined ? localPrice : item.price.toLocaleString()}
          onChange={handlePriceChange}
          className="w-32 h-12 text-right text-base font-bold border-2 border-slate-300 dark:border-gray-600 dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-xl px-3 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all bg-white"
        />
      </div>
      <div className="col-span-1 text-right">
        <span className="text-lg font-black text-slate-900 dark:text-gray-100">
          {totalPrice.toLocaleString()}
        </span>
      </div>
      <div className="col-span-1 flex justify-center">
        <button
          onClick={handleRemoveClick}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:scale-110"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

CartItemRow.displayName = 'CartItemRow';

export default CartItemRow;
