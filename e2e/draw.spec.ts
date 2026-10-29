import { waitForRendered } from './rendered';
import { test, expect } from './fixtures';
import { changedPixels } from './pngPixels';
import type { Page, TestInfo } from 'playwright/test';
const view = (page: Page) => page.getByTestId('blueprint-viewport');
async function read(page: Page, key: string) { return Number(await view(page).getAttribute('data-' + key)); }
async function ready(page: Page) {
  await page.goto('/');
  await expect(view(page)).toHaveAttribute('data-scene-ready', 'true');
  await expect(page.locator('canvas[role="img"]')).toHaveCount(1);
  await expect.poll(() => read(page, 'render-count')).toBeGreaterThan(0);
  await waitForRendered(page);
}
async function move(page: Page, button: string, expected: number) {
  const before = await read(page, 'render-count');
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect.poll(() => read(page, 'progress')).toBeCloseTo(expected, 2);
  await expect.poll(() => read(page, 'render-count')).toBeGreaterThan(before);
  await waitForRendered(page);
}
async function capture(page: Page, info: TestInfo, name: string) {
  await waitForRendered(page);
  const image = await page.locator('canvas[role="img"]').screenshot({ path: info.outputPath(name + '.png') });
  await info.attach(name, { body: image, contentType: 'image/png' }); return image;
}

test('Draw renders real pixels progressively and reconstructs the same plan in reverse', async ({ page }, info) => {
  await ready(page);
  expect(await read(page, 'line-segments-visible')).toBe(0);
  const initial = await capture(page, info, 'draw-initial');
  await move(page, 'Draw', 0.175);
  const partialCount = await read(page, 'line-segments-visible'), total = await read(page, 'line-segments-total');
  expect(partialCount).toBeGreaterThan(0); expect(partialCount).toBeLessThan(total);
  const partial = await capture(page, info, 'draw-partial');
  expect(changedPixels(initial, partial), 'Actual draw changes visible pixels').toBeGreaterThan(100);
  await move(page, 'Extrude', 0.525);
  await expect.poll(() => read(page, 'line-segments-visible')).toBe(total);
  const complete = await capture(page, info, 'draw-complete');
  expect(changedPixels(partial, complete), 'Door and dimensions add visible pixels').toBeGreaterThan(100);
  await move(page, 'Draw', 0.175);
  expect(await read(page, 'line-segments-visible')).toBe(partialCount);
  const reversed = await capture(page, info, 'draw-reversed');
  expect(changedPixels(partial, reversed, 0), 'Same progress reconstructs same rendered image').toBe(0);
  await move(page, 'Inicio', 0);
  expect(await read(page, 'line-segments-visible')).toBe(0);
  const reset = await capture(page, info, 'draw-reset');
  expect(changedPixels(initial, reset, 0)).toBe(0);
});

test('preset rebuilds leave one real canvas with stable resource budgets', async ({ page }, info) => {
  await ready(page);
  await move(page, 'Extrude', 0.525);
  const baseline = { geometries: await read(page, 'geometries'), materials: await read(page, 'materials'), textures: await read(page, 'textures') };
  expect(baseline.geometries).toBeGreaterThan(0); expect(baseline.textures).toBe(2);
  const initial = await capture(page, info, 'preset-initial');
  const initialCamera = await view(page).getAttribute('data-camera-position');
  const initialBounds = await page.locator('canvas').evaluate(canvas => ({width:(canvas as HTMLCanvasElement).width,height:(canvas as HTMLCanvasElement).height}));
  for (const preset of ['inverted-blueprint', 'material-study', 'paper', 'inverted-blueprint', 'paper']) {
    await page.getByLabel('Preset', { exact: true }).selectOption(preset);
    await expect(page.locator('.studio-shell')).toHaveAttribute('data-preset', preset);
    await expect(view(page)).toHaveAttribute('data-scene-ready', 'true');
    await expect(page.locator('canvas[role="img"]')).toHaveCount(1);
    expect(await read(page, 'geometries')).toBe(baseline.geometries);
    expect(await read(page, 'materials')).toBe(baseline.materials);
    expect(await read(page, 'textures')).toBe(baseline.textures);
    await expect.poll(() => read(page, 'progress')).toBeCloseTo(0.525, 2);
    const image = await capture(page, info, 'preset-' + preset);
    if(preset === 'paper') { expect(await view(page).getAttribute('data-camera-position')).toBe(initialCamera); expect(await page.locator('canvas').evaluate(canvas => ({width:(canvas as HTMLCanvasElement).width,height:(canvas as HTMLCanvasElement).height}))).toEqual(initialBounds); }
    if (preset === 'inverted-blueprint') expect(changedPixels(initial, image)).toBeGreaterThan(1000);
    if (preset === 'paper') expect(changedPixels(initial, image, 0)).toBe(0);
  }
  await move(page, 'Reveal', 1);
  for (const preset of ['inverted-blueprint', 'material-study', 'paper']) {
    await page.getByLabel('Preset', { exact: true }).selectOption(preset);
    await expect(page.locator('.studio-shell')).toHaveAttribute('data-preset', preset);
    await waitForRendered(page);
    await expect.poll(() => read(page, 'wall-height')).toBeCloseTo(3, 3);
    await expect(page.locator('canvas[role="img"]')).toHaveCount(1);
    await capture(page, info, 'reveal-' + preset);
  }
});
