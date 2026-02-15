/**
 * Универсальная функция поиска товаров (v2.3 - Global Debug Edition)
 * 
 * ПОЛИТИКА:
 * - Если есть цифры: СТРОГОЕ (EXACT) совпадение кода, цены или слова в названии.
 * - Если нет цифр: ГИБКОЕ (LOOSE) совпадение (вхождение подстроки).
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

function normalize(text: any): string {
    return String(text || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Проверяет строгое совпадение двух строк (включая транслитерацию)
 */
function isExact(val1: string, val2: string): boolean {
    const v1 = normalize(val1);
    const v2 = normalize(val2);
    if (!v1 || !v2) return false;
    if (v1 === v2) return true;

    const cyr1 = normalize(uzLatToCyr(v1));
    const cyr2 = normalize(uzLatToCyr(v2));

    return cyr1 === v2 || v1 === cyr2 || cyr1 === cyr2;
}

export function searchProducts<T extends SearchableProduct>(
    products: T[],
    query: string
): T[] {
    if (!query || query.trim() === '') return products;

    const q = query.trim().toLowerCase();
    const hasDigits = /\d/.test(q);
    const isNumeric = /^\d+$/.test(q);
    const numValue = isNumeric ? parseInt(q) : null;

    // Глобальный лог для дебага
    console.log(`🔍 [SEARCH] Query: "${q}" | Strict Mode: ${hasDigits}`);

    const filtered = products.filter(product => {
        let matchReason = '';

        // 1. Поиск по ЦЕНЕ (только если запрос - чистое число)
        // ПРИОРИТЕТ: Сначала ищем по OPTOM, если нашли - возвращаем только их
        // Если не нашли по OPTOM - ищем по DONA и TAN
        if (isNumeric && numValue !== null) {
            // Optom narxi (price) - ПЕРВЫЙ ПРИОРИТЕТ
            const optomPrice = product.price || (product as any).optom_narx;
            
            if (optomPrice != null && Number(optomPrice) === numValue) {
                matchReason = `Optom price match (${optomPrice})`;
                console.log(`✅ MATCH: ${product.name} | Code: ${product.code} | optom: ${optomPrice} === ${numValue}`);
            }
        }

        if (matchReason) return true;

        // 2. Поиск по КОДУ
        const code = normalize(product.code);
        if (isNumeric) {
            // Только для чисто числовых запросов - СТРОГОЕ совпадение
            if (code === q) {
                matchReason = `Code exact match (${code})`;
                console.log(`✅ MATCH: ${product.name} | Code: ${code} === ${q}`);
            }
        } else {
            // Для текстовых запросов - вхождение
            if (code.includes(q) || normalize(uzLatToCyr(code)).includes(q)) {
                matchReason = `Code loose match (${code})`;
            }
        }

        if (matchReason) return true;

        // 3. Поиск по НАЗВАНИЮ
        const name = normalize(product.name);
        if (hasDigits) {
            // Строгое совпадение одного из слов
            const tokens = name.split(/[^a-z0-9а-яёўқғҳ]+/i).filter(Boolean);
            if (tokens.some(t => isExact(t, q))) {
                matchReason = `Name exact word match ("${q}" in "${name}")`;
                console.log(`✅ MATCH: ${product.name} | Code: ${product.code} | Name word match: "${q}"`);
            }
        } else {
            // Обычное вхождение
            if (name.includes(q) || normalize(uzLatToCyr(name)).includes(q)) {
                matchReason = `Name loose match ("${q}" in "${name}")`;
            }
        }

        if (matchReason) {
            // Для дебага можно включить лог каждого совпадения
            // console.log(`✅ Match: ${product.name} | Reason: ${matchReason}`);
            return true;
        }

        return false;
    });

    console.log(`📊 Results for "${q}": ${filtered.length}`);

    // Сортировка
    return filtered.sort((a, b) => {
        const aCode = normalize(a.code);
        const bCode = normalize(b.code);

        if (aCode === q && bCode !== q) return -1;
        if (bCode === q && aCode !== q) return 1;

        return a.name.localeCompare(b.name, 'uz');
    });
}

export function createProductFilter<T extends SearchableProduct>(products: T[], query: string): T[] {
    return searchProducts(products, query);
}

export function isCodeSearch(query: string): boolean {
    return /^\d+$/.test(query.trim());
}

export function highlightMatch(text: string, query: string): string {
    if (!query || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index !== -1) {
        return text.substring(0, index) + '<mark>' + text.substring(index, index + query.length) + '</mark>' + text.substring(index + query.length);
    }
    return text;
}
