import { chromium } from '@playwright/test';

const outDir = 'C:\\Users\\aliva\\AppData\\Local\\Temp\\claude\\C--Users-aliva-Documents-Codex-2026-08-24-quie-outputs-DEVSURE-CODE\\d51c7648-38b9-431b-a632-cf5c0c6541cf\\scratchpad';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('https://devsureweb-production.up.railway.app/admin/login', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${outDir}\\admin-login-page.png` });

await page.fill('input[name="username"], input[type="text"]', 'admin');
await page.fill('input[type="password"]', 'bSRFySBUV7%qMDkxEfk');
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);
console.log('URL after login:', page.url());
await page.screenshot({ path: `${outDir}\\admin-after-login.png` });

// Now navigate to a protected admin page directly to see if the session persists.
await page.goto('https://devsureweb-production.up.railway.app/admin/profile', { waitUntil: 'networkidle' });
console.log('URL after visiting /admin/profile:', page.url());
await page.screenshot({ path: `${outDir}\\admin-profile-check.png` });

console.log('ERRORS:', JSON.stringify(errors, null, 2));
await browser.close();
