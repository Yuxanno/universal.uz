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
    console.log(`🔍 [SEARCH] Query: "${q}" | Numeric: ${isNumeric} | Has Digits: ${hasDigits}`);

    const filtered = products.filter(product => {
        let matchReason = '';

        // AGAR FAQAT HARF BO'LSA - FAQAT NOM BO'YICHA QIDIRISH
        if (!hasDigits) {
            const name = normalize(product.name);
            // Обычное вхождение
            if (name.includes(q) || normalize(uzLatToCyr(name)).includes(q)) {
                matchReason = `Name match ("${q}" in "${name}")`;
                return true;
            }
            return false; // Faqat nomdan qidirish
        }

        // AGAR RAQAM BO'LSA - KOD VA NARX BO'YICHA QIDIRISH
        // 1. Поиск по ЦЕНЕ (только если запрос - чистое число)
        if (isNumeric && numValue !== null) {
            // Optom narxi (price) - ПЕРВЫЙ ПРИОРИТЕТ
            const optomPrice = product.price || (product as any).optom_narx;
            
            if (optomPrice != null && Number(optomPrice) === numValue) {
                matchReason = `Optom price match (${optomPrice})`;
                console.log(`✅ MATCH: ${product.name} | Code: ${product.code} | optom: ${optomPrice} === ${numValue}`);
                return true;
            }
        }

        // 2. Поиск по КОДУ (для всех запросов с цифрами)
        const code = normalize(product.code);
        
        if (isNumeric) {
            // Только для чисто числовых запросов - СТРОГОЕ совпадение
            if (code === q) {
                matchReason = `Code exact match (${code})`;
                console.log(`✅ MATCH: ${product.name} | Code: ${code} === ${q}`);
                return true;
            }
        } else if (hasDigits) {
            // Для запросов с цифрами и буквами (11000A) - вхождение или точное совпадение
            if (code === q || code.includes(q)) {
                matchReason = `Code match (${code} contains "${q}")`;
                console.log(`✅ MATCH: ${product.name} | Code: ${code} contains "${q}"`);
                return true;
            }
        }

        // 3. Поиск по НАЗВАНИЮ (только если есть цифры в запросе)
        if (hasDigits) {
            const name = normalize(product.name);
            // Вхождение подстроки в название
            if (name.includes(q) || normalize(uzLatToCyr(name)).includes(q)) {
                matchReason = `Name contains ("${q}" in "${name}")`;
                console.log(`✅ MATCH: ${product.name} | Code: ${product.code} | Name contains: "${q}"`);
                return true;
            }
        }

        return false;
    });

    console.log(`📊 Results for "${q}": ${filtered.length}`);

    // Сортировка
    return filtered.sort((a, b) => {
        const aCode = normalize(a.code);
        const bCode = normalize(b.code);

        // Точное совпадение кода - в начало
        if (aCode === q && bCode !== q) return -1;
        if (bCode === q && aCode !== q) return 1;

        // Код начинается с запроса - выше
        if (aCode.startsWith(q) && !bCode.startsWith(q)) return -1;
        if (bCode.startsWith(q) && !aCode.startsWith(q)) return 1;

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
