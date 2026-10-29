import { waitForRendered } from './rendered';
import { test, expect } from './fixtures';
import type { Page } from 'playwright/test';

const viewport = (page: Page) => page.getByTestId('blueprint-viewport');
async function progress(page: Page) { return Number(await viewport(page).getAttribute('data-progress')); }
async function ready(page: Page) {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(viewport(page)).toHaveAttribute('data-disposed', 'false');
  await expect(page.getByRole('slider', { name: 'Progreso' })).toBeVisible();
  await expect(page.getByLabel('Preset', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toBeHidden();
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), 'No horizontal overflow').toBe(false); }

test('loads a usable playground with visible controls at each viewport', async ({ page }, info) => {
  await ready(page);
  await expect(page.getByRole('heading', { name: 'From line to space' })).toBeVisible();
  await expect.poll(() => progress(page)).toBeCloseTo(0, 2);
  await noOverflow(page);
  const bounds = await viewport(page).boundingBox(); expect(bounds?.width).toBeGreaterThan(200); expect(bounds?.height).toBeGreaterThan(100);
  await waitForRendered(page);
  await info.attach('playground-initial', { body: await page.screenshot(), contentType: 'image/png' });
});

test('range keyboard and phase buttons share progress with native scrolling', async ({ page }) => {
  await ready(page);
  const slider = page.getByRole('slider', { name: 'Progreso' });
  await slider.focus(); await slider.press('End');
  await expect.poll(() => progress(page)).toBeCloseTo(1, 2);
  await expect(viewport(page)).toHaveAttribute('data-phase', 'reveal');
  await slider.press('Home');
  await expect.poll(() => progress(page)).toBeCloseTo(0, 2);
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(0.175, 2);
  await page.getByRole('button', { name: 'Extrude', exact: true }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(0.525, 2);
  await page.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(0, 2);
});

test('wheel traverses forwards and backwards and releases the page at the end', async ({ page }) => {
  await ready(page);
  await viewport(page).hover(); await page.mouse.wheel(0, 800);
  await expect.poll(() => progress(page)).toBeGreaterThan(0.05);
  await page.mouse.wheel(0, -1200);
  await expect.poll(() => progress(page)).toBeCloseTo(0, 2);
  await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(1, 2);
  await page.mouse.wheel(0, 1200);
  await expect(page.getByRole('heading', { name: /Every space starts/ })).toBeInViewport();
  await page.getByRole('link', { name: /Volver al inicio/ }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(0, 2);
});

test('presets update the active project without losing progress or overflowing on resize', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  for (const preset of ['inverted-blueprint', 'material-study', 'paper']) {
    await page.getByLabel('Preset', { exact: true }).selectOption(preset);
    await expect(page.locator('.studio-shell')).toHaveAttribute('data-preset', preset);
    await expect.poll(() => progress(page)).toBeCloseTo(0.175, 2);
    await expect(page.getByRole('alert')).toBeHidden();
  }
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.width + 40, height: size.height });
  await noOverflow(page);
  await expect(viewport(page)).toBeVisible();
});

test('reduced motion remains operable and reload creates one fresh viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('.studio-shell')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(1, 2);
  await page.reload();
  await expect(viewport(page)).toHaveCount(1);
  await expect(viewport(page)).toHaveAttribute('data-disposed', 'false');
  await noOverflow(page);
});

test('pointer and mobile touchscreen can scrub the range and select a phase', async ({ page, isMobile }) => {
  await ready(page);
  const slider = page.getByRole('slider', { name: 'Progreso' });
  const box = (await slider.boundingBox())!;
  const x = box.x + box.width * 0.5, y = box.y + box.height / 2;
  if (isMobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
  await expect.poll(() => progress(page)).toBeGreaterThan(0.4);
  await expect.poll(() => progress(page)).toBeLessThan(0.6);
  await waitForRendered(page);
  if (isMobile) await page.getByRole('button', { name: 'Reveal', exact: true }).tap(); else await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await expect.poll(() => progress(page)).toBeCloseTo(1, 2); await waitForRendered(page);
});