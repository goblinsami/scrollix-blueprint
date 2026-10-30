import type { BlueprintProject } from './BlueprintProject';
export type BlueprintPhase = 'draw' | 'extrude' | 'reveal';
export interface TimelineState {
  progress: number;
  phase: BlueprintPhase;
  draw: number;
  extrude: number;
  reveal: number;
}
export interface SceneDiagnostics {
  renderCount: number;
  renderedProgress: number;
  lineSegmentsVisible: number;
  lineSegmentsTotal: number;
  wallHeight: number;
  cameraPosition: readonly [number, number, number];
  cameraLookAt: readonly [number, number, number];
  cameraProfile: 'desktop' | 'mobile';
  /** Degrees above the horizontal ground plane. */
  cameraElevation: number;
  geometries: number;
  materials: number;
  textures: number;
}
export interface BlueprintState extends TimelineState {
  sceneReady: boolean;
  disposed: boolean;
  diagnostics: SceneDiagnostics | null;
}
export interface BlueprintRuntime {
  updateProject(project: BlueprintProject): Promise<void>;
  setProgress(progress: number): void;
  resize(width: number, height: number, dpr: number): void;
  getState(): BlueprintState;
  subscribe(listener: (state: BlueprintState) => void): () => void;
  dispose(): void;
}
export interface BlueprintScene {
  setProgress(progress: number): void;
  resize(width: number, height: number, dpr: number): void;
  render(): void;
  getDiagnostics(): SceneDiagnostics;
  dispose(): void;
}
export interface SceneFactoryOptions {
  container: HTMLElement;
  project: BlueprintProject;
  signal: AbortSignal;
}
export type BlueprintSceneFactory = (options: SceneFactoryOptions) => BlueprintScene | Promise<BlueprintScene>;
export type MountBlueprint = (container: HTMLElement, project: BlueprintProject) => Promise<BlueprintRuntime>;
