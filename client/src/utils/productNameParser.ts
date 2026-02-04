/**
 * Parse product name and extract price if embedded in name
 * Example: "KALTA TOSH NATURAL CHAPON 25,190000" -> { name: "KALTA TOSH NATURAL CHAPON 25", price: "190000" }
 */
export interface ParsedProductName {
  fullName: string;
  displayName: string;
  embeddedPrice: string | null;
  hasEmbeddedPrice: boolean;
}

/**
 * Parses product name to extract embedded price
 * Looks for pattern: "text,number" at the end of the name
 */
export function parseProductName(productName: string): ParsedProductName {
  if (!productName) {
    return {
      fullName: '',
      displayName: '',
      embeddedPrice: null,
      hasEmbeddedPrice: false
    };
  }

  // Regex pattern: finds comma followed by digits at the end or middle of string
  // Matches: ",190000" or ",25" etc.
  const pricePattern = /,(\d+)(?=\s|$)/g;
  
  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  
  // Find the last occurrence of the pattern
  while ((match = pricePattern.exec(productName)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    const embeddedPrice = lastMatch[1]; // The digits after comma
    const priceStartIndex = lastMatch.index; // Position of comma
    
    // Split name: everything before comma + everything after the price
    const beforePrice = productName.substring(0, priceStartIndex);
    const afterPrice = productName.substring(priceStartIndex + embeddedPrice.length + 1);
    const displayName = (beforePrice + afterPrice).trim();

    return {
      fullName: productName,
      displayName: displayName,
      embeddedPrice: embeddedPrice,
      hasEmbeddedPrice: true
    };
  }

  // No embedded price found
  return {
    fullName: productName,
    displayName: productName,
    embeddedPrice: null,
    hasEmbeddedPrice: false
  };
}

/**
 * Format product name with highlighted price for display
 * Returns JSX-ready parts
 */
export function formatProductNameWithPrice(productName: string): {
  beforePrice: string;
  price: string | null;
  afterPrice: string;
} {
  const parsed = parseProductName(productName);
  
  if (!parsed.hasEmbeddedPrice || !parsed.embeddedPrice) {
    return {
      beforePrice: productName,
      price: null,
      afterPrice: ''
    };
  }

  // Find where the price is in the original name
  const pricePattern = new RegExp(`,${parsed.embeddedPrice}(?=\\s|$)`);
  const match = pricePattern.exec(productName);
  
  if (match) {
    const beforePrice = productName.substring(0, match.index);
    const afterPrice = productName.substring(match.index + match[0].length);
    
    return {
      beforePrice: beforePrice,
      price: parsed.embeddedPrice,
      afterPrice: afterPrice
    };
  }

  return {
    beforePrice: productName,
    price: null,
    afterPrice: ''
  };
}
