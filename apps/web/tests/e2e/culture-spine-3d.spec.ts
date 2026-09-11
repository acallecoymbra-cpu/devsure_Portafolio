import { expect, test } from '@playwright/test';

// Chromium has no real GPU in CI, so the WebGL spine only mounts with
// software rendering forced on. `launchOptions` must be set at the file's
// top level (Playwright rejects it inside a `describe`, since it forces a
// dedicated worker) — that's exactly why this lives in its own spec file
// instead of alongside culture.spec.ts's fallback-path tests.
test.use({
  contextOptions: { reducedMotion: 'no-preference' },
  launchOptions: {
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  },
});

test.beforeEach(async ({ page }) => {
  // The capability gate stays unchanged; emulate a capable test device.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
  });
});

test('renders changing refraction while pinned and resizes the drawing buffer', async ({ page }, testInfo) => {
  const renderErrors: string[] = [];
  page.on('pageerror', (error) => renderErrors.push(error.message));
  page.on('console', (message) => {
    if (/THREE.WebGLProgram|VALIDATE_STATUS|GL_INVALID|feedback loop|incomplete framebuffer/i.test(message.text())) {
      renderErrors.push(message.text());
    }
  });
  const atlasRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('spine-frames-atlas')) atlasRequests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/cultura');
  const canvas = page.locator('[class*="spineCanvasMount"] canvas');
  await expect(canvas).toHaveCount(1);
  const wrapper = page.locator('[class*="spineBackgroundRegion"]');
  const frames: Buffer[] = [];

  for (const fraction of [0.1, 0.5, 0.9]) {
    await wrapper.evaluate((element, position) => {
      const rect = element.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top + (rect.height - innerHeight) * position, behavior: 'instant' });
    }, fraction);
    // The sticky canvas should stay pinned at the top of the viewport for
    // this whole range (Slice 9: `spineBackgroundRegion` now spans the
    // story cards *and* the sections that scroll over the column as
    // foreground content — see culture.module.css).
    await expect
      .poll(async () => {
        const y = (await canvas.boundingBox())?.y ?? Number.NaN;
        return y >= -0.5 && y <= 1.5;
      })
      .toBe(true);
    // Capture only the column's central area so card changes cannot satisfy
    // the pixel comparison. The attachments also support human visual review.
    const frame = await page.screenshot({ clip: { x: 620, y: 160, width: 200, height: 550 } });
    frames.push(frame);
    await testInfo.attach(`spine-angle-${fraction}`, { body: frame, contentType: 'image/png' });
  }
  expect(frames[0].equals(frames[1])).toBe(false);
  expect(frames[1].equals(frames[2])).toBe(false);
  expect(atlasRequests).toEqual([]);

  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      const bounds = canvasElement.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      return Math.abs(canvasElement.width - Math.floor(bounds.width * dpr))
        + Math.abs(canvasElement.height - Math.floor(bounds.height * dpr));
    })).toBe(0);
    await expect(canvas).toBeVisible();
  }
  expect(renderErrors).toEqual([]);
});

test('removes the renderer on client navigation and mounts one on return', async ({ page }) => {
  await page.goto('/cultura');
  const canvas = page.locator('[class*="spineCanvasMount"] canvas');
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await expect(canvas).toHaveCount(1);
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(canvas).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(/\/cultura$/);
  }
  await expect(canvas).toHaveCount(1);
});

test('mounts the WebGL spine and keeps native keyboard scroll working', async ({ page }) => {
  await page.goto('/cultura');

  const canvas = page.locator('[class*="spineCanvasMount"] canvas');
  await expect(canvas).toHaveCount(1, { timeout: 10_000 });

  const canvasMount = page.locator('[class*="spineCanvasMount"]');
  await expect(canvasMount).toHaveAttribute('aria-hidden', 'true');

  // Unlike the fallback (all three story headings in the DOM at once), the
  // 3D path shows only the active card's caption at any given time. Scoped
  // to the caption overlay specifically — the page has other h3s
  // (culturePrinciples, now sharing spineBackgroundRegion as foreground
  // content per Slice 9) that aren't part of this.
  const captionOverlay = page.locator('[class*="spineCaptionOverlay"]');
  await expect(captionOverlay.getByRole('heading', { level: 3 })).toHaveCount(1);

  const scrollYBefore = await page.evaluate(() => window.scrollY);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollYBefore);
});

test('still falls back to the CSS spine when reduced motion is requested, even though WebGL is available', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cultura');

  await expect(page.locator('[class*="spineCanvasMount"] canvas')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Crecemos con cada entrega' })).toBeVisible();
});
