import {test,expect} from './fixtures';
import {waitForRendered} from './rendered';

test('calibrated native scroll is reversible, reduced motion holds an aerial pose, short sticky fits',async({page})=>{
  await page.goto('/');const view=page.getByTestId('blueprint-viewport');
  await expect(view).toHaveAttribute('data-scene-ready','true');
  const distance=Number(await view.getAttribute('data-scroll-distance'));
  expect(distance).toBeGreaterThanOrEqual(2400);
  const jump=async(p:number)=>{await page.evaluate(y=>window.scrollTo(0,y),Math.round(p*distance));await expect.poll(async()=>Number(await view.getAttribute('data-progress'))).toBeCloseTo(p,3);await waitForRendered(page);};
  await jump(.52);const pose=await view.getAttribute('data-camera-position');
  await jump(.8);await jump(.52);expect(await view.getAttribute('data-camera-position')).toBe(pose);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(async()=>Number(await view.getAttribute('data-camera-elevation'))).toBeCloseTo(62,5);
  const staticPose=await view.getAttribute('data-camera-position');
  await jump(.1);expect(await view.getAttribute('data-camera-position')).toBe(staticPose);
  expect(Number(await view.getAttribute('data-wall-height'))).toBe(3);
  await page.setViewportSize({width:800,height:450});
  const bounds=await page.locator('.studio-shell').boundingBox();expect(bounds!.height).toBe(450);
  expect((await view.boundingBox())!.height).toBeGreaterThan(100);
});

