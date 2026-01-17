import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../data/translations';
import { toUzScript, type UzScript } from '../utils/uzScript';

// Маппинг старых значений на новые
type Script = 'latin' | 'cyrillic';
type ScriptMapping = {
  latin: 'lat';
  cyrillic: 'cyr';
};

const scriptMap: ScriptMapping = {
  latin: 'lat',
  cyrillic: 'cyr',
};

interface LanguageContextType {
  script: Script;
  uzScript: UzScript; // 'lat' | 'cyr'
  setScript: (script: Script) => void;
  tKey: (key: string) => string; // Перевод UI-ключей через словарь
  uz: (text: string) => string;  // Конвертация узбекского текста из БД
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [script, setScriptState] = useState<Script>(() => {
    const saved = localStorage.getItem('script');
    return (saved as Script) || 'latin';
  });

  const uzScript: UzScript = scriptMap[script];

  useEffect(() => {
    localStorage.setItem('script', script);
  }, [script]);

  const setScript = (newScript: Script) => {
    setScriptState(newScript);
  };

  /**
   * tKey - Перевод UI-ключей через статический словарь
   * Используется для интерфейсных строк: кнопок, заголовков, меню
   * @param key - ключ из словаря translations
   */
  const tKey = (key: string): string => {
    if (script === 'latin') return key;
    return translations[key] || key;
  };

  /**
   * uz - Конвертация произвольного узбекского текста из БД
   * Используется для данных: product.name, customer.name и т.п.
   * Автоматически конвертирует в нужный скрипт (lat/cyr)
   * 
   * ВАЖНО: Всегда приводит текст к выбранному скрипту:
   * - Если выбран latin: все кириллические тексты → латиница
   * - Если выбран cyrillic: все латинские тексты → кириллица
   * 
   * @param text - текст из БД (может быть латиницей или кириллицей)
   */
  const uz = (text: string): string => {
    if (!text) return text;
    
    // Определяем текущий скрипт текста
    const hasCyrillic = /[а-яА-ЯўғқҳёЎҒҚҲЁ]/.test(text);
    const hasLatin = /[a-zA-Z]/.test(text);
    
    // Если выбран латинский скрипт
    if (uzScript === 'lat') {
      // Если текст содержит кириллицу - конвертируем в латиницу
      if (hasCyrillic) {
        return toUzScript(text, 'lat');
      }
      // Если уже латиница - возвращаем как есть
      return text;
    }
    
    // Если выбран кириллический скрипт
    if (uzScript === 'cyr') {
      // Если текст содержит латиницу - конвертируем в кириллицу
      if (hasLatin) {
        return toUzScript(text, 'cyr');
      }
      // Если уже кириллица - возвращаем как есть
      return text;
    }
    
    return text;
  };

  /**
   * t - УСТАРЕЛО! Используйте tKey() или uz()
   * Оставлено для обратной совместимости
   * @deprecated
   */
  const t = tKey;

  return (
    <LanguageContext.Provider value={{ script, uzScript, setScript, tKey, uz, t } as any}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
