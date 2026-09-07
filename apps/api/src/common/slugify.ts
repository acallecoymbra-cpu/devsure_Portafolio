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
