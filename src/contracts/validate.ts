import { PRESETS } from './BlueprintProject';
import type { BlueprintProject } from './BlueprintProject';
import { createDefaultProject } from './defaults';
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
  const c = section('camera', ['fov','desktopFill','mobileFill']);
  const q = section('quality', ['dprCap']);
  const a = section('accessibility', ['reducedMotion']);
  const drawEnd = number(t.drawEnd, d.timeline.drawEnd, 0.01, 0.98, '$.timeline.drawEnd');
  const extrudeEnd = number(t.extrudeEnd, d.timeline.extrudeEnd, 0.02, 0.99, '$.timeline.extrudeEnd');
  if (drawEnd >= extrudeEnd) throw new ProjectValidationError('$.timeline', 'drawEnd must precede extrudeEnd');
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
    structure: { width: number(s.width, d.structure.width, 1, 100, '$.structure.width'), depth: number(s.depth, d.structure.depth, 1, 100, '$.structure.depth'), wallHeight: number(s.wallHeight, d.structure.wallHeight, 0.5, 20, '$.structure.wallHeight') },
    timeline: { drawEnd, extrudeEnd },
    camera: { fov: number(c.fov, d.camera.fov, 20, 80, '$.camera.fov'), desktopFill: number(c.desktopFill, d.camera.desktopFill, 0.2, 0.95, '$.camera.desktopFill'), mobileFill: number(c.mobileFill, d.camera.mobileFill, 0.2, 0.95, '$.camera.mobileFill') },
    quality: { dprCap: number(q.dprCap, d.quality.dprCap, 1, 2, '$.quality.dprCap') },
    accessibility: { reducedMotion: choice(a.reducedMotion, d.accessibility.reducedMotion, ['system','always'], '$.accessibility.reducedMotion') }, stations,
  };
}
