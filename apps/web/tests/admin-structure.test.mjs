import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin technologies exposes protected routes and private metadata', async () => {
  const requiredFiles = [
    'src/app/admin/layout.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/(auth)/login/page.tsx',
    'src/app/admin/(protected)/layout.tsx',
    'src/app/admin/(protected)/technologies/page.tsx',
    'src/app/admin/(protected)/technologies/new/page.tsx',
    'src/app/admin/(protected)/technologies/[id]/edit/page.tsx',
    'src/features/admin/api/admin-api.ts',
    'src/features/admin/components/admin-shell.tsx',
    'src/features/admin/components/technology-list.tsx',
    'src/features/admin/components/technology-form.tsx',
    'src/features/admin/admin.module.css',
    'tests/e2e/admin-technologies.spec.ts',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const layout = await readFile(new URL('src/app/admin/layout.tsx', root), 'utf8');
  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/technology-form.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/technology-list.tsx', root),
    'utf8',
  );
  const styles = await readFile(new URL('src/features/admin/admin.module.css', root), 'utf8');

  assert.match(layout, /index: false/);
  assert.match(layout, /follow: false/);
  assert.match(api, /credentials: 'include'/);
  assert.doesNotMatch(api, /document\.cookie|localStorage|sessionStorage/);
  assert.match(api, /session\.csrfToken/);
  assert.match(api, /X-CSRF-Token/);
  assert.match(api, /\/auth\/login/);
  assert.match(api, /\/auth\/me/);
  assert.match(api, /\/auth\/logout/);
  assert.match(api, /\/auth\/change-password/);
  assert.match(api, /\/admin\/technologies/);
  assert.match(shell, /currentUser\.role !== 'ADMIN'/);
  assert.match(shell, /user\?\.mustChangePassword/);
  assert.match(form, /beforeunload/);
  assert.match(form, /status === 409/);
  assert.match(list, /items\.length === 0/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(styles, /@media \(min-width: 48rem\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /:focus-visible/);
});
