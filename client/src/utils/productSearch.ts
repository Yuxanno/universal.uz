/**
 * Универсальная функция поиска товаров
 * Поддерживает:
 * - Поиск по коду
 * - Поиск по названию
 * - Автоматическую конвертацию латиницы в кириллицу
 * - Поиск в обе стороны (латиница ↔ кириллица)
 */

import { uzLatToCyr } from './uzLatToCyr';

export interface SearchableProduct {
 code: string;
 name: string;
 price?: number;
 dona_narx?: number;
 optom_narx?: number;
 [key: string]: any;
}

/**
 * Нормализует текст для поиска (убирает лишние пробелы, приводит к нижнему регистру)
 */
function normalizeText(text: string): string {
 return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Проверяет, содержит ли текст поисковый запрос
 * Поддерживает поиск на латинице и кириллице в обе стороны
 */
function matchesQuery(text: string, query: string): boolean {
 if (!text || !query) return false;
 
 const normalizedText = normalizeText(text);
 const normalizedQuery = normalizeText(query);
 
 // 1. Прямое совпадение
 if (normalizedText.includes(normalizedQuery)) {
 return true;
 }
 
 // 2. Конвертируем запрос из латиницы в кириллицу и проверяем
 const cyrillicQuery = normalizeText(uzLatToCyr(normalizedQuery));
 if (cyrillicQuery !== normalizedQuery && normalizedText.includes(cyrillicQuery)) {
 return true;
 }
 
 // 3. Конвертируем текст из латиницы в кириллицу и проверяем с оригинальным запросом
 const cyrillicText = normalizeText(uzLatToCyr(normalizedText));
 if (cyrillicText !== normalizedText && cyrillicText.includes(normalizedQuery)) {
 return true;
 }
 
 // 4. Оба в кириллице
 if (cyrillicText !== normalizedText && cyrillicQuery !== normalizedQuery) {
 if (cyrillicText.includes(cyrillicQuery)) {
 return true;
 }
 }
 
 return false;
}

/**
 * Фильтрует и сортирует товары по поисковому запросу
 * Ищет по коду и названию, поддерживает латиницу и кириллицу в обе стороны
 * Сортирует: код с начала > короткий код > алфавитный порядок
 * 
 * @param products - массив товаров для поиска
 * @param query - поисковый запрос
 * @returns отфильтрованный и отсортированный массив товаров
 * 
 * @example
 * // Поиск по коду
 * searchProducts(products, '123') // найдет товар с кодом 123
 * 
 * @example
 * // Поиск по названию на кириллице
 * searchProducts(products, 'брук') // найдет "БРУК"
 * 
 * @example
 * // Поиск по названию на латинице (автоконвертация)
 * searchProducts(products, 'bruk') // найдет "БРУК" (конвертирует в кириллицу)
 * 
 * @example
 * // Поиск товара на латинице запросом на латинице
 * searchProducts(products, 'paket 10kg') // найдет "paket 10kg"
 * 
 * @example
 * // Поиск товара на латинице запросом на кириллице
 * searchProducts(products, 'пакет') // найдет "paket 10kg" (конвертирует товар)
 */
export function searchProducts<T extends SearchableProduct>(
 products: T[],
 query: string
): T[] {
 if (!query || query.trim() === '') {
 return products;
 }
 
 const trimmedQuery = query.trim().toLowerCase();
 
 // Check if query is a number (price search)
 const isNumericQuery = /^\d+$/.test(trimmedQuery);
 const numericQuery = isNumericQuery ? parseInt(trimmedQuery) : null;
 
 // Debug: Log search query
 if (numericQuery !== null) {
 console.log(`🔍 [CODE/PRICE SEARCH] Query: ${numericQuery}`);
 console.log(`📦 Total products before filter: ${products.length}`);
 }
 
 // Counter for debug logging
 let debugCount = 0;
 
 // Filter products
 const filtered = products.filter(product => {
 // Numeric search - search by CODE first, then by exact PRICE match
 if (numericQuery !== null) {
 // PRIORITY 1: Check if CODE matches (exact or contains)
 const codeMatch = product.code && product.code.includes(trimmedQuery);
 
 // PRIORITY 2: Check exact match for ALL price fields
 const priceMatch = product.price && Math.round(product.price) === numericQuery;
 const donaNarxMatch = product.dona_narx && Math.round(product.dona_narx) === numericQuery;
 const optomNarxMatch = product.optom_narx && Math.round(product.optom_narx) === numericQuery;
 const tanNarxMatch = (product as any).tan_narx && Math.round((product as any).tan_narx) === numericQuery;
 const costPriceMatch = (product as any).costPrice && Math.round((product as any).costPrice) === numericQuery;
 
 // Debug: Log first 10 matching products
 if (debugCount < 10 && (codeMatch || priceMatch || donaNarxMatch || optomNarxMatch || tanNarxMatch || costPriceMatch)) {
 debugCount++;
 console.log(`✅ [Match ${debugCount}] ${product.name}:`, {
 code: product.code,
 codeMatch,
 price: product.price,
 dona_narx: product.dona_narx,
 optom_narx: product.optom_narx,
 tan_narx: (product as any).tan_narx,
 costPrice: (product as any).costPrice,
 matches: { codeMatch, priceMatch, donaNarxMatch, optomNarxMatch, tanNarxMatch, costPriceMatch }
 });
 }
 
 // Return true if CODE matches OR at least one price field matches EXACTLY
 const hasMatch = codeMatch || priceMatch || donaNarxMatch || optomNarxMatch || tanNarxMatch || costPriceMatch;
 
 if (!hasMatch && debugCount === 0) {
 // Log first non-matching product for debugging
 console.log(`❌ [NO MATCH] ${product.name}:`, {
 code: product.code,
 codeMatch,
 price: product.price,
 dona_narx: product.dona_narx,
 optom_narx: product.optom_narx,
 tan_narx: (product as any).tan_narx,
 costPrice: (product as any).costPrice,
 searchingFor: numericQuery
 });
 }
 
 return hasMatch;
 }
 
 // Поиск по коду
 if (matchesQuery(product.code, trimmedQuery)) {
 return true;
 }
 
 // Поиск по названию
 if (matchesQuery(product.name, trimmedQuery)) {
 return true;
 }
 
 return false;
 });
 
 // Debug: Log filtered results count
 if (numericQuery !== null) {
 console.log(`✅ [FILTERED] Found ${filtered.length} products with code or price ${numericQuery}`);
 if (filtered.length > 0) {
 console.log(`📋 First 5 results:`, filtered.slice(0, 5).map(p => ({
 name: p.name,
 code: p.code,
 price: p.price,
 dona_narx: p.dona_narx,
 optom_narx: p.optom_narx
 })));
 }
 }
 
 // Sort: для числового поиска - код первым, затем точное совпадение цены, затем код с начала > короткий код > алфавитный порядок
 const sorted = [...filtered].sort((a, b) => {
 // Priority 0: If numeric search, CODE match comes FIRST, then exact price match
 if (numericQuery !== null) {
 // Check if CODE matches
 const aCodeMatch = a.code && a.code.includes(trimmedQuery);
 const bCodeMatch = b.code && b.code.includes(trimmedQuery);
 
 // CODE matches have highest priority
 if (aCodeMatch && !bCodeMatch) return -1;
 if (!aCodeMatch && bCodeMatch) return 1;
 
 // If both have code match, sort by code length (shorter first)
 if (aCodeMatch && bCodeMatch) {
 const lengthDiff = a.code.length - b.code.length;
 if (lengthDiff !== 0) return lengthDiff;
 return a.code.localeCompare(b.code);
 }
 
 // Check which price fields match for each product
 const aPriceMatch = a.price && Math.round(a.price) === numericQuery;
 const aDonaNarxMatch = a.dona_narx && Math.round(a.dona_narx) === numericQuery;
 const aOptomNarxMatch = a.optom_narx && Math.round(a.optom_narx) === numericQuery;
 const aTanNarxMatch = (a as any).tan_narx && Math.round((a as any).tan_narx) === numericQuery;
 const aCostPriceMatch = (a as any).costPrice && Math.round((a as any).costPrice) === numericQuery;
 
 const bPriceMatch = b.price && Math.round(b.price) === numericQuery;
 const bDonaNarxMatch = b.dona_narx && Math.round(b.dona_narx) === numericQuery;
 const bOptomNarxMatch = b.optom_narx && Math.round(b.optom_narx) === numericQuery;
 const bTanNarxMatch = (b as any).tan_narx && Math.round((b as any).tan_narx) === numericQuery;
 const bCostPriceMatch = (b as any).costPrice && Math.round((b as any).costPrice) === numericQuery;
 
 // Priority order: price > dona_narx > optom_narx > tan_narx > costPrice
 // Assign priority scores (lower is better)
 let aScore = 999;
 let bScore = 999;
 
 if (aPriceMatch) aScore = 1;
 else if (aDonaNarxMatch) aScore = 2;
 else if (aOptomNarxMatch) aScore = 3;
 else if (aTanNarxMatch) aScore = 4;
 else if (aCostPriceMatch) aScore = 5;
 
 if (bPriceMatch) bScore = 1;
 else if (bDonaNarxMatch) bScore = 2;
 else if (bOptomNarxMatch) bScore = 3;
 else if (bTanNarxMatch) bScore = 4;
 else if (bCostPriceMatch) bScore = 5;
 
 // Sort by priority score
 if (aScore !== bScore) {
 return aScore - bScore;
 }
 
 // If same priority, sort by code (ascending)
 return a.code.localeCompare(b.code);
 }
 
 const aCode = a.code.toLowerCase();
 const bCode = b.code.toLowerCase();
 
 const aCodeStartsWith = aCode.startsWith(trimmedQuery);
 const bCodeStartsWith = bCode.startsWith(trimmedQuery);
 
 // Priority 1: Код начинается с запроса
 if (aCodeStartsWith && !bCodeStartsWith) return -1;
 if (!aCodeStartsWith && bCodeStartsWith) return 1;
 
 // Priority 2: Если оба начинаются, короткий код первый
 if (aCodeStartsWith && bCodeStartsWith) {
 const lengthDiff = aCode.length - bCode.length;
 if (lengthDiff !== 0) return lengthDiff;
 return aCode.localeCompare(bCode);
 }
 
 // Priority 3: Код содержит запрос, короткий код первый
 const lengthDiff = aCode.length - bCode.length;
 if (lengthDiff !== 0) return lengthDiff;
 
 // Default: алфавитный порядок
 return aCode.localeCompare(bCode);
 });
 
 return sorted;
}

/**
 * Создает функцию фильтрации для useMemo
 * Использовать когда нужно мемоизировать результаты поиска
 * 
 * @example
 * const filteredProducts = useMemo(() => {
 * return createProductFilter(products, debouncedSearchQuery);
 * }, [products, debouncedSearchQuery]);
 */
export function createProductFilter<T extends SearchableProduct>(
 products: T[],
 query: string
): T[] {
 return searchProducts(products, query);
}

/**
 * Проверяет, является ли запрос поиском по коду
 * (только цифры)
 */
export function isCodeSearch(query: string): boolean {
 return /^\d+$/.test(query.trim());
}

/**
 * Подсвечивает совпадения в тексте
 * Полезно для отображения результатов поиска
 */
export function highlightMatch(text: string, query: string): string {
 if (!query || !text) return text;
 
 const lowerText = text.toLowerCase();
 const lowerQuery = query.toLowerCase();
 
 // Прямое совпадение
 let index = lowerText.indexOf(lowerQuery);
 if (index !== -1) {
 return text.substring(0, index) + 
 '<mark>' + text.substring(index, index + query.length) + '</mark>' +
 text.substring(index + query.length);
 }
 
 // Совпадение с кириллицей
 const cyrillicQuery = uzLatToCyr(lowerQuery);
 if (cyrillicQuery !== lowerQuery) {
 index = lowerText.indexOf(cyrillicQuery.toLowerCase());
 if (index !== -1) {
 return text.substring(0, index) + 
 '<mark>' + text.substring(index, index + cyrillicQuery.length) + '</mark>' +
 text.substring(index + cyrillicQuery.length);
 }
 }
 
 return text;
}
