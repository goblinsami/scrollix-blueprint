export const PRESETS = ['paper', 'inverted-blueprint', 'material-study'] as const;
export type ArtPreset = typeof PRESETS[number];
export type CameraVector3 = [number, number, number];
export interface CameraKeyframe {
  at: number;
  /** Normalized coordinates: X/Y × structure.width; Z × structure.depth. */
  position: CameraVector3;
  lookAt: CameraVector3;
  /** Global automatic framing is allowed only on the final Reveal keyframe. */
  fit?: boolean;
}
export interface CameraStoryboard {
  holdStart: number;
  desktop: CameraKeyframe[];
  mobile: CameraKeyframe[];
}
export interface BlueprintProject {
  schemaVersion: 1;
  id: string;
  title: string;
  art: { preset: ArtPreset };
  structure: { width: number; depth: number; wallHeight: number };
  timeline: { drawEnd: number; extrudeEnd: number };
  camera: { fov: number; desktopFill: number; mobileFill: number; storyboard: CameraStoryboard };
  quality: { dprCap: number };
  accessibility: { reducedMotion: 'system' | 'always' };
  stations: Array<{ id: string; at: number; title: string; body: string }>;
}
