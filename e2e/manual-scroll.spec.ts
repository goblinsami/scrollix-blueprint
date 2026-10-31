import {test,expect} from './fixtures';
import {waitForRendered} from './rendered';

test('calibrated native scroll is reversible, reduced motion holds an aerial pose, short sticky fits',async({page})=>{
  await page.goto('/');const view=page.getByTestId('blueprint-viewport');
  await expect(view).toHaveAttribute('data-scene-ready','true');
  const distance=Number(await view.getAttribute('data-scroll-distance'));
  const metrics=await page.evaluate(()=>({
    viewport:window.innerHeight,width:window.innerWidth,
    total:document.querySelector<HTMLElement>('[data-testid="journey"]')!.offsetHeight,
    sticky:document.querySelector<HTMLElement>('.studio-shell')!.offsetHeight,
  }));
  const screens=metrics.width<=600?6:10;
  expect(distance).toBe(metrics.viewport*screens);
  expect(metrics.total).toBe(metrics.viewport*(screens+1));
  expect(metrics.total-metrics.sticky).toBe(distance);
  const jump=async(p:number)=>{await page.evaluate(y=>window.scrollTo(0,y),Math.round(p*distance));await expect.poll(async()=>Number(await view.getAttribute('data-progress'))).toBeCloseTo(p,3);await expect.poll(()=>view.evaluate(el=>el.dataset.progress===el.dataset.targetProgress)).toBe(true);await waitForRendered(page);};
  await jump(.52);const pose=await view.getAttribute('data-camera-position');
  await jump(.8);await jump(.52);expect(await view.getAttribute('data-camera-position')).toBe(pose);
  await jump(1);await expect(view).toHaveAttribute('data-phase','reveal');
  expect((await page.locator('.studio-shell').boundingBox())!.y).toBe(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(async()=>Number(await view.getAttribute('data-camera-elevation'))).toBeCloseTo(62,5);
  const staticPose=await view.getAttribute('data-camera-position');
  await jump(.1);expect(await view.getAttribute('data-camera-position')).toBe(staticPose);
  expect(Number(await view.getAttribute('data-wall-height'))).toBe(3);
  await page.setViewportSize({width:800,height:450});
  const bounds=await page.locator('.studio-shell').boundingBox();expect(bounds!.height).toBe(450);
  expect((await view.boundingBox())!.height).toBeGreaterThan(100);
  await expect(view).toHaveAttribute('data-scroll-distance','4500');
  await page.setViewportSize({width:600,height:450});
  await expect(view).toHaveAttribute('data-scroll-distance','2700');
  await page.setViewportSize({width:601,height:450});
  await expect(view).toHaveAttribute('data-scroll-distance','4500');
});



test('native wheel input advances through intermediate frames, reverses and settles exactly', async ({page}) => {
  await page.goto('/'); const view=page.getByTestId('blueprint-viewport');
  await expect(view).toHaveAttribute('data-scene-ready','true'); await waitForRendered(page);
  // Observe the scroll event's target before the next smoothing RAF can catch up.
  const first=await page.evaluate(async()=>{
    const view=document.querySelector<HTMLElement>('[data-testid="blueprint-viewport"]')!;
    const distance=Number(view.dataset.scrollDistance);
    window.scrollTo({top:Math.round(distance*.65),behavior:'instant'});
    while(Number(view.dataset.targetProgress)<.6) await new Promise(requestAnimationFrame);
    return {target:Number(view.dataset.targetProgress),visual:Number(view.dataset.progress)};
  });
  expect(first.visual).toBeLessThan(first.target);
  await expect.poll(async()=>Number(await view.getAttribute('data-progress'))).toBeGreaterThan(.4);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(view).toHaveAttribute('data-target-progress','0');
  await expect.poll(async()=>Number(await view.getAttribute('data-progress'))).toBe(0);
  await waitForRendered(page);
  const idle=await view.getAttribute('data-render-count');
  await page.evaluate(async()=>{for(let i=0;i<3;i++)await new Promise(requestAnimationFrame);});
  expect(await view.getAttribute('data-render-count')).toBe(idle);
});

test('enabling reduced motion cancels pending damping and follows real scroll immediately', async ({page})=>{
  await page.goto('/'); const view=page.getByTestId('blueprint-viewport');
  await expect(view).toHaveAttribute('data-scene-ready','true');await waitForRendered(page);
  await page.evaluate(async()=>{
    const view=document.querySelector<HTMLElement>('[data-testid="blueprint-viewport"]')!;
    window.scrollTo({top:Number(view.dataset.scrollDistance)*.8,behavior:'instant'});
    while(Number(view.dataset.targetProgress)<.7)await new Promise(requestAnimationFrame);
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>view.evaluate(el=>el.dataset.progress===el.dataset.targetProgress)).toBe(true);
  await expect.poll(async()=>Number(await view.getAttribute('data-camera-elevation'))).toBeCloseTo(62,5);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(view).toHaveAttribute('data-target-progress','0');
  await expect(view).toHaveAttribute('data-progress','0');await waitForRendered(page);
});
