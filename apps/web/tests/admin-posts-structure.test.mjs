import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin posts exposes protected CRUD pages wired to the posts API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/posts/page.tsx',
    'src/app/admin/(protected)/posts/new/page.tsx',
    'src/app/admin/(protected)/posts/[id]/edit/page.tsx',
    'src/features/admin/components/post-list.tsx',
    'src/features/admin/components/post-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/post-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/post-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/posts/);
  assert.match(api, /listPosts/);
  assert.match(api, /createPost/);
  assert.match(api, /updatePost/);
  assert.match(api, /deletePost/);
  assert.match(types, /PostInput/);
  assert.match(types, /POST_CATEGORIES/);
  assert.match(shell, /admin\/posts/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /beforeunload/);
  // Draft/publish, spec §11.2's <DraftPublishField>: an empty `publishedAt` means draft.
  assert.match(form, /datetime-local/);
});
