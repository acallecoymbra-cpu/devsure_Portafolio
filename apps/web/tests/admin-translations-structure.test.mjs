import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin translations exposes a protected page wired to the translations API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/translations/page.tsx',
    'src/features/admin/components/translations-form.tsx',
    'src/features/admin/lib/translatable-form.ts',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/translations-form.tsx', root),
    'utf8',
  );
  const styles = await readFile(new URL('src/features/admin/admin.module.css', root), 'utf8');

  assert.match(api, /\/admin\/translations/);
  assert.match(api, /getTranslations/);
  assert.match(api, /updateTranslations/);
  assert.match(types, /Translations/);
  assert.match(shell, /admin\/translations/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /heroTag/);
  assert.match(form, /aboutHeading/);
  assert.match(form, /faqHeading/);
  assert.match(form, /<details/);
  assert.match(form, /beforeunload/);
  assert.match(styles, /collapsible/);
});
