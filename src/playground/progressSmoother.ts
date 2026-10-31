import { normalizeProgress } from '../core/timeline';

export interface ProgressClock {
  now(): number;
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(id: number): void;
}

/** Input filtering only: the runtime still samples one absolute visual progress. */
export function createProgressSmoother(onProgress: (value: number) => void, clock: ProgressClock) {
  const tauMs = 130;
  const epsilon = 0.0001;
  let targetProgress = 0, visualProgress = 0, lastTime = 0;
  let frame: number | null = null;
  let reducedMotion = false, disposed = false;

  const cancel = () => {
    if (frame !== null) clock.cancelFrame(frame);
    frame = null;
  };
  const snap = () => {
    cancel();
    if (visualProgress !== targetProgress) {
      visualProgress = targetProgress;
      onProgress(visualProgress);
    }
  };
  const tick: FrameRequestCallback = time => {
    frame = null;
    if (disposed) return;
    const dt = Math.max(0, time - lastTime);
    lastTime = time;
    visualProgress += (targetProgress - visualProgress) * (1 - Math.exp(-dt / tauMs));
    if (Math.abs(targetProgress - visualProgress) <= epsilon) visualProgress = targetProgress;
    onProgress(visualProgress);
    if (!disposed && !reducedMotion && visualProgress !== targetProgress) frame = clock.requestFrame(tick);
  };
  return {
    setTarget(progress: number, immediate = false) {
      if (disposed) return;
      targetProgress = normalizeProgress(progress);
      if (immediate || reducedMotion) { snap(); return; }
      if (frame === null && visualProgress !== targetProgress) {
        lastTime = clock.now();
        frame = clock.requestFrame(tick);
      }
    },
    setReducedMotion(value: boolean) {
      if (disposed) return;
      reducedMotion = value;
      if (value) snap();
    },
    dispose() { disposed = true; cancel(); },
  };
}
