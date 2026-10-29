import { expect } from 'playwright/test';
import type { Page } from 'playwright/test';
/** A counter alone can belong to an earlier resize; wait for the actual sampled frame. */
export async function waitForRendered(page: Page): Promise<void> {
  await expect.poll(() => page.getByTestId('blueprint-viewport').evaluate(element => {
    const view = element as HTMLElement;
    return view.dataset.sceneReady === 'true' && view.dataset.renderedProgress !== undefined && view.dataset.progress === view.dataset.renderedProgress;
  }), { message: 'The visible canvas must render the current canonical progress' }).toBe(true);
}
