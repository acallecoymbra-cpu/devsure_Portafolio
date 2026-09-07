import type { TranslatableString } from '@devsure/contracts';

const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Auto-slug fallback for Experience/Project/Post/Network (spec §9 rule 3). */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** First non-empty translation, used to auto-slug title-only entities like Project/Post. */
export function firstTranslatableValue(value: TranslatableString): string {
  return Object.values(value).find((entry) => entry?.trim())?.trim() ?? '';
}
