import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('admin testimonials exposes protected CRUD pages wired to the testimonials API contract', async () => {
  const requiredFiles = [
    'src/app/admin/(protected)/testimonials/page.tsx',
    'src/app/admin/(protected)/testimonials/new/page.tsx',
    'src/app/admin/(protected)/testimonials/[id]/edit/page.tsx',
    'src/features/admin/components/testimonial-list.tsx',
    'src/features/admin/components/testimonial-form.tsx',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const api = await readFile(new URL('src/features/admin/api/admin-api.ts', root), 'utf8');
  const types = await readFile(new URL('src/features/admin/types.ts', root), 'utf8');
  const shell = await readFile(
    new URL('src/features/admin/components/admin-shell.tsx', root),
    'utf8',
  );
  const list = await readFile(
    new URL('src/features/admin/components/testimonial-list.tsx', root),
    'utf8',
  );
  const form = await readFile(
    new URL('src/features/admin/components/testimonial-form.tsx', root),
    'utf8',
  );

  assert.match(api, /\/admin\/testimonials/);
  assert.match(api, /listTestimonials/);
  assert.match(api, /createTestimonial/);
  assert.match(api, /updateTestimonial/);
  assert.match(api, /deleteTestimonial/);
  assert.match(types, /Testimonial/);
  assert.match(shell, /admin\/testimonials/);
  assert.match(list, /status === 'loading'/);
  assert.match(list, /status === 'error'/);
  assert.match(form, /FileUploadField/);
  assert.match(form, /beforeunload/);
  // Testimonials has no translatable fields (spec §5.11) — unlike Faqs/Studies, its
  // form is not locale-aware; this is intentional, not an oversight.
  assert.doesNotMatch(form, /LocaleTabs|RepeaterField|TagsInput/);
});
