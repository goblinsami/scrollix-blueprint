import { PRESETS } from './BlueprintProject';
import type { BlueprintProject, CameraKeyframe, CameraStoryboard, CameraVector3 } from './BlueprintProject';
import { createDefaultProject, createDefaultStoryboard } from './defaults';
export class ProjectValidationError extends Error {
  constructor(public readonly path: string, message: string) {
    super(path + ': ' + message); this.name = 'ProjectValidationError';
  }
}
type RecordValue = Record<string, unknown>;
function record(value: unknown, path: string, keys: string[]): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new ProjectValidationError(path, 'expected a plain object');
  }
  for (const key of Object.keys(value)) if (!keys.includes(key))
    throw new ProjectValidationError(path + '.' + key, 'unknown field');
  return value as RecordValue;
}
function number(value: unknown, fallback: number, min: number, max: number, path: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new ProjectValidationError(path, 'expected finite number in [' + min + ', ' + max + ']');
  return value;
}
function text(value: unknown, fallback: string, path: string, allowEmpty = false): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > 4000)
    throw new ProjectValidationError(path, 'expected text (max 4000 characters)');
  return value;
}
function choice<T extends string>(value: unknown, fallback: T, allowed: readonly T[], path: string): T {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !allowed.includes(value as T))
    throw new ProjectValidationError(path, 'unsupported value');
  return value as T;
}

function vector(value: unknown, path: string): CameraVector3 {
  if (!Array.isArray(value) || value.length !== 3 || ![0,1,2].every(index => typeof value[index] === 'number' && Number.isFinite(value[index])))
    throw new ProjectValidationError(path, 'expected a tuple of three finite numbers');
  return [value[0] as number, value[1] as number, value[2] as number];
}

function storyboard(value: unknown, timeline: BlueprintProject['timeline'], structure: BlueprintProject['structure']): CameraStoryboard {
  const path = '$.camera.storyboard';
  const source = record(value === undefined ? {} : value, path, ['holdStart','desktop','mobile']);
  const holdStart = number(source.holdStart, timeline.extrudeEnd + (1 - timeline.extrudeEnd) * 0.8, 0, 1, path + '.holdStart');
  if (holdStart <= timeline.extrudeEnd || holdStart >= 1)
    throw new ProjectValidationError(path + '.holdStart', 'must follow extrudeEnd and precede 1');
  const defaults = createDefaultStoryboard(timeline, structure, holdStart);
  const profile = (name: 'desktop' | 'mobile'): CameraKeyframe[] => {
    const location = path + '.' + name;
    const raw = source[name] === undefined ? defaults[name] : source[name];
    if (!Array.isArray(raw) || raw.length < 2 || raw.length > 32)
      throw new ProjectValidationError(location, 'expected 2 to 32 keyframes');
    let previous = -1;
    let previousDirection: CameraVector3 | null = null;
    return Array.from(raw).map((entry: unknown, i: number): CameraKeyframe => {
      const keypath = location + '[' + i + ']';
      const key = record(entry, keypath, ['at','position','lookAt','fit']);
      if (key.at === undefined) throw new ProjectValidationError(keypath + '.at', 'is required');
      const at = number(key.at, 0, 0, holdStart, keypath + '.at');
      if (at <= previous) throw new ProjectValidationError(keypath + '.at', 'keyframe positions must be strictly increasing');
      previous = at;
      if (i === 0 && at !== 0) throw new ProjectValidationError(keypath + '.at', 'first keyframe must start at 0');
      if (i === raw.length - 1 && at !== holdStart) throw new ProjectValidationError(keypath + '.at', 'last keyframe must equal holdStart');
      const position = vector(key.position, keypath + '.position');
      const lookAt = vector(key.lookAt, keypath + '.lookAt');
      const direction = position.map((coordinate, axis) => (coordinate - lookAt[axis]!) * (axis === 2 ? structure.depth : structure.width));
      const length = Math.hypot(...direction);
      const horizontal = Math.hypot(direction[0]!, direction[2]!);
      if (!direction.every(Number.isFinite) || !Number.isFinite(length) || length === 0)
        throw new ProjectValidationError(keypath + '.position', 'position and lookAt must define a finite nonzero direction');
      if (horizontal / length < 0.000001)
        throw new ProjectValidationError(keypath + '.position', 'view direction must not be parallel to world up');
      if (previousDirection) {
        // Smoothstep mixes both endpoints with the same scalar. Opposed
        // horizontal rays must cross world-up (or zero) somewhere in that mix.
        // Compare directions, not lengths: final fitting can rescale the ray.
        const previousHorizontal = Math.hypot(previousDirection[0], previousDirection[2]);
        const ax = previousDirection[0] / previousHorizontal, az = previousDirection[2] / previousHorizontal;
        const bx = direction[0]! / horizontal, bz = direction[2]! / horizontal;
        if (ax * bx + az * bz < 0 && Math.abs(ax * bz - az * bx) < 0.000001)
          throw new ProjectValidationError(keypath + '.position', 'interpolation must not cross world up or a zero view direction');
      }
      previousDirection = [direction[0]!, direction[1]!, direction[2]!];
      if (key.fit !== undefined && typeof key.fit !== 'boolean') throw new ProjectValidationError(keypath + '.fit', 'expected boolean');
      if (i !== raw.length - 1 && key.fit === true) throw new ProjectValidationError(keypath + '.fit', 'automatic fitting is reserved for the final keyframe');
      if (i === raw.length - 1 && key.fit !== true) throw new ProjectValidationError(keypath + '.fit', 'final keyframe must enable fitting');
      return { at, position, lookAt, ...(key.fit === undefined ? {} : { fit: key.fit as boolean }) };
    });
  };
  return { holdStart, desktop: profile('desktop'), mobile: profile('mobile') };
}

