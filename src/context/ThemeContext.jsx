import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

const systemPrefersDark = () => (
  typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    return 'auto';
  });

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode) => {
      const dark = mode === 'dark' || (mode === 'auto' && systemPrefersDark());
      root.classList.toggle('dark', dark);
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme !== 'auto') return undefined;

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;

    const handleChange = () => applyTheme('auto');
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (mode) => {
    if (['light', 'dark', 'auto'].includes(mode)) {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};