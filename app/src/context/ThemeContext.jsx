import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../resources/styles/theme';

const ThemeCtx = createContext();

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('tgr_theme') || 'dark');

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  function toggle() {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('tgr_theme', next);
      return next;
    });
  }

  return (
    <ThemeCtx.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
