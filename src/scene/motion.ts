import type { BlueprintProject } from '../contracts/BlueprintProject';
import { sampleTimeline } from '../core/timeline';
export interface SceneMotion {
  wallHeight: number;
  direction: readonly [number,number,number];
  up: readonly [number,number,number];
  targetY: number;
}
const smooth=(t:number)=>t*t*(3-2*t);
/** Every transform is an absolute function of progress, never an accumulated delta. */
export function sampleSceneMotion(progress:number, project:BlueprintProject):SceneMotion {
  const state=sampleTimeline(progress,project.timeline);
  const extrude=smooth(state.extrude), reveal=smooth(state.reveal);
  const tilt=(35*extrude+15*reveal)*Math.PI/180;
  const yaw=(30*extrude+8*reveal)*Math.PI/180;
  const wallHeight=project.structure.wallHeight*extrude;
  return {wallHeight,targetY:wallHeight/2,
    direction:[Math.sin(tilt)*Math.sin(yaw),Math.cos(tilt),Math.sin(tilt)*Math.cos(yaw)],
    up:[-Math.cos(tilt)*Math.sin(yaw),Math.sin(tilt),-Math.cos(tilt)*Math.cos(yaw)],
  };
}
