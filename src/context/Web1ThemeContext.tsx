import React, { createContext, useContext, useEffect } from 'react';
import { web1PublicTheme, type Web1Theme } from '@/theme/public';

interface Web1ThemeContextType {
  theme: Web1Theme;
}

const Web1ThemeContext = createContext<Web1ThemeContextType>({
  theme: web1PublicTheme,
});

export const Web1ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    const colors = web1PublicTheme.colors;

    // Dynamically inject CSS Custom Properties derived from public.ts
    root.style.setProperty('--web1-primary', colors.primary.default);
    root.style.setProperty('--web1-primary-hover', colors.primary.hover);
    root.style.setProperty('--web1-primary-light', colors.primary.light);
    root.style.setProperty('--web1-secondary', colors.secondary.default);
    root.style.setProperty('--web1-bg-main', colors.background.main);
    root.style.setProperty('--web1-surface-card', colors.surface.card);
    root.style.setProperty('--web1-text-primary', colors.text.primary);
    root.style.setProperty('--web1-text-secondary', colors.text.secondary);
    root.style.setProperty('--web1-border-default', colors.border.default);
    root.style.setProperty('--web1-border-light', colors.border.light);
  }, []);

  return (
    <Web1ThemeContext.Provider value={{ theme: web1PublicTheme }}>
      {children}
    </Web1ThemeContext.Provider>
  );
};

export const useWeb1Theme = (): Web1ThemeContextType => {
  const context = useContext(Web1ThemeContext);
  return context || { theme: web1PublicTheme };
};

export default Web1ThemeContext;
