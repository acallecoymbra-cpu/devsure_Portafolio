import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin experiences exposes protected CRUD pages wired to the experiences API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/experiences/page.tsx',
    'src/app/admin/(protected)/experiences/new/page.tsx',
    'src/app/admin/(protected)/experiences/[id]/edit/page.tsx',
    'src/features/admin/components/experience-list.tsx',
    'src/features/admin/components/experience-form.tsx',
    'src/features/admin/components/repeater-field.tsx',
    'src/features/admin/components/tags-input.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/experience-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/experience-form.tsx', root),
    'utf8',
  );
  const repeater = await readFile(
    new URL('src/features/admin/components/repeater-field.tsx', root),
    'utf8',
  );
  const tagsInput = await readFile(
    new URL('src/features/admin/components/tags-input.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/experiences/);
  assert.match(api, /listExperiences/);
  assert.match(api, /createExperience/);
  assert.match(api, /updateExperience/);
  assert.match(api, /deleteExperience/);
  assert.match(types, /Experience/);
  assert.match(shell, /admin\/experiences/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /RepeaterField/);
  assert.match(form, /TagsInput/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /minItems=\{1\}/);
  assert.match(form, /status === 409/);
  assert.match(form, /beforeunload/);
  assert.match(repeater, /minItems/);
  assert.match(tagsInput, /onKeyDown/);
});
