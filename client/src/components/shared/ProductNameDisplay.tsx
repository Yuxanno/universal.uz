import { formatProductNameWithPrice } from '../../utils/productNameParser';

interface ProductNameDisplayProps {
  name: string;
  className?: string;
  priceClassName?: string;
  hidePrice?: boolean; // New prop to hide embedded price highlighting
}

/**
 * Displays product name with embedded price highlighted in red
 * Example: "KALTA TOSH NATURAL CHAPON 25,190000" 
 * Shows: "KALTA TOSH NATURAL CHAPON 25" + ",190000" (in red)
 */
export default function ProductNameDisplay({ 
  name, 
  className = '', 
  priceClassName = 'text-red-600 font-bold',
  hidePrice = false // Default: show price in red
}: ProductNameDisplayProps) {
  // If hidePrice is true, just show the name without highlighting
  if (hidePrice) {
    return <span className={className}>{name}</span>;
  }

  const { beforePrice, price, afterPrice } = formatProductNameWithPrice(name);

  if (!price) {
    // No embedded price, show normal name
    return <span className={className}>{name}</span>;
  }

  // Show name with highlighted price
  return (
    <span className={className}>
      {beforePrice},<span className={priceClassName}>{price}</span>
      {afterPrice}
    </span>
  );
}
