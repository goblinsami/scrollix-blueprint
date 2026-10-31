import { createDefaultProject } from '../src/contracts/defaults';
import { waitForRendered } from './rendered';
import { test, expect } from './fixtures';
import { changedPixels } from './pngPixels';
import type { Page, TestInfo } from 'playwright/test';
const view = (page: Page) => page.getByTestId('blueprint-viewport');
async function number(page: Page, key: string) { return Number(await view(page).getAttribute('data-' + key)); }
async function ready(page: Page) { await page.goto('/'); await expect(view(page)).toHaveAttribute('data-scene-ready', 'true'); await expect.poll(() => number(page, 'render-count')).toBeGreaterThan(0); await waitForRendered(page); }
async function button(page: Page, name: string) { const before = await number(page, 'render-count'); await page.getByRole('button', { name, exact: true }).click(); await expect.poll(() => number(page, 'render-count')).toBeGreaterThan(before); await waitForRendered(page); }
async function capture(page: Page, info: TestInfo, name: string) { await waitForRendered(page); const image = await page.locator('canvas[role="img"]').screenshot({ path: info.outputPath(name + '.png') }); await info.attach(name, { body: image, contentType: 'image/png' }); return image; }
async function camera(page: Page) { return (await view(page).getAttribute('data-camera-position'))!.split(',').map(Number); }

// Reach canonical timeline points through native range keyboard interactions.
async function keyboardProgress(page: Page, progress: number) {
  const slider=page.getByRole('slider',{name:'Progreso'});await slider.focus();await slider.press('Home');
  const target=progress*100;
  for(let i=0;i<Math.floor(target/10);i++)await slider.press('PageUp');
  const remaining=Math.round((target-Number(await slider.inputValue()))/.1);
  for(let i=0;i<Math.abs(remaining);i++)await slider.press(remaining>0?'ArrowRight':'ArrowLeft');
  await expect.poll(()=>number(page,'progress')).toBeCloseTo(progress,3);await waitForRendered(page);
}
test('Spatial Draw → Extrude → Reveal reconstructs earlier camera and walls', async ({ page }, info) => {
  await ready(page);
  const initial = await capture(page, info, 'sequence-initial');
  await keyboardProgress(page, createDefaultProject().timeline.drawEnd);
  await expect.poll(() => number(page, 'wall-height')).toBeCloseTo(0, 3);
  const draw = await capture(page, info, 'sequence-draw-complete'); const drawCamera = await camera(page);
  await button(page, 'Extrude');
  await expect.poll(() => number(page, 'wall-height')).toBeCloseTo(1.5, 2);
  await expect(view(page)).toHaveAttribute('data-phase', 'extrude');
  const extrude = await capture(page, info, 'sequence-extrude'); const extrudeCamera = await camera(page);
  expect(changedPixels(draw, extrude)).toBeGreaterThan(100);
  expect(extrudeCamera).not.toEqual(drawCamera);
  await button(page, 'Reveal');
  await expect.poll(() => number(page, 'wall-height')).toBeCloseTo(3, 3);
  await expect(view(page)).toHaveAttribute('data-phase', 'reveal');
  const reveal = await capture(page, info, 'sequence-reveal');
  expect(changedPixels(extrude, reveal)).toBeGreaterThan(100); expect(await camera(page)).not.toEqual(extrudeCamera);
  expect(await number(page, 'line-segments-visible')).toBe(await number(page, 'line-segments-total'));
  await button(page, 'Extrude');
  await expect.poll(() => number(page, 'wall-height')).toBeCloseTo(1.5, 2);
  const reverse = await capture(page, info, 'sequence-extrude-reversed');
  expect(changedPixels(extrude, reverse, 0), 'Same progress restores exact geometry/camera pixels').toBe(0);
  await button(page, 'Inicio');
  await expect.poll(() => number(page, 'wall-height')).toBe(0);
  const reset = await capture(page, info, 'sequence-reset'); expect(changedPixels(initial, reset, 0)).toBe(0);
});

