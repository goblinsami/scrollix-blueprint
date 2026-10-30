import type { BlueprintProject, CameraKeyframe, CameraStoryboard, CameraVector3 } from './BlueprintProject';

/** Single source of camera poses, coordinated with the 3D storyboard. */
export function createDefaultStoryboard(
  timeline: BlueprintProject['timeline'],
  structure: BlueprintProject['structure'],
  holdStart = timeline.extrudeEnd + (1 - timeline.extrudeEnd) * 0.8,
): CameraStoryboard {
  const { drawEnd, extrudeEnd } = timeline;
  const times = [0, drawEnd / 2, drawEnd, (drawEnd + extrudeEnd) / 2, extrudeEnd, holdStart];
  // Position/interest are normalized: X/Y by width, Z by depth. Keep the
  // final ray at 62 degrees above the floor for every structure aspect ratio.
  const finalY = (offset: number) => 0.1 + offset * Math.hypot(1, structure.depth / structure.width) * Math.tan(62 * Math.PI / 180);
  const profile = (poses: Array<[CameraVector3, CameraVector3]>): CameraKeyframe[] => poses.map(([position, lookAt], i) => ({
    at: times[i]!, position: [...position], lookAt: [...lookAt], ...(i === poses.length - 1 ? { fit: true } : {}),
  }));
  return {
    holdStart,
    desktop: profile([
      [[-0.38,0.14,0.68],[-0.25,0,0.25]],
      [[-0.52,0.16,0.22],[-0.05,0,0.04]],
      [[-0.13,0.18,-0.02],[0.25,0,-0.25]],
      [[0.02,0.25,-0.23],[-0.15,0.06,-0.40]],
      [[0.37,0.52,-0.38],[0.10,0.08,-0.05]],
      [[0.70,finalY(0.70),0.70],[0,0.10,0]],
    ]),
    mobile: profile([
      [[-0.28,0.19,0.64],[-0.20,0,0.30]],
      [[-0.38,0.21,0.19],[0.28,0,-0.05]],
      [[-0.08,0.23,-0.05],[-0.30,0,-0.24]],
      [[0.08,0.33,-0.21],[-0.12,0.08,-0.38]],
      [[0.40,0.66,-0.29],[0.08,0.09,-0.08]],
      [[0.52,finalY(0.52),0.52],[0,0.10,0]],
    ]),
  };
}

/** Fresh values per consumer; adapters must not maintain their own defaults. */
export function createDefaultProject(): BlueprintProject {
  const structure = { width: 12, depth: 18, wallHeight: 3 };
  const timeline = { drawEnd: 0.35, extrudeEnd: 0.7 };
  return {
    schemaVersion: 1, id: 'blueprint', title: 'Scrollix Blueprint',
    art: { preset: 'paper' }, structure, timeline,
    camera: { fov: 45, desktopFill: 0.75, mobileFill: 0.65, storyboard: createDefaultStoryboard(timeline, structure) },
    quality: { dprCap: 1.5 }, accessibility: { reducedMotion: 'system' }, stations: [],
  };
}
