/**
 * Хук для автоматической конвертации узбекского текста
 * в зависимости от выбранного языка (латиница/кириллица)
 * 
 * @deprecated Используйте uz() из useLanguage() напрямую
 */

import { useLanguage } from '../context/LanguageContext';

/**
 * Возвращает функцию для конвертации узбекского текста
 * в зависимости от текущего выбранного скрипта
 */
export function useProductName() {
  const { uz, uzScript } = useLanguage();

  /**
   * Конвертирует узбекский текст в нужный скрипт
   * @param text - текст из БД (латиница или кириллица)
   * @returns текст в текущем скрипте (латиница или кириллица)
   */
  const convertName = (text: string): string => {
    return uz(text);
  };

  return { convertName, script: uzScript };
}
