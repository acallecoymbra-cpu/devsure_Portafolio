import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin services exposes protected CRUD pages wired to the services API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/services/page.tsx',
    'src/app/admin/(protected)/services/new/page.tsx',
    'src/app/admin/(protected)/services/[id]/edit/page.tsx',
    'src/features/admin/components/service-list.tsx',
    'src/features/admin/components/service-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/service-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/service-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/services/);
  assert.match(api, /listServices/);
  assert.match(api, /createService/);
  assert.match(api, /updateService/);
  assert.match(api, /deleteService/);
  assert.match(types, /ServiceContent/);
  assert.match(shell, /admin\/services/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /ti-server/);
  assert.match(form, /beforeunload/);
  assert.doesNotMatch(form, /RepeaterField|TagsInput|FileUploadField/);
});
