import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin uploads wires a reusable FileUploadField into the profile form', async () => {
  const requiredFiles = ['src/features/admin/components/file-upload-field.tsx'];
  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const field = await readFile(
    new URL('src/features/admin/components/file-upload-field.tsx', root),
    'utf8',
  );
  const profileForm = await readFile(
    new URL('src/features/admin/components/profile-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/uploads/);
  assert.match(api, /uploadFile/);
  assert.match(api, /instanceof FormData/);
  assert.match(types, /UploadFolder/);
  assert.match(types, /UploadResult/);
  assert.match(field, /status === 413/);
  assert.match(field, /status === 415/);
  assert.match(field, /type="file"/);
  assert.match(field, /type="hidden"/);
  assert.match(profileForm, /FileUploadField/);
  assert.match(profileForm, /folder="avatars"/);
  assert.match(profileForm, /folder="resumes"/);
});
