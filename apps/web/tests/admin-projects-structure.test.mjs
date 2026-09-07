import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin projects exposes protected CRUD pages wired to the projects API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/projects/page.tsx',
    'src/app/admin/(protected)/projects/new/page.tsx',
    'src/app/admin/(protected)/projects/[id]/edit/page.tsx',
    'src/features/admin/components/project-list.tsx',
    'src/features/admin/components/project-form.tsx',
    'src/features/admin/components/gallery-field.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/project-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/project-form.tsx', root),
    'utf8',
  );
  const gallery = await readFile(
    new URL('src/features/admin/components/gallery-field.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/projects/);
  assert.match(api, /listProjects/);
  assert.match(api, /createProject/);
  assert.match(api, /updateProject/);
  assert.match(api, /deleteProject/);
  assert.match(types, /Project/);
  assert.match(shell, /admin\/projects/);
  assert.match(list, /Personal/);
  assert.match(list, /statusPublished/);
  assert.match(form, /RepeaterField/);
  assert.match(form, /GalleryField/);
  assert.match(form, /TagsInput/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /datetime-local/);
  assert.match(form, /featured/);
  assert.match(form, /beforeunload/);
  assert.match(gallery, /multiple/);
  assert.match(gallery, /Mover arriba/);
});
