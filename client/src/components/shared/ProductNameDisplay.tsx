import { memo, useMemo } from 'react';
import { formatProductNameWithPrice } from '../../utils/productNameParser';

interface ProductNameDisplayProps {
  name: string;
  className?: string;
  priceClassName?: string;
  hidePrice?: boolean;
}

/**
 * SENIOR OPTIMIZATION: Memoized component to prevent unnecessary re-renders
 * Displays product name with embedded price highlighted in red
 * Example: "KALTA TOSH NATURAL CHAPON 25,190000" 
 * Shows: "KALTA TOSH NATURAL CHAPON 25" + ",190000" (in red)
 */
const ProductNameDisplay = memo(function ProductNameDisplay({ 
  name, 
  className = '', 
  priceClassName = 'text-red-600 font-bold',
  hidePrice = false
}: ProductNameDisplayProps) {
  // SENIOR OPTIMIZATION: Memoize parsed name to avoid re-parsing on every render
  const parsedName = useMemo(() => {
    if (hidePrice) return null;
    return formatProductNameWithPrice(name);
  }, [name, hidePrice]);

  // If hidePrice is true, just show the name without highlighting
  if (hidePrice) {
    return <span className={className}>{name}</span>;
  }

  if (!parsedName || !parsedName.price) {
    // No embedded price, show normal name
    return <span className={className}>{name}</span>;
  }

  // Show name with highlighted price
  return (
    <span className={className}>
      {parsedName.beforePrice},<span className={priceClassName}>{parsedName.price}</span>
      {parsedName.afterPrice}
    </span>
  );
});

export default ProductNameDisplay;
