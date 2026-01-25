import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    localStorage.removeItem('theme'); // Удаляем сохранённую тему
  }, []);

  const toggleTheme = useCallback(() => {
    // Ничего не делаем - тема всегда светлая
  }, []);

  const setTheme = useCallback(() => {
    // Ничего не делаем - тема всегда светлая
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    toggleTheme,
    setTheme
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
