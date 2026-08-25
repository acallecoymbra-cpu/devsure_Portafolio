import { defineConfig } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3001/api/v1';
const webUrl = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: webUrl,
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node tests/start-e2e-api.mjs',
      cwd: __dirname,
      url: `${apiUrl}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'node tests/start-e2e-web.mjs',
      cwd: __dirname,
      url: webUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
