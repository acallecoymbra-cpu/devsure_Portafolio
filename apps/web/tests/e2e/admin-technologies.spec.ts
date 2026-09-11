import { expect, test } from '@playwright/test';

// Cover the client guard without credentials or mutations to the seeded catalog.
for (const status of [401, 403, 503]) {
  test(`protects technology administration when session validation returns ${status}`, async ({ page }) => {
    const catalogRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/admin/technologies')) {
        catalogRequests.push(request.url());
      }
    });
    await page.route('**/auth/me', (route) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Session unavailable' }),
    }));

    await page.goto('/admin/technologies');

    if (status === 401) {
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', {
        name: status === 403
          ? 'No tienes permiso para administrar el catálogo'
          : 'No pudimos validar tu sesión',
      })).toBeVisible();
    }
    expect(catalogRequests).toEqual([]);
    await expect(page.getByRole('link', { name: /Nueva tecnología/ })).toHaveCount(0);
  });
}
