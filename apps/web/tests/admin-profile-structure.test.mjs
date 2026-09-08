import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin profile exposes a protected page wired to the profile API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/profile/page.tsx',
    'src/features/admin/components/profile-form.tsx',
    'src/features/admin/components/locale-tabs.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const adminPage = await readFile(new URL('src/app/admin/page.tsx', root), 'utf8');
  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/profile-form.tsx', root),
    'utf8',
  );
  const localeTabs = await readFile(
    new URL('src/features/admin/components/locale-tabs.tsx', root),
    'utf8',
  );
  const styles = await readFile(new URL('src/features/admin/admin.module.css', root), 'utf8');

  assert.match(adminPage, /\/admin\/profile/);
  assert.match(api, /\/admin\/profile/);
  assert.match(api, /getProfile/);
  assert.match(api, /updateProfile/);
  assert.match(types, /Profile/);
  assert.match(types, /SUPPORTED_LOCALES/);
  assert.match(shell, /admin\/profile/);
  assert.match(form, /LocaleTabs/);
  assert.match(form, /activeLocales/);
  assert.match(form, /defaultLocale/);
  assert.match(form, /status === 409/);
  assert.match(form, /beforeunload/);
  // Nosotros metrics strip (spec follow-up): a repeater of {value, suffix, label}.
  assert.match(form, /RepeaterField/);
  assert.match(form, /stats/);
  assert.match(localeTabs, /role="tablist"/);
  assert.match(localeTabs, /role="tabpanel"/);
  assert.match(styles, /localeTab/);
});
