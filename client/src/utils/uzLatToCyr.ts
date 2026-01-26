/**
 * Конвертер узбекского латинского алфавита в кириллицу
 * Поддерживает все специальные символы узбекского языка
 */

// Правила конвертации для узбекского латинского алфавита в кириллицу
const conversionRules: Array<[RegExp, string | ((match: string) => string)]> = [
 // Специальные символы с апострофом (обрабатываем первыми, до двухбуквенных)
 [/o['ʻ']/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ў' : 'ў'],
 [/g['ʻ']/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ғ' : 'ғ'],
 
 // Двухбуквенные комбинации
 [/sh/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ш' : 'ш'],
 [/ch/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ч' : 'ч'],
 [/ng/gi, (match) => match[0] === match[0].toUpperCase() ? 'Нг' : 'нг'],
 [/yo/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ё' : 'ё'],
 [/ya/gi, (match) => match[0] === match[0].toUpperCase() ? 'Я' : 'я'],
 [/yu/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ю' : 'ю'],
 [/ye/gi, (match) => match[0] === match[0].toUpperCase() ? 'Е' : 'е'],
 
 // Однобуквенные соответствия
 [/a/gi, (match) => match === 'A' ? 'А' : 'а'],
 [/b/gi, (match) => match === 'B' ? 'Б' : 'б'],
 [/d/gi, (match) => match === 'D' ? 'Д' : 'д'],
 [/e/gi, (match) => match === 'E' ? 'Е' : 'е'],
 [/f/gi, (match) => match === 'F' ? 'Ф' : 'ф'],
 [/g/gi, (match) => match === 'G' ? 'Г' : 'г'],
 [/h/gi, (match) => match === 'H' ? 'Ҳ' : 'ҳ'],
 [/i/gi, (match) => match === 'I' ? 'И' : 'и'],
 [/j/gi, (match) => match === 'J' ? 'Ж' : 'ж'],
 [/k/gi, (match) => match === 'K' ? 'К' : 'к'],
 [/l/gi, (match) => match === 'L' ? 'Л' : 'л'],
 [/m/gi, (match) => match === 'M' ? 'М' : 'м'],
 [/n/gi, (match) => match === 'N' ? 'Н' : 'н'],
 [/o/gi, (match) => match === 'O' ? 'О' : 'о'],
 [/p/gi, (match) => match === 'P' ? 'П' : 'п'],
 [/q/gi, (match) => match === 'Q' ? 'Қ' : 'қ'],
 [/r/gi, (match) => match === 'R' ? 'Р' : 'р'],
 [/s/gi, (match) => match === 'S' ? 'С' : 'с'],
 [/t/gi, (match) => match === 'T' ? 'Т' : 'т'],
 [/u/gi, (match) => match === 'U' ? 'У' : 'у'],
 [/v/gi, (match) => match === 'V' ? 'В' : 'в'],
 [/x/gi, (match) => match === 'X' ? 'Х' : 'х'],
 [/y/gi, (match) => match === 'Y' ? 'Й' : 'й'],
 [/z/gi, (match) => match === 'Z' ? 'З' : 'з'],
 
 // Удаляем оставшиеся апострофы
 [/['ʻ']/g, ''],
];

/**
 * Конвертирует текст с узбекского латинского алфавита в кириллицу
 * @param text - текст на узбекском латинском алфавите
 * @returns текст на узбекском кириллическом алфавите
 */
export function uzLatToCyr(text: string): string {
 if (!text) return text;
 
 let result = text;
 
 // Применяем правила конвертации последовательно
 for (const [pattern, replacement] of conversionRules) {
 result = result.replace(pattern, replacement as any);
 }
 
 return result;
}

/**
 * Конвертирует объект с полями nameUzLat в объект с nameUzCyr
 * Используется для автоматической конвертации при отображении
 */
export function convertProductName<T extends { name?: string }>(
 product: T,
 script: 'latin' | 'cyrillic'
): T & { displayName: string } {
 const displayName = script === 'cyrillic' && product.name 
 ? uzLatToCyr(product.name)
 : product.name || '';
 
 return {
 ...product,
 displayName,
 };
}
