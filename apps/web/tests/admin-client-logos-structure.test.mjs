import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin client logos exposes protected CRUD pages wired to the client-logos API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/client-logos/page.tsx',
    'src/app/admin/(protected)/client-logos/new/page.tsx',
    'src/app/admin/(protected)/client-logos/[id]/edit/page.tsx',
    'src/features/admin/components/client-logo-list.tsx',
    'src/features/admin/components/client-logo-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/client-logo-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/client-logo-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/client-logos/);
  assert.match(api, /listClientLogos/);
  assert.match(api, /createClientLogo/);
  assert.match(api, /updateClientLogo/);
  assert.match(api, /deleteClientLogo/);
  assert.match(types, /ClientLogo/);
  assert.match(shell, /admin\/client-logos/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /beforeunload/);
  // Client logos has no translatable fields — plain trust-strip metadata, so
  // the form is not locale-aware; this is intentional, not an oversight.
  assert.doesNotMatch(form, /LocaleTabs|RepeaterField|TagsInput/);
});
