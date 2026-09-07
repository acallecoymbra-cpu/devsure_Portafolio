import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('the culture route has local content, accessible carousels, and metadata', async () => {
  const requiredFiles = [
    'src/app/cultura/page.tsx',
    'src/features/culture/culture-content.ts',
    'src/features/culture/components/culture-carousels.tsx',
    'src/features/culture/culture.module.css',
    'public/culture/collaboration.png',
    'public/culture/quality.png',
    'public/culture/growth.png',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const page = await readFile(new URL('src/app/cultura/page.tsx', root), 'utf8');
  const content = await readFile(new URL('src/features/culture/culture-content.ts', root), 'utf8');
  const carousels = await readFile(
    new URL('src/features/culture/components/culture-carousels.tsx', root),
    'utf8',
  );
  const header = await readFile(new URL('src/components/site-header.tsx', root), 'utf8');

  assert.match(page, /canonical: '\/cultura'/);
  assert.match(page, /'@type': 'AboutPage'/);
  assert.match(page, /CultureCarousel/);
  assert.match(page, /CompanyCarousel/);
  assert.equal((content.match(/id: '(listen|quality|evolve)'/g) ?? []).length, 3);
  assert.doesNotMatch(content, /https?:\/\//);
  assert.match(carousels, /aria-roledescription="carrusel"/);
  assert.match(carousels, /prefers-reduced-motion: reduce/);
  assert.match(carousels, /Pausar carrusel/);
  assert.match(header, /href: '\/cultura', label: 'CULTURA'/);
  assert.match(header, /aria-current/);
});
