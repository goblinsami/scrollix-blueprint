import type { BlueprintProject } from '../contracts/BlueprintProject';
import { sampleTimeline } from '../core/timeline';
import { sampleCameraPath } from './cameraPath';
import type { CameraPose,CameraProfile } from './cameraPath';
export interface SceneMotion extends CameraPose {
  wallHeight:number;direction:readonly[number,number,number];targetY:number;
}
const smooth=(t:number)=>t*t*(3-2*t);
/** One global timeline drives both the geometry and authored spatial storyboard. */
export function sampleSceneMotion(progress:number,project:BlueprintProject,profile:CameraProfile='desktop',aspect=16/9):SceneMotion {
  const state=sampleTimeline(progress,project.timeline),pose=sampleCameraPath(progress,project,profile,aspect);
  const ray=[pose.position[0]-pose.lookAt[0],pose.position[1]-pose.lookAt[1],pose.position[2]-pose.lookAt[2]],length=Math.hypot(...ray);
  return{...pose,wallHeight:project.structure.wallHeight*smooth(state.extrude),targetY:pose.lookAt[1],direction:[ray[0]!/length,ray[1]!/length,ray[2]!/length]};
}
