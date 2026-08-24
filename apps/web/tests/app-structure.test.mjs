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
});
