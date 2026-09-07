import { expect, test } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

test('presents one primary action and never requests the retired hero media', async ({ page }) => {
  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));

  await page.goto('/');

  const hero = page.getByTestId('home-hero');
  await expect(hero).toBeVisible();
  await expect(
    hero.getByRole('heading', {
      level: 1,
      name: 'Construimos software claro desde la primera decisión.',
    }),
  ).toBeVisible();
  await expect(hero.getByTestId('home-hero-signal')).toBeVisible();
  await expect(hero.locator('ol > li')).toHaveCount(3);
  await expect(hero.locator('video')).toHaveCount(0);

  const primaryAction = hero.getByRole('link', { name: 'Explorar tecnologías' });
  await expect(primaryAction).toHaveAttribute('href', '#tecnologias');
  await expect(hero.locator('.button-primary')).toHaveCount(1);
  expect(requestedUrls.some((url) => /\.mkv|hero-poster\.jpg/i.test(url))).toBe(false);
});

for (const viewport of viewports) {
  test(`keeps the hero usable without horizontal overflow at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const hero = page.getByTestId('home-hero');
    await expect(hero).toBeVisible();
    await expect(hero.getByTestId('home-hero-signal')).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);

    const primaryActionHeight = await hero
      .getByRole('link', { name: 'Explorar tecnologías' })
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(primaryActionHeight).toBeGreaterThanOrEqual(44);
  });
}

test('shows the finished signal without decorative motion when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const hero = page.getByTestId('home-hero');
  await expect(hero.getByTestId('home-hero-signal')).toBeVisible();

  const glowAnimation = await hero.getByTestId('home-hero-glow').evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { duration: style.animationDuration, name: style.animationName };
  });

  expect(glowAnimation.name).toBe('none');
  expect(Number.parseFloat(glowAnimation.duration)).toBeLessThanOrEqual(0.001);
});
