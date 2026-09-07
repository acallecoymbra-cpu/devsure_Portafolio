import { expect, test } from '@playwright/test';

const { execFileSync } = process.getBuiltinModule('node:child_process');
const databaseFixtureScript = `${process.cwd()}/tests/technology-db-fixture.mjs`;

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

test('publishes the 41 technologies exactly once and filters with the keyboard', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 2, name: 'Tecnologías que manejamos' }),
  ).toBeVisible();

  const cards = page.getByTestId('technology-card');
  await expect(cards).toHaveCount(41);
  const ids = await cards.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-technology-id')),
  );
  expect(new Set(ids).size).toBe(41);
  expect(ids.every(Boolean)).toBe(true);

  const availableImages = page.locator('[data-image-status="available"] img');
  await expect(availableImages).toHaveCount(41);
  for (const image of await availableImages.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element) => {
          const imageElement = element as HTMLImageElement;
          return imageElement.complete && imageElement.naturalWidth > 0;
        }),
      )
      .toBe(true);
  }
  const fallbackCards = page.locator('[data-testid="technology-card"]:has(.technology-icon)');
  await expect(fallbackCards).toHaveCount(0);

  const automationFilter = page.getByRole('button', {
    name: 'Automatización de pruebas web y mobile',
  });
  await automationFilter.focus();
  await page.keyboard.press('Enter');
  await expect(automationFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(7);

  const search = page.getByRole('searchbox', { name: 'Buscar por nombre' });
  await search.focus();
  const searchOutline = await search.locator('..').evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
  });
  expect(searchOutline.style).not.toBe('none');
  expect(searchOutline.width).toBeGreaterThanOrEqual(3);
  await search.fill('Playwright');
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText(['Playwright']);

  await page.getByRole('button', { name: 'Todas', exact: true }).click();
  await search.fill('sin coincidencias posibles');
  await expect(page.getByRole('heading', { name: 'No encontramos coincidencias' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(cards).toHaveCount(41);

  const controlHeights = await page
    .locator('.filter-chip, .search-control input')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  expect(controlHeights.every((height) => height >= 44)).toBe(true);
});

test('uses the technology icon when a mapped image cannot load', async ({ page }) => {
  await page.route(/\/_next\/image\?.*typescript\.png/i, (route) => route.abort());
  await page.route('**/technologies/typescript.png', (route) => route.abort());

  await page.goto('/');
  const typescriptCard = page.locator(
    '[data-testid="technology-card"][data-technology-id="00000000-0000-4000-8000-000000000006"]',
  );
  await typescriptCard.scrollIntoViewIfNeeded();
  await expect(typescriptCard.locator('[data-image-status="fallback"]')).toBeVisible();
  await expect(typescriptCard.locator('.technology-icon')).toHaveCount(1);
});

test('loads every API page when the catalog grows beyond 50 records', async ({ page }) => {
  applyDatabaseFixture('insert-extra');

  try {
    await page.goto('/');
    const cards = page.getByTestId('technology-card');
    await expect(cards).toHaveCount(53);
    const ids = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-technology-id')),
    );
    expect(new Set(ids).size).toBe(53);
  } finally {
    applyDatabaseFixture('delete-extra');
  }
});

test('shows the real empty state when the API has no published technologies', async ({ page }) => {
  applyDatabaseFixture('draft-all');

  try {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Aún no hay tecnologías publicadas' }),
    ).toBeVisible();
    await expect(page.getByTestId('technology-card')).toHaveCount(0);
  } finally {
    applyDatabaseFixture('publish-all');
  }
});

test('uses the neutral fallback when a technology has no image and an unknown icon key', async ({
  page,
}) => {
  applyDatabaseFixture('unknown-icon');

  try {
    await page.goto('/');
    const postmanCard = page.locator(
      '[data-testid="technology-card"][data-technology-id="00000000-0000-4000-8000-000000000041"]',
    );
    await expect(postmanCard).toBeVisible();
    await expect(postmanCard.locator('.technology-icon svg > rect[width="16"]')).toHaveCount(1);
  } finally {
    applyDatabaseFixture('restore-icon');
  }
});

test('recovers the technologies section after an API persistence error', async ({ page }) => {
  applyDatabaseFixture('hide-table');

  try {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'No pudimos cargar las tecnologías.' }),
    ).toBeVisible();
  } finally {
    applyDatabaseFixture('restore-table');
  }

  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByTestId('technology-card')).toHaveCount(41);
});

for (const viewport of viewports) {
  test(`has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByTestId('technology-card')).toHaveCount(41);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
}

test('mobile navigation closes with Escape and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: 'Menú' });
  await menuButton.focus();
  await page.keyboard.press('Enter');
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton).toBeFocused();
});

function applyDatabaseFixture(action: string): void {
  execFileSync(process.execPath, [databaseFixtureScript, action], { stdio: 'inherit' });
}
