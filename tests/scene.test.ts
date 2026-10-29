import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildFloorPlan, subdivideSegments } from '../src/scene/floorPlan';
import { ResourceOwner } from '../src/scene/ResourceOwner';
import { getFramingDistance } from '../src/scene/framing';

describe('architectural plan', () => {
  it('contains a real centered entry gap instead of drawing a wall through the door', () => {
    const plan = buildFloorPlan(12, 18);
    const front = plan.structural.filter(s => s.start[1] === 9 && s.end[1] === 9);
    expect(front).toHaveLength(2);
    for (const segment of front) {
      const min = Math.min(segment.start[0], segment.end[0]), max = Math.max(segment.start[0], segment.end[0]);
      expect(min >= 0.9 || max <= -0.9).toBe(true);
    }
    expect(plan.door.length).toBeGreaterThan(3);
    expect(plan.door[0]?.start).toEqual([-0.9, 9]);
    const arc = plan.door.slice(1);
    for (const segment of arc) for (const point of [segment.start, segment.end]) expect(Math.hypot(point[0] + 0.9, point[1] - 9)).toBeCloseTo(1.8);
  });
  it('has exactly two dimension labels with correct values outside the structural perimeter', () => {
    const plan = buildFloorPlan(12, 18);
    expect(plan.labels.map(label => label.text)).toEqual(['12.00 m', '18.00 m']);
    expect(plan.labels[0]!.position[1]).toBeGreaterThan(9); expect(plan.labels[1]!.position[0]).toBeLessThan(-6);
    expect(plan.annotations.length).toBeGreaterThanOrEqual(6);
    for (const segment of [...plan.structural, ...plan.door, ...plan.annotations]) {
      expect([...segment.start, ...segment.end].every(Number.isFinite)).toBe(true);
      expect(Math.hypot(segment.end[0] - segment.start[0], segment.end[1] - segment.start[1])).toBeGreaterThan(0);
    }
  });
  it('builds parametric dimensions rather than fixed geometry', () => {
    const plan = buildFloorPlan(20, 7);
    expect(plan.labels.map(label => label.text)).toEqual(['20.00 m', '7.00 m']);
    expect(plan.bounds.width).toBeGreaterThan(20); expect(plan.bounds.depth).toBeGreaterThan(7);
    expect(Math.max(...plan.structural.flatMap(segment => [segment.start[0], segment.end[0]]))).toBe(10);
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid dimensions %s', value => expect(() => buildFloorPlan(value, 12)).toThrow());
  it('subdivision preserves endpoints and does not introduce long draw jumps', () => {
    const source = [{ start: [0, 0] as [number, number], end: [3, 4] as [number, number] }];
    const segments = subdivideSegments(source, 0.3);
    expect(segments[0]!.start).toEqual([0, 0]); expect(segments.at(-1)!.end).toEqual([3, 4]);
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      expect(Math.hypot(segment.end[0] - segment.start[0], segment.end[1] - segment.start[1])).toBeLessThanOrEqual(0.3 + 1e-10);
      if (i) expect(segment.start).toEqual(segments[i - 1]!.end);
    }
  });
});

describe('framing and resource ownership', () => {
  it('fits narrow mobile aspect, larger structures, smaller FOV and conservative fill', () => {
    const distance = (aspect: number, fov = 45, fill = 0.75, width = 12) => getFramingDistance(width, 18, 3, aspect, fov, fill, [0.4, 1, 0.6]);
    expect(distance(0.4)).toBeGreaterThan(distance(1.6));
    expect(distance(1.6, 30)).toBeGreaterThan(distance(1.6, 60));
    expect(distance(1.6, 45, 0.4)).toBeGreaterThan(distance(1.6, 45, 0.9));
    expect(distance(1.6, 45, 0.75, 40)).toBeGreaterThan(distance(1.6));
  });
  it('releases shared resources once, including resources never attached to a scene', () => {
    const owner = new ResourceOwner(), shared = { dispose: vi.fn() }, unused = { dispose: vi.fn() };
    expect(owner.ownGeometry(shared)).toBe(shared); owner.ownGeometry(shared); owner.ownMaterial(shared); owner.ownTexture(unused);
    expect(owner.geometries).toBe(1); expect(owner.materials).toBe(1); expect(owner.textures).toBe(1);
    owner.dispose(); owner.dispose();
    expect(shared.dispose).toHaveBeenCalledTimes(1); expect(unused.dispose).toHaveBeenCalledTimes(1);
    expect(owner.geometries + owner.materials + owner.textures).toBe(0);
    expect(() => owner.ownGeometry(shared)).toThrow();
  });
  it('continues disposing remaining resources when one resource throws', () => {
    const owner = new ResourceOwner(), broken = { dispose: vi.fn(() => { throw new Error('cleanup'); }) }, next = { dispose: vi.fn() };
    owner.ownGeometry(broken); owner.ownTexture(next);
    expect(() => owner.dispose()).toThrow(AggregateError); expect(next.dispose).toHaveBeenCalledTimes(1);
    owner.dispose(); expect(broken.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('camera framing contains the actual projected bounding corners', () => {
  it.each([
    [12, 18, 3, 1.6, 45, 0.75], [12, 18, 3, 0.4, 45, 0.65],
    [1, 1, 0.5, 0.4, 20, 0.65], [100, 100, 20, 1.6, 80, 0.75],
    [1, 100, 20, 0.2, 20, 0.65], [100, 1, 0.5, 3, 80, 0.95],
  ])('contains width %s/depth %s/height %s at aspect %s', (width, depth, height, aspect, fov, fill) => {
    for (const direction of [[0, 1, 0], [0.4, 1, 0.6], [-0.6, 1, 0.8]] as const) {
      const distance = getFramingDistance(width, depth, height, aspect, fov, fill, direction);
      const camera = new PerspectiveCamera(fov, aspect, 0.01, 1e7);
      if (direction[0] === 0 && direction[2] === 0) camera.up.set(0, 0, -1);
      camera.position.copy(new Vector3(...direction).normalize().multiplyScalar(distance));
      camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) for (const z of [-depth / 2, depth / 2]) {
        const projected = new Vector3(x, y, z).project(camera);
        expect(Math.abs(projected.x)).toBeLessThanOrEqual(fill + 1e-6);
        expect(Math.abs(projected.y)).toBeLessThanOrEqual(fill + 1e-6);
        expect(projected.z).toBeGreaterThan(-1); expect(projected.z).toBeLessThan(1);
      }
    }
  });
});