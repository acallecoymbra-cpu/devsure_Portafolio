import { expect, test } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

// This suite exercises the CSS/JS fallback (`CultureSpine`) on purpose — see
// PLAN-CULTURA-SPINE-3D.md §2.4. Some environments (this one included) ship
// WebGL2 in headless Chromium with no special launch flags, so relying on
// "default launch = no WebGL" would make these tests non-deterministic
// across machines. Stubbing `getContext('webgl'|'webgl2')` to `null` forces
// `canRender3DSpine()` down the fallback path regardless of what the host
// actually supports; culture-spine-3d.spec.ts is what actually exercises
// the WebGL path (via forced software rendering), and it undoes none of
// this since it lives in its own file/worker.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const patched = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return originalGetContext.call(this, type as '2d', options as CanvasRenderingContext2DSettings);
    };
    HTMLCanvasElement.prototype.getContext = patched as typeof originalGetContext;
  });
});

test('opens Cultura from the main menu and tells the culture story', async ({ page }) => {
  await page.goto('/cultura');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Personas curiosas. Trabajo claro. Software que se sostiene.',
    }),
  ).toBeVisible();

  const cultureLink = page.getByRole('link', { name: 'CULTURA' });
  await expect(cultureLink).toHaveAttribute('aria-current', 'page');

  const firstHeading = page.getByRole('heading', { name: 'Escuchamos antes de construir' });
  await firstHeading.scrollIntoViewIfNeeded();
  await expect(firstHeading).toBeVisible();

  const secondHeading = page.getByRole('heading', { name: 'La calidad se demuestra' });
  await secondHeading.scrollIntoViewIfNeeded();
  await expect(secondHeading).toBeVisible();

  const thirdHeading = page.getByRole('heading', { name: 'Crecemos con cada entrega' });
  await thirdHeading.scrollIntoViewIfNeeded();
  await expect(thirdHeading).toBeVisible();

  const storyImage = page.getByRole('img', {
    name: /equipo avanzando junto a una estructura modular/i,
  });
  await expect(storyImage).toBeVisible();
  await expect
    .poll(() => storyImage.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);

  await expect(
    page.getByRole('heading', { name: 'Empresas para las que trabajamos.' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'AKKIKB' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Siguiente empresa' })).toHaveCount(0);
});

test('publishes page-specific metadata and structured data', async ({ page }) => {
  await page.goto('/cultura');

  await expect(page).toHaveTitle('Cultura | DevSure');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://devsure.example/cultura',
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://devsure.example/cultura',
  );

  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({
    '@type': 'AboutPage',
    about: { '@type': 'Organization', name: 'DevSure' },
  });
});

test('closes the mobile menu after selecting Cultura', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: 'Menú' });
  await menuButton.click();
  await page.getByRole('link', { name: 'CULTURA' }).click();

  await expect(page).toHaveURL(/\/cultura$/);
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});

for (const viewport of viewports) {
  test(`Cultura has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/cultura');

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
}

test('shows every culture step without waiting for scroll animation when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cultura');

  await expect(
    page.getByRole('heading', { name: 'Crecemos con cada entrega' }),
  ).toBeVisible();
});

// The default Chromium launch in this project has no real GPU/WebGL, so
// every test above (and every other test file, since launchOptions here are
// shared with the whole run) exercises the CSS/JS fallback (`CultureSpine`)
// regardless of what it asserts — that's intentional per
// PLAN-CULTURA-SPINE-3D.md (the fallback is the accessible, SEO-safe path
// most visitors and all crawlers get). The WebGL spine needs software
// rendering enabled to mount at all; see culture-spine-3d.spec.ts, which
// sets that launch flag at the file level (Playwright doesn't allow
// `test.use({ launchOptions })` inside a `describe` — it forces a worker
// change that only a top-level file/project config can request).
