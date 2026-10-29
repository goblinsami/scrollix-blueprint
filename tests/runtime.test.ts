import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountBlueprintRuntime } from '../src/core/runtime';
import { createDefaultProject } from '../src/contracts/defaults';
import type { BlueprintScene, SceneFactoryOptions } from '../src/contracts/ports';

class FakeWindow extends EventTarget {
  devicePixelRatio = 3;
  frames = new Map<number, FrameRequestCallback>();
  id = 0;
  requestAnimationFrame = (callback: FrameRequestCallback) => { this.frames.set(++this.id, callback); return this.id; };
  cancelAnimationFrame = (id: number) => { this.frames.delete(id); };
  flush() { const frames = [...this.frames.values()]; this.frames.clear(); frames.forEach(callback => callback(0)); }
}
class FakeDocument extends EventTarget {
  defaultView = new FakeWindow();
  visibilityState = 'visible';
  createElement() { return new FakeElement(this); }
}
class FakeElement {
  clientWidth = 800; clientHeight = 600;
  style = {}; className = '';
  children: FakeElement[] = []; parent: FakeElement | null = null;
  constructor(public ownerDocument: FakeDocument) {}
  append(child: FakeElement) { child.parent = this; this.children.push(child); }
  remove() { if (this.parent) { this.parent.children = this.parent.children.filter(value => value !== this); this.parent = null; } }
}
function environment() {
  const doc = new FakeDocument(); const element = new FakeElement(doc);
  return { doc, win: doc.defaultView, element, container: element as unknown as HTMLElement };
}
function scene() {
  let pendingProgress = 0;
  const diagnostics = { renderCount: 0, renderedProgress: 0, lineSegmentsVisible: 0, lineSegmentsTotal: 10, wallHeight: 0, cameraPosition: [1, 2, 3] as [number, number, number], geometries: 1, materials: 1, textures: 0 };
  return { setProgress: vi.fn((progress: number) => { pendingProgress = progress; }), resize: vi.fn(), render: vi.fn(() => { diagnostics.renderCount++; diagnostics.renderedProgress = pendingProgress; }), getDiagnostics: () => diagnostics, dispose: vi.fn() } satisfies BlueprintScene;
}
function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
afterEach(() => vi.unstubAllGlobals());

