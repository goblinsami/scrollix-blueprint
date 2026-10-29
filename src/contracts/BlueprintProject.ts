export const PRESETS = ['paper', 'inverted-blueprint', 'material-study'] as const;
export type ArtPreset = typeof PRESETS[number];
export interface BlueprintProject {
  schemaVersion: 1;
  id: string;
  title: string;
  art: { preset: ArtPreset };
  structure: { width: number; depth: number; wallHeight: number };
  timeline: { drawEnd: number; extrudeEnd: number };
  camera: { fov: number; desktopFill: number; mobileFill: number };
  quality: { dprCap: number };
  accessibility: { reducedMotion: 'system' | 'always' };
  stations: Array<{ id: string; at: number; title: string; body: string }>;
}
