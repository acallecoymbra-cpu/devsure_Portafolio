import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('the App Router foundation includes global states and metadata', async () => {
  const requiredFiles = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/loading.tsx',
    'src/app/error.tsx',
    'src/app/not-found.tsx',
    'src/components/site-chrome.tsx',
    'src/features/home/components/home-hero.tsx',
    'src/features/home/home-hero.module.css',
    'src/lib/config.ts',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const layout = await readFile(new URL('src/app/layout.tsx', root), 'utf8');
  const siteChrome = await readFile(new URL('src/components/site-chrome.tsx', root), 'utf8');
  const config = await readFile(new URL('src/lib/config.ts', root), 'utf8');
  const page = await readFile(new URL('src/app/page.tsx', root), 'utf8');
  const loading = await readFile(new URL('src/app/loading.tsx', root), 'utf8');
  const homeHero = await readFile(
    new URL('src/features/home/components/home-hero.tsx', root),
    'utf8',
  );
  const homeHeroStyles = await readFile(
    new URL('src/features/home/home-hero.module.css', root),
    'utf8',
  );

  assert.match(layout, /export const metadata/);
  assert.match(layout, /metadataBase/);
  assert.match(config, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(siteChrome, /Saltar al contenido/);
  assert.match(siteChrome, /startsWith\('\/admin'\)/);
  assert.match(layout, /canonical/);
  assert.match(page, /<HomeHero profile=\{profile\} translations=\{translations\} locale=\{locale\} \/>/);
  assert.doesNotMatch(page, /<video|\.mkv|hero-poster\.jpg/);
  assert.doesNotMatch(loading, /TechnologiesSkeleton|skeleton-shimmer/);
  assert.equal((page.match(/<TechnologiesSkeleton \/>/g) ?? []).length, 1);
  assert.match(homeHero, /data-testid="home-hero-signal"/);
  assert.equal((homeHero.match(/<a /g) ?? []).length, 2);
  assert.equal((homeHero.match(/button button-primary/g) ?? []).length, 1);
  assert.match(homeHeroStyles, /prefers-reduced-motion: reduce/);
  assert.match(homeHeroStyles, /animation: none/);
  assert.doesNotMatch(homeHeroStyles, /@keyframes[^}]+(?:width|height|margin|padding):/s);
});

test('the technologies slice consumes the shared contract and models every public state', async () => {
  const requiredFiles = [
    'src/features/technologies/api/get-technologies.ts',
    'src/features/technologies/category-registry.ts',
    'src/features/technologies/icon-registry.tsx',
    'src/features/technologies/components/technologies-section.tsx',
    'src/features/technologies/components/technologies-skeleton.tsx',
    'src/features/technologies/components/technologies-error-boundary.tsx',
    'src/features/technologies/components/technology-image.tsx',
    'src/features/technologies/components/technology-explorer.tsx',
    'src/app/tecnologias/page.tsx',
    'playwright.config.ts',
    'tests/e2e/technologies.spec.ts',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const apiClient = await readFile(
    new URL('src/features/technologies/api/get-technologies.ts', root),
    'utf8',
  );
  const categories = await readFile(
    new URL('src/features/technologies/category-registry.ts', root),
    'utf8',
  );
  const icons = await readFile(
    new URL('src/features/technologies/icon-registry.tsx', root),
    'utf8',
  );
  const section = await readFile(
    new URL('src/features/technologies/components/technologies-section.tsx', root),
    'utf8',
  );
  const technologiesPage = await readFile(new URL('src/app/tecnologias/page.tsx', root), 'utf8');
  const imageComponent = await readFile(
    new URL('src/features/technologies/components/technology-image.tsx', root),
    'utf8',
  );
  const seed = await readFile(
    new URL('../api/src/database/seeds/technology.seed-data.ts', root),
    'utf8',
  );
  const imageMappings = [
    ...imageComponent.matchAll(/^\s{2}(?:'([^']+)'|([a-z0-9]+)):\s*'\/technologies\/([^']+)'/gm),
  ];
  const imageSlugs = imageMappings.map((match) => match[1] ?? match[2]);
  const imageAssets = imageMappings.map((match) => match[3]);
  const seedSlugs = [...seed.matchAll(/^\s{2}\[\s*'[^']*',\s*'([^']+)',/gm)].map(
    (match) => match[1],
  );

  assert.match(apiClient, /PaginatedResponse<TechnologyCard>/);
  assert.match(apiClient, /limit=\$\{PAGE_LIMIT\}/);
  assert.match(apiClient, /cache: 'no-store'/);
  assert.match(apiClient, /technologiesById/);
  assert.equal((categories.match(/\{ key:/g) ?? []).length, 10);
  assert.match(icons, /fallbackIcon/);
  assert.match(section, /technologies.length > 0/);
  // The full filterable explorer lives on its own page now (spec follow-up:
  // showing all 41+ technologies inline in the home was overwhelming); the
  // home section is a teaser linking to it.
  assert.doesNotMatch(section, /TechnologyExplorer/);
  assert.match(section, /featured/);
  assert.match(section, /href="\/tecnologias"/);
  assert.match(technologiesPage, /TechnologyExplorer/);
  assert.equal(imageAssets.length, 41);
  assert.equal(new Set(imageAssets).size, imageAssets.length);
  assert.equal(new Set(imageSlugs).size, imageSlugs.length);
  assert.equal(seedSlugs.length, 41);
  assert.deepEqual(imageSlugs.toSorted(), seedSlugs.toSorted());
  await Promise.all(
    imageAssets.map((asset) => access(new URL(`public/technologies/${asset}`, root))),
  );
  assert.match(imageComponent, /import Image from 'next\/image'/);
  assert.match(imageComponent, /onError/);
  assert.match(imageComponent, /woocommerce: '\/technologies\/woocommerce\.png'/);
  assert.match(imageComponent, /postman: '\/technologies\/postman\.png'/);
});