/** Accept unknown input; only missing fields receive defaults. Never mutate input. */
export function validateBlueprintProject(input: unknown): BlueprintProject {
  const d = createDefaultProject();
  const p = record(input, '$', ['schemaVersion','id','title','art','structure','timeline','camera','quality','accessibility','stations']);
  if (p.schemaVersion !== undefined && p.schemaVersion !== 1)
    throw new ProjectValidationError('$.schemaVersion', 'only version 1 is supported');
  const section = (key: string, keys: string[]) => record(p[key] === undefined ? {} : p[key], '$.' + key, keys);
  const art = section('art', ['preset']);
  const s = section('structure', ['width','depth','wallHeight']);
  const t = section('timeline', ['drawEnd','extrudeEnd']);
  const c = section('camera', ['fov','desktopFill','mobileFill','storyboard']);
  const q = section('quality', ['dprCap']);
  const a = section('accessibility', ['reducedMotion']);
  const drawEnd = number(t.drawEnd, d.timeline.drawEnd, 0.01, 0.98, '$.timeline.drawEnd');
  const extrudeEnd = number(t.extrudeEnd, d.timeline.extrudeEnd, 0.02, 0.99, '$.timeline.extrudeEnd');
  if (drawEnd >= extrudeEnd) throw new ProjectValidationError('$.timeline', 'drawEnd must precede extrudeEnd');
  const structure = { width: number(s.width, d.structure.width, 1, 100, '$.structure.width'), depth: number(s.depth, d.structure.depth, 1, 100, '$.structure.depth'), wallHeight: number(s.wallHeight, d.structure.wallHeight, 0.5, 20, '$.structure.wallHeight') };
  const cameraStoryboard = storyboard(c.storyboard, { drawEnd, extrudeEnd }, structure);
  const raw = p.stations === undefined ? [] : p.stations;
  if (!Array.isArray(raw) || raw.length > 50) throw new ProjectValidationError('$.stations', 'expected array with at most 50 entries');
  const ids = new Set<string>(); let previous = -1;
  const stations = raw.map((value: unknown, i: number) => {
    const location = '$.stations[' + i + ']';
    const item = record(value, location, ['id','at','title','body']);
    if (item.id === undefined || item.at === undefined || item.title === undefined)
      throw new ProjectValidationError(location, 'id, at and title are required');
    const id = text(item.id, '', location + '.id');
    if (ids.has(id)) throw new ProjectValidationError(location + '.id', 'duplicate id');
    ids.add(id);
    const at = number(item.at, 0, 0, 1, location + '.at');
    if (at <= previous) throw new ProjectValidationError(location + '.at', 'positions must be strictly increasing');
    previous = at;
    return { id, at, title: text(item.title, '', location + '.title'), body: text(item.body, '', location + '.body', true) };
  });
  return {
    schemaVersion: 1, id: text(p.id, d.id, '$.id'), title: text(p.title, d.title, '$.title'),
    art: { preset: choice(art.preset, d.art.preset, PRESETS, '$.art.preset') },
    structure,
    timeline: { drawEnd, extrudeEnd },
    camera: { fov: number(c.fov, d.camera.fov, 20, 80, '$.camera.fov'), desktopFill: number(c.desktopFill, d.camera.desktopFill, 0.2, 0.95, '$.camera.desktopFill'), mobileFill: number(c.mobileFill, d.camera.mobileFill, 0.2, 0.95, '$.camera.mobileFill'), storyboard: cameraStoryboard },
    quality: { dprCap: number(q.dprCap, d.quality.dprCap, 1, 2, '$.quality.dprCap') },
    accessibility: { reducedMotion: choice(a.reducedMotion, d.accessibility.reducedMotion, ['system','always'], '$.accessibility.reducedMotion') }, stations,
  };
}
