import type { BlueprintProject } from '../contracts/BlueprintProject';
import type { TimelineState } from '../contracts/ports';

export function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Progress must be a finite number.');
  return Math.max(0, Math.min(1, progress));
}

/** Sample every phase from a single absolute progress: deterministic in either direction. */
export function sampleTimeline(progress: number, timeline: BlueprintProject['timeline']): TimelineState {
  const { drawEnd, extrudeEnd } = timeline;
  if (!Number.isFinite(drawEnd) || !Number.isFinite(extrudeEnd) || drawEnd <= 0 || extrudeEnd >= 1 || drawEnd >= extrudeEnd) {
    throw new RangeError('Timeline boundaries must satisfy 0 < drawEnd < extrudeEnd < 1.');
  }
  const p = normalizeProgress(progress);
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return {
    progress: p,
    phase: p < drawEnd ? 'draw' : p < extrudeEnd ? 'extrude' : 'reveal',
    draw: clamp(p / drawEnd),
    extrude: clamp((p - drawEnd) / (extrudeEnd - drawEnd)),
    reveal: clamp((p - extrudeEnd) / (1 - extrudeEnd)),
  };
}