test('native wheel reaches and reverses all phases and Reveal resizes without losing geometry', async ({ page }) => {
  await ready(page);
  const distance=await number(page,'scroll-distance');
  await view(page).hover(); await page.mouse.wheel(0, distance*.42);
  await expect(view(page)).toHaveAttribute('data-phase', 'extrude');
  await expect.poll(() => number(page, 'wall-height')).toBeGreaterThan(0);
  await page.mouse.wheel(0, distance*.38); await expect(view(page)).toHaveAttribute('data-phase', 'reveal');
  await expect.poll(() => number(page, 'wall-height')).toBeCloseTo(3, 3);
  await page.mouse.wheel(0, -distance*.50); await expect(view(page)).toHaveAttribute('data-phase', 'draw');
  await expect.poll(() => number(page, 'wall-height')).toBe(0);
  await button(page, 'Reveal');
  const size = page.viewportSize()!, beforeResize = await number(page, 'render-count');
  const oldBacking = await page.locator('canvas').evaluate(canvas => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }));
  await page.setViewportSize({ width: size.width + 100, height: size.height + 80 });
  await expect.poll(() => number(page, 'render-count')).toBeGreaterThan(beforeResize);
  await expect.poll(() => page.locator('canvas').evaluate(canvas => JSON.stringify({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height }))).not.toBe(JSON.stringify(oldBacking));
  await expect.poll(() => number(page, 'wall-height')).toBeCloseTo(3, 3);
  await expect(page.locator('canvas[role="img"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test('public mount/update/dispose cycles remove actual canvases and retain no active runtime', async ({ page }) => {
  await ready(page);
  const cycles = await page.evaluate(async () => {
    const entry = '/src/index.ts'; const { mountBlueprint, createDefaultProject } = await import(entry);
    const results: Array<{ mounted: number; updated: number; removed: number; disposed: boolean }> = [];
    for (let i = 0; i < 3; i++) {
      const container = document.createElement('div'); container.style.cssText = 'width:640px;height:360px;position:fixed;left:0;top:0;'; document.body.append(container);
      const runtime = await mountBlueprint(container, createDefaultProject());
      const mounted = container.querySelectorAll('canvas').length;
      runtime.setProgress(1); runtime.resize(640, 360, 1);
      const project = createDefaultProject(); project.art.preset = 'material-study'; await runtime.updateProject(project);
      const updated = container.querySelectorAll('canvas').length;
      runtime.dispose(); runtime.dispose();
      results.push({ mounted, updated, removed: container.querySelectorAll('canvas').length, disposed: runtime.getState().disposed }); container.remove();
    }
    return results;
  });
  expect(cycles).toEqual(Array.from({ length: 3 }, () => ({ mounted: 1, updated: 1, removed: 0, disposed: true })));
  await expect(page.locator('canvas[role="img"]')).toHaveCount(1);
});

test('final Reveal reaches aerial elevation and holds the same frame through the remaining scroll',async({page,isMobile},info)=>{
  await ready(page);const project=createDefaultProject();await keyboardProgress(page,project.camera.storyboard.holdStart);
  await expect(view(page)).toHaveAttribute('data-camera-profile',isMobile?'mobile':'desktop');
  const elevation=Number(await view(page).getAttribute('data-camera-elevation'));expect(elevation).toBeGreaterThanOrEqual(55);expect(elevation).toBeLessThanOrEqual(70);
  const pose=await view(page).getAttribute('data-camera-position'),lookAt=await view(page).getAttribute('data-camera-look-at');
  const first=await capture(page,info,'hold-arrival');await button(page,'Reveal');
  expect(await view(page).getAttribute('data-camera-position')).toBe(pose);expect(await view(page).getAttribute('data-camera-look-at')).toBe(lookAt);
  const last=await capture(page,info,'hold-final');expect(changedPixels(first,last,0),'Hold is a spatially fixed frame, not a timer or a slow orbit').toBe(0);
});