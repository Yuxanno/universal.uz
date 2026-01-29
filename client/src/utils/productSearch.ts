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
 
 // Filter products
 const filtered = products.filter(product => {
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
 
 // Sort: код с начала > короткий код > алфавитный порядок
 const sorted = [...filtered].sort((a, b) => {
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
