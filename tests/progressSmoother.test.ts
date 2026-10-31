import { describe, expect, it } from 'vitest';
import { createProgressSmoother } from '../src/playground/progressSmoother';

function setup() {
  let time = 0, next = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const values: number[] = [];
  const smoother = createProgressSmoother(value => values.push(value), {
    now: () => time,
    requestFrame: callback => { frames.set(++next, callback); return next; },
    cancelFrame: id => { frames.delete(id); },
  });
  const step = (dt: number) => { time += dt; const work = [...frames.values()]; frames.clear(); work.forEach(callback => callback(time)); };
  return { smoother, values, frames, step, current: () => values.at(-1) ?? 0 };
}
describe('manual progress damping', () => {
  it('follows the same time response at 30, 60 and 120 FPS', () => {
    const positions = [30, 60, 120].map(fps => {
      const s = setup(); s.smoother.setTarget(1);
      for (let i = 0; i < fps / 2; i++) s.step(1000 / fps);
      return s.current();
    });
    expect(positions[0]).toBeGreaterThan(0.97);
    expect(positions[0]).toBeLessThan(1);
    expect(positions[0]).toBeCloseTo(positions[1]!, 12);
    expect(positions[1]).toBeCloseTo(positions[2]!, 12);
  });
  it('responds to a reversed target on the next frame without momentum or overshoot', () => {
    const s = setup(); s.smoother.setTarget(1); s.step(100);
    const forward = s.current(); s.smoother.setTarget(0); s.step(16);
    expect(s.current()).toBeLessThan(forward);
    expect(s.current()).toBeGreaterThan(0);
    for (let i = 0; i < 100; i++) s.step(16);
    expect(s.current()).toBe(0); expect(s.frames.size).toBe(0);
  });
  it('coalesces inputs, converges exactly and leaves no RAF while idle', () => {
    const s = setup(); s.smoother.setTarget(0.2); s.smoother.setTarget(0.8); s.smoother.setTarget(0.4);
    expect(s.frames.size).toBe(1);
    for (let i = 0; i < 100; i++) s.step(16);
    expect(s.current()).toBe(0.4); expect(s.frames.size).toBe(0);
    const calls = s.values.length; s.step(1000); s.smoother.setTarget(0.4);
    expect(s.values).toHaveLength(calls); expect(s.frames.size).toBe(0);
  });
  it('applies reduced motion immediately, including an animation already in flight', () => {
    const s = setup(); s.smoother.setTarget(0.8); s.step(16); s.smoother.setReducedMotion(true);
    expect(s.current()).toBe(0.8); expect(s.frames.size).toBe(0);
    s.smoother.setTarget(0.2); expect(s.current()).toBe(0.2); expect(s.frames.size).toBe(0);
    s.smoother.setReducedMotion(false); s.smoother.setTarget(1); s.step(16);
    expect(s.current()).toBeGreaterThan(0.2); expect(s.current()).toBeLessThan(1);
  });
  it('keeps direct controls immediate and clamps endpoints', () => {
    const s = setup(); s.smoother.setTarget(2, true); expect(s.current()).toBe(1);
    s.smoother.setTarget(-1, true); expect(s.current()).toBe(0); expect(s.frames.size).toBe(0);
    expect(() => s.smoother.setTarget(NaN)).toThrow();
  });
  it('cancels pending work on dispose and ignores stale callbacks or later inputs', () => {
    const s = setup(); s.smoother.setTarget(1); const stale = [...s.frames.values()][0]!;
    s.smoother.dispose(); s.smoother.dispose();
    stale(100); s.smoother.setTarget(0.5); s.smoother.setReducedMotion(true);
    expect(s.frames.size).toBe(0); expect(s.values).toEqual([]);
  });
});
