import { test as base, expect } from 'playwright/test';
import type { Page } from 'playwright/test';

export const test = base.extend<{ monitor: void }>({
  monitor: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push('pageerror: ' + error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push('HTTP ' + response.status() + ': ' + response.url()); });
    page.on('requestfailed', request => errors.push('request: ' + request.url() + ' ' + request.failure()?.errorText));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') await route.continue();
      else { errors.push('Unexpected external request: ' + url.href); await route.abort(); }
    });
    await use();
    expect(errors, 'No runtime, network or console errors').toEqual([]);
  }, { auto: true }],
});

export { expect } from 'playwright/test';
