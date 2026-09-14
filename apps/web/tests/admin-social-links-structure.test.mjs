import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin social links exposes protected CRUD pages wired to the social-links API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/social-links/page.tsx',
    'src/app/admin/(protected)/social-links/new/page.tsx',
    'src/app/admin/(protected)/social-links/[id]/edit/page.tsx',
    'src/features/admin/components/social-link-list.tsx',
    'src/features/admin/components/social-link-form.tsx',
    'src/components/social-links-menu.tsx',
    'src/components/social-icon-glyph.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/social-link-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/social-link-form.tsx', root),
    'utf8',
  );
  const menu = await readFile(new URL('src/components/social-links-menu.tsx', root), 'utf8');
  const chrome = await readFile(new URL('src/components/site-chrome.tsx', root), 'utf8');

  assert.match(api, /\/admin\/social-links/);
  assert.match(api, /listSocialLinks/);
  assert.match(api, /createSocialLink/);
  assert.match(api, /updateSocialLink/);
  assert.match(api, /deleteSocialLink/);
  assert.match(types, /SocialLink/);
  assert.match(shell, /admin\/social-links/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /network-icons/);
  assert.match(form, /beforeunload/);
  assert.match(menu, /SocialLinksMenu/);
  assert.match(chrome, /SocialLinksMenu/);
});
