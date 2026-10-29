import type { BlueprintProject } from './BlueprintProject';
/** Design contracts only. No runtime or scene implementation in phase 0. */
export interface BlueprintRuntime {
  updateProject(project: BlueprintProject): Promise<void>;
  setProgress(progress: number): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}
export interface BlueprintScene {
  setProgress(progress: number): void;
  resize(width: number, height: number, dpr: number): void;
  render(): void;
  dispose(): void;
}
export type MountBlueprint = (container: HTMLElement, project: BlueprintProject) => Promise<BlueprintRuntime>;
