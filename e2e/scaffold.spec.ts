import { test as base, expect } from 'playwright/test';

// Automatic fixture checks errors throughout each test, including resize and scroll.
const test = base.extend<{ monitor: void }>({
  monitor: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push('pageerror: ' + error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push('HTTP ' + response.status() + ': ' + response.url()); });
    page.on('requestfailed', request => errors.push('request: ' + request.url() + ' ' + request.failure()?.errorText));
    // Tests are local-only; unexpected remote requests fail instead of going online.
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') await route.continue();
      else { errors.push('Unexpected external request: ' + url.href); await route.abort(); }
    });
    await use();
    expect(errors, 'No runtime, network or console errors').toEqual([]);
  }, { auto: true }],
});

async function expectContent(page: import('playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Scrollix Blueprint', exact: true })).toBeVisible();
  await expect(page.getByText('Fase 0 preparada para revisión.', { exact: false })).toBeVisible();
  await expect(page.getByText('Contrato v1 · Three.js r176 · preset paper', { exact: true })).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows, 'No horizontal overflow').toBe(false);
}

test('loads the current scaffold and captures its visible state', async ({ page }, testInfo) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle('Scrollix Blueprint · Fase 0');
  await expectContent(page);
  await testInfo.attach('scaffold-full-page', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});

test('content survives native scroll, keyboard navigation and resize', async ({ page }) => {
  await page.goto('/');
  await expectContent(page);
  await page.mouse.wheel(0, 900);
  await page.keyboard.press('End');
  await expectContent(page);
  await page.keyboard.press('Home');
  await page.mouse.wheel(0, -900);
  const current = page.viewportSize()!;
  await page.setViewportSize({ width: current.width + 40, height: current.height });
  await expectContent(page);
});

test('remains readable when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expectContent(page);
});
