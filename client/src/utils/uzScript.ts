/**
 * Утилиты для конвертации узбекского текста между латиницей и кириллицей
 * Поддерживает оба направления: lat→cyr и cyr→lat
 */

export type UzScript = 'lat' | 'cyr';

/**
 * Нормализует различные виды апострофов к стандартному '
 * Унифицирует: ʻ ʼ ' ' ´ ` → '
 */
export function normalizeApostrophes(text: string): string {
 if (!text) return text;
 // Заменяем все варианты апострофов на стандартный '
 return text.replace(/[ʻʼ''´`]/g, "'");
}

/**
 * Конвертирует текст с узбекского латинского алфавита в кириллицу
 * @param text - текст на узбекском латинском алфавите
 * @returns текст на узбекском кириллическом алфавите
 */
export function toUzCyr(text: string): string {
 if (!text) return text;
 
 // Нормализуем апострофы
 let result = normalizeApostrophes(text);
 
 // ВАЖНО: Обрабатываем длинные сочетания первыми!
 
 // Специальные символы с апострофом (обрабатываем до двухбуквенных)
 result = result.replace(/o'/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ў' : 'ў');
 result = result.replace(/g'/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ғ' : 'ғ');
 
 // Двухбуквенные комбинации
 result = result.replace(/sh/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ш' : 'ш');
 result = result.replace(/ch/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ч' : 'ч');
 result = result.replace(/ng/gi, (match) => match[0] === match[0].toUpperCase() ? 'Нг' : 'нг');
 result = result.replace(/yo/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ё' : 'ё');
 result = result.replace(/ya/gi, (match) => match[0] === match[0].toUpperCase() ? 'Я' : 'я');
 result = result.replace(/yu/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ю' : 'ю');
 result = result.replace(/ye/gi, (match) => match[0] === match[0].toUpperCase() ? 'Е' : 'е');
 
 // Однобуквенные соответствия (только если не часть латинского бренда/слова)
 result = result.replace(/a/gi, (match) => match === 'A' ? 'А' : 'а');
 result = result.replace(/b/gi, (match) => match === 'B' ? 'Б' : 'б');
 result = result.replace(/d/gi, (match) => match === 'D' ? 'Д' : 'д');
 result = result.replace(/e/gi, (match) => match === 'E' ? 'Е' : 'е');
 result = result.replace(/f/gi, (match) => match === 'F' ? 'Ф' : 'ф');
 result = result.replace(/g/gi, (match) => match === 'G' ? 'Г' : 'г');
 result = result.replace(/h/gi, (match) => match === 'H' ? 'Ҳ' : 'ҳ');
 result = result.replace(/i/gi, (match) => match === 'I' ? 'И' : 'и');
 result = result.replace(/j/gi, (match) => match === 'J' ? 'Ж' : 'ж');
 result = result.replace(/k/gi, (match) => match === 'K' ? 'К' : 'к');
 result = result.replace(/l/gi, (match) => match === 'L' ? 'Л' : 'л');
 result = result.replace(/m/gi, (match) => match === 'M' ? 'М' : 'м');
 result = result.replace(/n/gi, (match) => match === 'N' ? 'Н' : 'н');
 result = result.replace(/o/gi, (match) => match === 'O' ? 'О' : 'о');
 result = result.replace(/p/gi, (match) => match === 'P' ? 'П' : 'п');
 result = result.replace(/q/gi, (match) => match === 'Q' ? 'Қ' : 'қ');
 result = result.replace(/r/gi, (match) => match === 'R' ? 'Р' : 'р');
 result = result.replace(/s/gi, (match) => match === 'S' ? 'С' : 'с');
 result = result.replace(/t/gi, (match) => match === 'T' ? 'Т' : 'т');
 result = result.replace(/u/gi, (match) => match === 'U' ? 'У' : 'у');
 result = result.replace(/v/gi, (match) => match === 'V' ? 'В' : 'в');
 result = result.replace(/x/gi, (match) => match === 'X' ? 'Х' : 'х');
 result = result.replace(/y/gi, (match) => match === 'Y' ? 'Й' : 'й');
 result = result.replace(/z/gi, (match) => match === 'Z' ? 'З' : 'з');
 
 // Удаляем оставшиеся апострофы
 result = result.replace(/'/g, '');
 
 return result;
}

/**
 * Конвертирует текст с узбекского кириллического алфавита в латиницу
 * @param text - текст на узбекском кириллическом алфавите
 * @returns текст на узбекском латинском алфавите
 */
export function toUzLat(text: string): string {
 if (!text) return text;
 
 let result = text;
 
 // ВАЖНО: Обрабатываем длинные сочетания первыми!
 
 // Двухбуквенные комбинации кириллицы
 result = result.replace(/нг/gi, (match) => match[0] === match[0].toUpperCase() ? 'Ng' : 'ng');
 
 // Специальные узбекские буквы (обрабатываем до обычных)
 result = result.replace(/ў/gi, (match) => match === 'Ў' ? "O'" : "o'");
 result = result.replace(/ғ/gi, (match) => match === 'Ғ' ? "G'" : "g'");
 result = result.replace(/қ/gi, (match) => match === 'Қ' ? 'Q' : 'q');
 result = result.replace(/ҳ/gi, (match) => match === 'Ҳ' ? 'H' : 'h');
 
 // Буквы, которые могут быть частью ya/yo/yu/ye или отдельными
 result = result.replace(/ё/gi, (match) => match === 'Ё' ? 'Yo' : 'yo');
 result = result.replace(/я/gi, (match) => match === 'Я' ? 'Ya' : 'ya');
 result = result.replace(/ю/gi, (match) => match === 'Ю' ? 'Yu' : 'yu');
 
 // Обычные кириллические буквы
 result = result.replace(/ш/gi, (match) => match === 'Ш' ? 'Sh' : 'sh');
 result = result.replace(/ч/gi, (match) => match === 'Ч' ? 'Ch' : 'ch');
 result = result.replace(/а/gi, (match) => match === 'А' ? 'A' : 'a');
 result = result.replace(/б/gi, (match) => match === 'Б' ? 'B' : 'b');
 result = result.replace(/в/gi, (match) => match === 'В' ? 'V' : 'v');
 result = result.replace(/г/gi, (match) => match === 'Г' ? 'G' : 'g');
 result = result.replace(/д/gi, (match) => match === 'Д' ? 'D' : 'd');
 result = result.replace(/е/gi, (match) => match === 'Е' ? 'E' : 'e');
 result = result.replace(/ж/gi, (match) => match === 'Ж' ? 'J' : 'j');
 result = result.replace(/з/gi, (match) => match === 'З' ? 'Z' : 'z');
 result = result.replace(/и/gi, (match) => match === 'И' ? 'I' : 'i');
 result = result.replace(/й/gi, (match) => match === 'Й' ? 'Y' : 'y');
 result = result.replace(/к/gi, (match) => match === 'К' ? 'K' : 'k');
 result = result.replace(/л/gi, (match) => match === 'Л' ? 'L' : 'l');
 result = result.replace(/м/gi, (match) => match === 'М' ? 'M' : 'm');
 result = result.replace(/н/gi, (match) => match === 'Н' ? 'N' : 'n');
 result = result.replace(/о/gi, (match) => match === 'О' ? 'O' : 'o');
 result = result.replace(/п/gi, (match) => match === 'П' ? 'P' : 'p');
 result = result.replace(/р/gi, (match) => match === 'Р' ? 'R' : 'r');
 result = result.replace(/с/gi, (match) => match === 'С' ? 'S' : 's');
 result = result.replace(/т/gi, (match) => match === 'Т' ? 'T' : 't');
 result = result.replace(/у/gi, (match) => match === 'У' ? 'U' : 'u');
 result = result.replace(/ф/gi, (match) => match === 'Ф' ? 'F' : 'f');
 result = result.replace(/х/gi, (match) => match === 'Х' ? 'X' : 'x');
 result = result.replace(/э/gi, (match) => match === 'Э' ? 'E' : 'e');
 
 return result;
}

/**
 * Конвертирует текст в нужный скрипт (латиница или кириллица)
 * Автоматически определяет направление конвертации
 * @param text - исходный текст
 * @param targetScript - целевой скрипт ('lat' или 'cyr')
 * @returns сконвертированный текст
 */
export function toUzScript(text: string, targetScript: UzScript): string {
 if (!text) return text;
 
 // Определяем текущий скрипт текста
 const hasCyrillic = /[а-яА-ЯўғқҳёЎҒҚҲЁ]/.test(text);
 const hasLatin = /[a-zA-Z]/.test(text);
 
 // Если целевой скрипт - латиница
 if (targetScript === 'lat') {
 // Если текст содержит кириллицу, конвертируем
 if (hasCyrillic) {
 return toUzLat(text);
 }
 // Если уже латиница, возвращаем как есть
 return text;
 }
 
 // Если целевой скрипт - кириллица
 if (targetScript === 'cyr') {
 // Если текст содержит латиницу, конвертируем
 if (hasLatin) {
 return toUzCyr(text);
 }
 // Если уже кириллица, возвращаем как есть
 return text;
 }
 
 return text;
}
