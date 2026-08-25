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
    'src/lib/config.ts',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const layout = await readFile(new URL('src/app/layout.tsx', root), 'utf8');
  const config = await readFile(new URL('src/lib/config.ts', root), 'utf8');

  assert.match(layout, /export const metadata/);
  assert.match(layout, /metadataBase/);
  assert.match(config, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(layout, /Saltar al contenido/);
  assert.match(layout, /canonical/);
});

test('the technologies slice consumes the shared contract and models every public state', async () => {
  const requiredFiles = [
    'src/features/technologies/api/get-technologies.ts',
    'src/features/technologies/category-registry.ts',
    'src/features/technologies/icon-registry.tsx',
    'src/features/technologies/components/technologies-section.tsx',
    'src/features/technologies/components/technologies-skeleton.tsx',
    'src/features/technologies/components/technologies-error-boundary.tsx',
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

  assert.match(apiClient, /PaginatedResponse<TechnologyCard>/);
  assert.match(apiClient, /limit=\$\{PAGE_LIMIT\}/);
  assert.match(apiClient, /cache: 'no-store'/);
  assert.match(apiClient, /technologiesById/);
  assert.equal((categories.match(/\{ key:/g) ?? []).length, 10);
  assert.match(icons, /fallbackIcon/);
  assert.match(section, /technologies.length > 0/);
  assert.match(section, /TechnologyExplorer/);
});
