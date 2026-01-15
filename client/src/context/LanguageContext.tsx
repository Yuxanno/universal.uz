import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../data/translations';

type Script = 'latin' | 'cyrillic';

interface LanguageContextType {
  script: Script;
  setScript: (script: Script) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [script, setScript] = useState<Script>(() => {
    const saved = localStorage.getItem('script');
    return (saved as Script) || 'latin';
  });

  useEffect(() => {
    localStorage.setItem('script', script);
  }, [script]);

  // Helper function to translate text
  const t = (text: string): string => {
    if (script === 'latin') return text;
    return translations[text] || text;
  };

  return (
    <LanguageContext.Provider value={{ script, setScript, t }}>
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