describe('runtime lifecycle', () => {
  it('normalizes fractional observer sizes and keeps requested DPR for later project updates', async () => {
    const { container } = environment(); const original = scene(), replacement = scene();
    const createScene = vi.fn().mockResolvedValueOnce(original).mockResolvedValueOnce(replacement);
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene });
    runtime.resize(800.1, 600.2, 3); runtime.resize(800, 600, 10);
    expect(original.resize).toHaveBeenCalledTimes(1);
    expect(original.resize).toHaveBeenLastCalledWith(800, 600, 1.5);
    const project = createDefaultProject(); project.quality.dprCap = 2;
    await runtime.updateProject(project);
    expect(replacement.resize).toHaveBeenLastCalledWith(800, 600, 2);
    runtime.dispose();
  });
  it('disposes a candidate whose initial render fails and preserves the attached valid scene', async () => {
    const { container, element } = environment(); const original = scene(), broken = scene();
    broken.render.mockImplementation(() => { throw new Error('render failed'); });
    const factory = vi.fn().mockResolvedValueOnce(original).mockResolvedValueOnce(broken);
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: factory });
    const attached = element.children[0]; runtime.setProgress(0.4);
    await expect(runtime.updateProject(createDefaultProject())).rejects.toThrow('render failed');
    expect(broken.dispose).toHaveBeenCalledTimes(1); expect(original.dispose).not.toHaveBeenCalled();
    expect(element.children).toEqual([attached]); expect(runtime.getState()).toMatchObject({ sceneReady: true, progress: 0.4 });
    runtime.dispose();
  });
  it('supports a real runtime without a renderer and subscribes immediately', async () => {
    const { container, win } = environment();
    const runtime = await mountBlueprintRuntime(container, createDefaultProject());
    const listener = vi.fn(); const unsubscribe = runtime.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(runtime.getState()).toMatchObject({ progress: 0, sceneReady: false, diagnostics: null, disposed: false });
    runtime.setProgress(0.5); expect(listener.mock.lastCall?.[0].progress).toBe(0.5);
    unsubscribe(); const calls = listener.mock.calls.length;
    runtime.setProgress(1); win.flush(); expect(listener).toHaveBeenCalledTimes(calls);
    runtime.dispose(); expect(win.frames.size).toBe(0);
  });
  it('coalesces invalidation and limits DPR without a permanent render loop', async () => {
    const { container, win } = environment(); const candidate = scene();
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: () => candidate });
    expect(candidate.resize).toHaveBeenLastCalledWith(800, 600, 1.5);
    runtime.setProgress(0.2); runtime.setProgress(0.4); runtime.resize(400, 300, 10);
    expect(win.frames.size).toBe(1); win.flush();
    expect(candidate.render).toHaveBeenCalledTimes(2); expect(win.frames.size).toBe(0);
    expect(candidate.resize).toHaveBeenLastCalledWith(400, 300, 1.5);
    expect(candidate.setProgress).toHaveBeenLastCalledWith(0.4);
    runtime.dispose();
  });
  it('rejects nonfinite progress and invalid sizes without corrupting the state', async () => {
    const { container } = environment(); const runtime = await mountBlueprintRuntime(container, createDefaultProject());
    runtime.setProgress(-1); expect(runtime.getState().progress).toBe(0);
    runtime.setProgress(2); expect(runtime.getState().progress).toBe(1);
    for (const number of [NaN, Infinity, -Infinity]) expect(() => runtime.setProgress(number)).toThrow();
    for (const size of [0, -1, NaN, Infinity]) expect(() => runtime.resize(size, 400, 1)).toThrow();
    expect(runtime.getState().progress).toBe(1); runtime.dispose();
  });
  it('preserves the valid scene and progress after a failed replacement', async () => {
    const { container, element } = environment(); const original = scene();
    const createScene = vi.fn().mockResolvedValueOnce(original).mockRejectedValueOnce(new Error('asset failed'));
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene });
    runtime.setProgress(0.6);
    await expect(runtime.updateProject({ ...createDefaultProject(), art: { preset: 'material-study' } })).rejects.toThrow('asset failed');
    expect(runtime.getState()).toMatchObject({ sceneReady: true, progress: 0.6 });
    expect(original.dispose).not.toHaveBeenCalled(); expect(element.children).toHaveLength(1);
    runtime.dispose();
  });
  it('aborts a superseded update and disposes its late result without attaching it', async () => {
    const { container, element } = environment(); const original = scene(), old = scene(), latest = scene();
    const late = deferred<BlueprintScene>(); const signals: AbortSignal[] = [];
    let call = 0;
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: (options: SceneFactoryOptions) => { signals.push(options.signal); call++; return call === 1 ? original : call === 2 ? late.promise : latest; } });
    runtime.setProgress(0.5);
    const stale = runtime.updateProject({ ...createDefaultProject(), title: 'stale' });
    await runtime.updateProject({ ...createDefaultProject(), title: 'latest' });
    expect(signals[1]?.aborted).toBe(true);
    late.resolve(old); await stale;
    expect(old.dispose).toHaveBeenCalledTimes(1); expect(original.dispose).toHaveBeenCalledTimes(1); expect(latest.dispose).not.toHaveBeenCalled();
    expect(latest.setProgress).toHaveBeenLastCalledWith(0.5); expect(element.children).toHaveLength(1);
    runtime.dispose();
  });
  it('invalid project input does not cancel an already valid pending update', async () => {
    const { container } = environment(); const first = scene(), next = scene(); const pending = deferred<BlueprintScene>();
    const signals: AbortSignal[] = [];
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: options => { signals.push(options.signal); return signals.length === 1 ? first : pending.promise; } });
    const update = runtime.updateProject(createDefaultProject());
    const invalid = createDefaultProject(); invalid.camera.fov = NaN;
    await expect(runtime.updateProject(invalid)).rejects.toThrow();
    expect(signals[1]?.aborted).toBe(false); pending.resolve(next); await update;
    expect(first.dispose).toHaveBeenCalledTimes(1); expect(next.dispose).not.toHaveBeenCalled(); runtime.dispose();
  });
  it('disposal cancels pending builds, drops frames and is idempotent', async () => {
    const { container, win, element } = environment(); const first = scene(), late = scene(); const pending = deferred<BlueprintScene>();
    const signals: AbortSignal[] = [];
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: options => { signals.push(options.signal); return signals.length === 1 ? first : pending.promise; } });
    const update = runtime.updateProject(createDefaultProject());
    runtime.dispose(); runtime.dispose();
    expect(signals[1]?.aborted).toBe(true); expect(first.dispose).toHaveBeenCalledTimes(1);
    pending.resolve(late); await update; expect(late.dispose).toHaveBeenCalledTimes(1);
    expect(element.children).toHaveLength(0); expect(win.frames.size).toBe(0);
    runtime.setProgress(NaN); runtime.resize(0, 0, 0); await runtime.updateProject(createDefaultProject());
    expect(runtime.getState()).toMatchObject({ disposed: true, sceneReady: false });
  });
  it('pauses hidden/offscreen rendering and disconnects observers/listeners', async () => {
    const { container, win, doc } = environment(); const candidate = scene();
    const resizeDisconnect = vi.fn(), intersectionDisconnect = vi.fn();
    let intersection!: IntersectionObserverCallback;
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = resizeDisconnect; });
    vi.stubGlobal('IntersectionObserver', class { constructor(callback: IntersectionObserverCallback) { intersection = callback; } observe() {} disconnect = intersectionDisconnect; });
    const docRemove = vi.spyOn(doc, 'removeEventListener'), winRemove = vi.spyOn(win, 'removeEventListener');
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: () => candidate });
    doc.visibilityState = 'hidden'; doc.dispatchEvent(new Event('visibilitychange'));
    expect(win.frames.size).toBe(0); runtime.setProgress(0.2); expect(win.frames.size).toBe(0);
    doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange')); win.flush(); expect(candidate.render).toHaveBeenCalledTimes(2);
    intersection([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    runtime.setProgress(0.3); expect(win.frames.size).toBe(0);
    intersection([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver);
    win.flush(); expect(candidate.render).toHaveBeenCalledTimes(3);
    runtime.dispose(); expect(resizeDisconnect).toHaveBeenCalledTimes(1); expect(intersectionDisconnect).toHaveBeenCalledTimes(1);
    expect(docRemove).toHaveBeenCalledWith('visibilitychange', expect.any(Function)); expect(winRemove).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  it('snapshots cannot mutate scene diagnostics or other subscribers', async () => {
    const { container } = environment(); const candidate = scene();
    const runtime = await mountBlueprintRuntime(container, createDefaultProject(), { createScene: () => candidate });
    const snapshot = runtime.getState(); snapshot.progress = 0.9;
    (snapshot.diagnostics!.cameraPosition as unknown as number[])[0] = 100;
    snapshot.diagnostics!.renderCount = 900;
    expect(runtime.getState().progress).toBe(0); expect(runtime.getState().diagnostics?.cameraPosition[0]).toBe(1); expect(runtime.getState().diagnostics?.renderCount).toBe(1);
    runtime.dispose();
  });
});
