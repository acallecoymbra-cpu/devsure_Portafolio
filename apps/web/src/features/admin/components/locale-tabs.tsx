'use client';

import { ReactNode, useState } from 'react';
import styles from '../admin.module.css';

export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  nl: 'Nederlands',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  ru: 'Русский',
  ar: 'العربية',
};

interface LocaleTabsProps {
  idPrefix: string;
  locales: string[];
  children: (locale: string) => ReactNode;
}

/**
 * Reusable tabs for translatable fields (spec `<LocaleTabs>` §11.2). All
 * locale panels stay mounted so a plain `<form>` + `FormData` submit keeps
 * capturing every locale's value, even the ones not currently visible.
 */
export function LocaleTabs({ idPrefix, locales, children }: LocaleTabsProps) {
  const [active, setActive] = useState(locales[0]);
  const current = locales.includes(active) ? active : locales[0];

  return (
    <div className={styles.localeTabs}>
      <div className={styles.localeTabList} role="tablist">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${locale}`}
            aria-selected={locale === current}
            aria-controls={`${idPrefix}-panel-${locale}`}
            className={styles.localeTab}
            onClick={() => setActive(locale)}
          >
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </button>
        ))}
      </div>
      {locales.map((locale) => (
        <div
          key={locale}
          role="tabpanel"
          id={`${idPrefix}-panel-${locale}`}
          aria-labelledby={`${idPrefix}-tab-${locale}`}
          hidden={locale !== current}
        >
          {children(locale)}
        </div>
      ))}
    </div>
  );
}
