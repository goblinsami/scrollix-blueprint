import { describe, expect, it } from 'vitest';
import { sampleTimeline } from '../src/core/timeline';
const boundaries = { drawEnd: 0.35, extrudeEnd: 0.7 };
describe('timeline sampling', () => {
  it('clamps finite progress at the two endpoints', () => {
    expect(sampleTimeline(-10, boundaries)).toMatchObject({ progress: 0, phase: 'draw', draw: 0, extrude: 0, reveal: 0 });
    expect(sampleTimeline(10, boundaries)).toMatchObject({ progress: 1, phase: 'reveal', draw: 1, extrude: 1, reveal: 1 });
  });
  it.each([NaN, Infinity, -Infinity])('rejects nonfinite progress %s', progress => expect(() => sampleTimeline(progress, boundaries)).toThrow());
  it('samples independently so reverse playback reconstructs the same state', () => {
    const expected = sampleTimeline(0.525, boundaries);
    expect(expected.draw).toBe(1);
    expect(expected.extrude).toBeCloseTo(0.5);
    expect(expected.reveal).toBe(0);
    expect(expected.phase).toBe('extrude');
    for (const p of [0.9, 0.1, 1, 0]) sampleTimeline(p, boundaries);
    expect(sampleTimeline(0.525, boundaries)).toEqual(expected);
  });
  it('is continuous across phase boundaries', () => {
    for (const boundary of [0.35, 0.7]) {
      const left = sampleTimeline(boundary - 1e-8, boundaries);
      const right = sampleTimeline(boundary + 1e-8, boundaries);
      for (const key of ['draw', 'extrude', 'reveal'] as const) expect(Math.abs(left[key] - right[key])).toBeLessThan(1e-6);
    }
  });
  it('respects configured boundaries rather than hardcoded timings', () => {
    const result = sampleTimeline(0.5, { drawEnd: 0.2, extrudeEnd: 0.8 });
    expect(result.draw).toBe(1); expect(result.extrude).toBeCloseTo(0.5); expect(result.reveal).toBe(0);
  });
  it('has monotonic normalized component progress on a complete forward traversal', () => {
    let previous = sampleTimeline(0, boundaries);
    for (let i = 1; i <= 100; i++) {
      const next = sampleTimeline(i / 100, boundaries);
      for (const key of ['draw', 'extrude', 'reveal'] as const) {
        expect(next[key]).toBeGreaterThanOrEqual(previous[key]); expect(next[key]).toBeLessThanOrEqual(1);
      }
      previous = next;
    }
  });
});
