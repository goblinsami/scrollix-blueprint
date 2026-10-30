export type { BlueprintProject, ArtPreset, CameraKeyframe, CameraStoryboard, CameraVector3 } from './contracts/BlueprintProject';
export type { BlueprintRuntime, BlueprintScene, MountBlueprint, BlueprintState, TimelineState, SceneDiagnostics, BlueprintSceneFactory } from './contracts/ports';
export { PRESETS } from './contracts/BlueprintProject';
export { createDefaultProject, createDefaultStoryboard } from './contracts/defaults';
export { validateBlueprintProject, ProjectValidationError } from './contracts/validate';
import type { BlueprintProject } from './contracts/BlueprintProject';
import { mountBlueprintRuntime } from './core/runtime';
import { createBlueprintScene } from './scene/createBlueprintScene';
export function mountBlueprint(container: HTMLElement, project: BlueprintProject) {
  return mountBlueprintRuntime(container, project, { createScene: createBlueprintScene });
}
