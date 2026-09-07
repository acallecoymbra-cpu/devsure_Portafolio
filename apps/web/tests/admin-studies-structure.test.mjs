import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin studies exposes protected CRUD pages wired to the studies API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/studies/page.tsx',
    'src/app/admin/(protected)/studies/new/page.tsx',
    'src/app/admin/(protected)/studies/[id]/edit/page.tsx',
    'src/features/admin/components/study-list.tsx',
    'src/features/admin/components/study-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/study-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/study-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/studies/);
  assert.match(api, /listStudies/);
  assert.match(api, /createStudy/);
  assert.match(api, /updateStudy/);
  assert.match(api, /deleteStudy/);
  assert.match(types, /Study/);
  assert.match(shell, /admin\/studies/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /inProgress/);
  assert.match(form, /beforeunload/);
  assert.doesNotMatch(form, /RepeaterField|TagsInput/);
});
