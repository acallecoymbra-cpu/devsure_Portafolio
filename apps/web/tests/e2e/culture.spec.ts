import { expect, test } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

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

  await page.getByRole('button', { name: 'Pausar carrusel' }).click();
  await expect(page.getByRole('heading', { name: 'Escuchamos antes de construir' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente historia' }).click();
  await expect(page.getByRole('heading', { name: 'La calidad se demuestra' })).toBeVisible();
  await page.getByRole('button', { name: /Ir a la historia 3:/ }).click();
  await expect(page.getByRole('heading', { name: 'Crecemos con cada entrega' })).toBeVisible();

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

test('stops automatic movement when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cultura');

  await expect(page.getByRole('button', { name: 'Reproducir carrusel' })).toBeVisible();
});
