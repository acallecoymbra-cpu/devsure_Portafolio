import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin faqs exposes protected CRUD pages wired to the faqs API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/faqs/page.tsx',
    'src/app/admin/(protected)/faqs/new/page.tsx',
    'src/app/admin/(protected)/faqs/[id]/edit/page.tsx',
    'src/features/admin/components/faq-list.tsx',
    'src/features/admin/components/faq-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/faq-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/faq-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/faqs/);
  assert.match(api, /listFaqs/);
  assert.match(api, /createFaq/);
  assert.match(api, /updateFaq/);
  assert.match(api, /deleteFaq/);
  assert.match(types, /Faq/);
  assert.match(shell, /admin\/faqs/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /beforeunload/);
  assert.doesNotMatch(form, /RepeaterField|TagsInput|FileUploadField/);
});
