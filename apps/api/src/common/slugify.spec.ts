import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp');
  });

  it('strips accents and diacritics', () => {
    expect(slugify('Compañía Ñoño')).toBe('compania-nono');
  });

  it('collapses punctuation and repeated separators into single hyphens', () => {
    expect(slugify('R&D / Engineering!!')).toBe('r-d-engineering');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -Acme-  ')).toBe('acme');
  });
});
