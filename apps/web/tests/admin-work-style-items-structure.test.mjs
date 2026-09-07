import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin work style items exposes protected CRUD pages wired to the work-style-items API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/work-style-items/page.tsx',
    'src/app/admin/(protected)/work-style-items/new/page.tsx',
    'src/app/admin/(protected)/work-style-items/[id]/edit/page.tsx',
    'src/features/admin/components/work-style-item-list.tsx',
    'src/features/admin/components/work-style-item-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/work-style-item-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/work-style-item-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/work-style-items/);
  assert.match(api, /listWorkStyleItems/);
  assert.match(api, /createWorkStyleItem/);
  assert.match(api, /updateWorkStyleItem/);
  assert.match(api, /deleteWorkStyleItem/);
  assert.match(types, /WorkStyleItem/);
  assert.match(shell, /admin\/work-style-items/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /beforeunload/);
  assert.doesNotMatch(form, /RepeaterField|TagsInput|FileUploadField/);
});
