import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin strengths exposes protected CRUD pages wired to the strengths API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/strengths/page.tsx',
    'src/app/admin/(protected)/strengths/new/page.tsx',
    'src/app/admin/(protected)/strengths/[id]/edit/page.tsx',
    'src/features/admin/components/strength-list.tsx',
    'src/features/admin/components/strength-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/strength-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/strength-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/strengths/);
  assert.match(api, /listStrengths/);
  assert.match(api, /createStrength/);
  assert.match(api, /updateStrength/);
  assert.match(api, /deleteStrength/);
  assert.match(types, /Strength/);
  assert.match(shell, /admin\/strengths/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /TagsInput/);
  assert.match(form, /beforeunload/);
  assert.doesNotMatch(form, /RepeaterField|FileUploadField/);
});
