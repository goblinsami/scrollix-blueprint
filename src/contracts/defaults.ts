import type { BlueprintProject } from './BlueprintProject';
/** Fresh values per consumer; adapters must not maintain their own defaults. */
export function createDefaultProject(): BlueprintProject {
  return {
    schemaVersion: 1, id: 'blueprint', title: 'Scrollix Blueprint',
    art: { preset: 'paper' },
    structure: { width: 12, depth: 18, wallHeight: 3 },
    timeline: { drawEnd: 0.35, extrudeEnd: 0.7 },
    camera: { fov: 45, desktopFill: 0.75, mobileFill: 0.65 },
    quality: { dprCap: 1.5 }, accessibility: { reducedMotion: 'system' }, stations: [],
  };
}
