import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { createDefaultProject } from '../src/contracts/defaults';
import { sampleSceneMotion } from '../src/scene/motion';
import { getFramingDistance } from '../src/scene/framing';

describe('absolute scene motion', () => {
  it('extrudes real-world height and keeps Reveal fully built', () => {
    const project = createDefaultProject();
    expect(sampleSceneMotion(0.35, project).wallHeight).toBe(0);
    expect(sampleSceneMotion(0.525, project).wallHeight).toBeCloseTo(1.5);
    expect(sampleSceneMotion(0.7, project).wallHeight).toBe(3);
    expect(sampleSceneMotion(1, project).wallHeight).toBe(3);
    project.structure.wallHeight = 20;
    expect(sampleSceneMotion(1, project).wallHeight).toBe(20);
  });
  it('has continuous wall and camera transforms on both sides of every phase boundary', () => {
    const project = createDefaultProject();
    for (const boundary of [project.timeline.drawEnd, project.timeline.extrudeEnd]) {
      const left = sampleSceneMotion(boundary - 1e-7, project), right = sampleSceneMotion(boundary + 1e-7, project);
      expect(Math.abs(left.wallHeight - right.wallHeight)).toBeLessThan(1e-6);
      expect(Math.abs(left.targetY - right.targetY)).toBeLessThan(1e-6);
      left.direction.forEach((value, i) => expect(Math.abs(value - right.direction[i]!)).toBeLessThan(1e-6));
      left.up.forEach((value, i) => expect(Math.abs(value - right.up[i]!)).toBeLessThan(1e-6));
    }
  });
  it('is reversible, normalized and produces orthogonal camera axes at every progress', () => {
    const project = createDefaultProject(), expected = sampleSceneMotion(0.525, project);
    for (let i = 0; i <= 100; i++) {
      const motion = sampleSceneMotion(i / 100, project);
      expect(Math.hypot(...motion.direction)).toBeCloseTo(1); expect(Math.hypot(...motion.up)).toBeCloseTo(1);
      expect(motion.direction.reduce((sum, value, axis) => sum + value * motion.up[axis]!, 0)).toBeCloseTo(0);
      expect(motion.wallHeight).toBeGreaterThanOrEqual(0); expect(motion.wallHeight).toBeLessThanOrEqual(3);
    }
    expect(sampleSceneMotion(0.525, project)).toEqual(expected);
  });
  it.each([0, 0.35, 0.525, 0.7, 0.85, 1])('projects every built corner into the frustum throughout phase %s', progress => {
    const project = createDefaultProject(), motion = sampleSceneMotion(progress, project);
    for (const aspect of [0.4, 1, 2.4]) {
      const width = 20, depth = 26, height = motion.wallHeight, fill = 0.65;
      const distance = getFramingDistance(width, depth, height, aspect, project.camera.fov, fill, motion.direction, motion.up);
      const camera = new PerspectiveCamera(project.camera.fov, aspect, 0.01, 10000);
      camera.up.set(...motion.up); camera.position.copy(new Vector3(...motion.direction).multiplyScalar(distance));
      camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) for (const z of [-depth / 2, depth / 2]) {
        const point = new Vector3(x, y, z).project(camera);
        expect(Math.abs(point.x)).toBeLessThanOrEqual(fill + 1e-6); expect(Math.abs(point.y)).toBeLessThanOrEqual(fill + 1e-6);
      }
    }
  });
});
