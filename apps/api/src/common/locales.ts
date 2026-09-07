import type { SupportedLocale } from '@devsure/contracts';

/**
 * Runtime copy of `SUPPORTED_LOCALES` from `@devsure/contracts`. Duplicated
 * because that package is ESM-only (`"type": "module"`, no `require` export
 * condition) while this API runs under CommonJS (Nest/ts-jest), which cannot
 * `require()` a value export from it. Keep in sync with the contracts list.
 */
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  'en',
  'es',
  'pt',
  'fr',
  'de',
  'it',
  'nl',
  'ja',
  'zh',
  'ko',
  'ru',
  'ar',
];
