'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'devsure-theme';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/**
 * Mirrors the `data-theme` attribute the bootstrap script in RootLayout sets
 * before first paint, so this hook never fights that script for the initial
 * render — it just reads the attribute back on mount and updates it on toggle.
 *
 * Every call site gets its own local `theme` state (no shared context), so
 * a toggle triggered by one instance (e.g. the header's `ThemeToggle`) has
 * to reach every other instance (e.g. `AiOrbCompanion`, which picks a
 * different video per theme) some other way — `setTheme` only touches the
 * DOM attribute directly. The MutationObserver below is that link: it
 * re-reads the attribute whenever it changes, no matter which instance (or
 * a future one) changed it, so all of them stay in sync with each other.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    setThemeState(readTheme());

    const observer = new MutationObserver(() => setThemeState(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled — the attribute change above still applies for this session.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
