import type { BlueprintProject } from '../contracts/BlueprintProject';
import type { BlueprintRuntime, BlueprintScene, BlueprintSceneFactory, BlueprintState } from '../contracts/ports';
import { validateBlueprintProject } from '../contracts/validate';
import { normalizeProgress, sampleTimeline } from './timeline';

export interface RuntimeOptions { createScene?: BlueprintSceneFactory }

/** A factory owns scene resources; this coordinator owns DOM wrappers, observers and RAF. */
export async function mountBlueprintRuntime(
  container: HTMLElement,
  input: BlueprintProject,
  options: RuntimeOptions = {},
): Promise<BlueprintRuntime> {
  let project = validateBlueprintProject(input);
  const doc = container.ownerDocument;
  const win = doc.defaultView;
  if (!win) throw new Error('Blueprint requires a browser document.');
  let disposed = false;
  let progress = 0;
  let scene: BlueprintScene | null = null;
  let wrapper: HTMLElement | null = null;
  let generation = 0;
  let pending: AbortController | null = null;
  let frame: number | null = null;
  let dirty = false;
  let intersecting = true;
  // Hosts may report fractional DOMRect values while client sizes are integers.
  // Quantize all entry points identically so observer order cannot move the camera.
  const cssPixels = (value: number) => Math.max(1, Math.round(value));
  let width = cssPixels(container.clientWidth || 1);
  let height = cssPixels(container.clientHeight || 1);
  let requestedDpr = Math.max(1, win.devicePixelRatio || 1);
  let resizeObserver: ResizeObserver | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  const listeners = new Set<(state: BlueprintState) => void>();

  const getState = (): BlueprintState => {
    const diagnostics = scene?.getDiagnostics() ?? null;
    return {
      ...sampleTimeline(progress, project.timeline),
      sceneReady: scene !== null && !disposed,
      disposed,
      diagnostics: diagnostics ? { ...diagnostics, cameraPosition: [...diagnostics.cameraPosition], cameraLookAt: [...diagnostics.cameraLookAt] } : null,
    };
  };
  const notify = () => {
    for (const listener of [...listeners]) listener(getState());
  };
  const visible = () => !disposed && intersecting && doc.visibilityState !== 'hidden';
  const invalidate = () => {
    if (disposed) return;
    dirty = true;
    if (!visible() || frame !== null) return;
    frame = win.requestAnimationFrame(() => {
      frame = null;
      if (!visible() || !dirty) return;
      dirty = false;
      scene?.render();
      notify();
    });
  };
  const handleVisibility = () => {
    if (!visible() && frame !== null) {
      win.cancelAnimationFrame(frame);
      frame = null;
    }
    if (visible() && dirty) invalidate();
  };
  const resize = (nextWidth: number, nextHeight: number, dpr: number) => {
    if (disposed) return;
    if (![nextWidth, nextHeight, dpr].every(value => Number.isFinite(value) && value > 0)) {
      throw new RangeError('Resize width, height and DPR must be finite and positive.');
    }
    const normalizedWidth = cssPixels(nextWidth);
    const normalizedHeight = cssPixels(nextHeight);
    const previousEffectiveDpr = Math.min(requestedDpr, project.quality.dprCap);
    const nextEffectiveDpr = Math.min(dpr, project.quality.dprCap);
    const unchanged = width === normalizedWidth && height === normalizedHeight && previousEffectiveDpr === nextEffectiveDpr;
    // Retain the requested DPR: a later project can raise its cap.
    requestedDpr = dpr;
    if (unchanged) return;
    width = normalizedWidth;
    height = normalizedHeight;
    scene?.resize(width, height, nextEffectiveDpr);
    invalidate();
  };
  const build = async (nextInput: BlueprintProject): Promise<void> => {
    if (disposed) return;
    // Invalid input cannot cancel a valid update which is already building.
    const nextProject = validateBlueprintProject(nextInput);
    const current = ++generation;
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const stage = doc.createElement('div');
    stage.className = 'blueprint-runtime-scene';
    stage.style.width = '100%';
    stage.style.height = '100%';
    let candidate: BlueprintScene | null = null;
    try {
      candidate = options.createScene ? await options.createScene({ container: stage, project: nextProject, signal: controller.signal }) : null;
      if (disposed || current !== generation || controller.signal.aborted) {
        candidate?.dispose();
        stage.remove();
        return;
      }
      // Prepare the replacement before retiring the last valid scene.
      candidate?.resize(width, height, Math.min(requestedDpr, nextProject.quality.dprCap));
      candidate?.setProgress(progress);
      // A scene is ready only once an actual first render has succeeded.
      candidate?.render();
      const previousScene = scene;
      const previousWrapper = wrapper;
      if (candidate) container.append(stage);
      scene = candidate;
      wrapper = candidate ? stage : null;
      project = nextProject;
      pending = null;
      previousScene?.dispose();
      previousWrapper?.remove();
      notify();
      invalidate();
    } catch (error) {
      // Failed or superseded candidates never replace the previous valid scene.
      if (candidate && candidate !== scene) candidate.dispose();
      if (stage !== wrapper) stage.remove();
      if (current === generation) pending = null;
      if (disposed || current !== generation || controller.signal.aborted) return;
      throw error;
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ++generation;
    pending?.abort();
    pending = null;
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    dirty = false;
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    doc.removeEventListener('visibilitychange', handleVisibility);
    win.removeEventListener('resize', handleWindowResize);
    scene?.dispose();
    scene = null;
    wrapper?.remove();
    wrapper = null;
    notify();
    listeners.clear();
  };
  const handleWindowResize = () => {
    if (disposed) return;
    resize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight), Math.max(1, win.devicePixelRatio || 1));
  };
  const runtime: BlueprintRuntime = {
    getState,
    updateProject: build,
    resize,
    setProgress(value) {
      if (disposed) return;
      const next = normalizeProgress(value);
      if (next === progress) return;
      progress = next;
      scene?.setProgress(progress);
      notify();
      invalidate();
    },
    subscribe(listener) {
      if (disposed) { listener(getState()); return () => {}; }
      listeners.add(listener);
      listener(getState());
      return () => { listeners.delete(listener); };
    },
    dispose,
  };
  try {
    await build(project);
    doc.addEventListener('visibilitychange', handleVisibility);
    win.addEventListener('resize', handleWindowResize);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => handleWindowResize());
      resizeObserver.observe(container);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(entries => {
        intersecting = entries[0]?.isIntersecting ?? true;
        handleVisibility();
      });
      intersectionObserver.observe(container);
    }
    return runtime;
  } catch (error) {
    dispose();
    throw error;
  }
}
