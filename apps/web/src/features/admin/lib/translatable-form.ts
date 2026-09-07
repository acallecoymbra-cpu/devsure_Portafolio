import type { TranslatableString } from '../types';

/** Reads `${prefix}.${locale}` inputs out of a submitted form for every active locale. */
export function collectTranslatable(data: FormData, prefix: string, locales: string[]): TranslatableString {
  const result: TranslatableString = {};
  for (const locale of locales) {
    const value = String(data.get(`${prefix}.${locale}`) ?? '').trim();
    if (value) result[locale] = value;
  }
  return result;
}
