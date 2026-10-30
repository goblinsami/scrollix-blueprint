import type { BlueprintProject, CameraVector3 } from '../contracts/BlueprintProject';
import { normalizeProgress } from '../core/timeline';
import { buildFloorPlan } from './floorPlan';
import { getFramingDistance } from './framing';
export type CameraProfile = 'desktop'|'mobile';
export interface CameraPose {
  position:CameraVector3;lookAt:CameraVector3;up:CameraVector3;
  profile:CameraProfile;elevation:number;holding:boolean;
}
const smooth=(t:number)=>t*t*(3-2*t);
const scale=(v:CameraVector3,p:BlueprintProject):CameraVector3=>[v[0]*p.structure.width,v[1]*p.structure.width,v[2]*p.structure.depth];
/** Only the last storyboard keyframe is fitted. Earlier poses remain authored close shots. */
export function sampleCameraPath(progress:number,project:BlueprintProject,profile:CameraProfile='desktop',aspect=16/9):CameraPose {
  if(!Number.isFinite(aspect)||aspect<=0)throw new RangeError('Camera aspect must be positive.');
  const p=normalizeProgress(progress),story=project.camera.storyboard,keys=story[profile];
  const poses=keys.map(key=>{
    const lookAt=scale(key.lookAt,project);let position=scale(key.position,project);
    if(key.fit){
      const plan=buildFloorPlan(project.structure.width,project.structure.depth);
      const maxHeight=Math.max(...plan.wallAxes.map(axis=>axis.heightScale))*project.structure.wallHeight;
      const ray:CameraVector3=[position[0]-lookAt[0],position[1]-lookAt[1],position[2]-lookAt[2]];
      const length=Math.hypot(...ray),direction:CameraVector3=[ray[0]/length,ray[1]/length,ray[2]/length];
      const fill=profile==='mobile'?project.camera.mobileFill:project.camera.desktopFill;
      const distance=getFramingDistance(plan.bounds.width+2*Math.abs(lookAt[0]),plan.bounds.depth+2*Math.abs(lookAt[2]),maxHeight+2*Math.abs(lookAt[1]-maxHeight/2),aspect,project.camera.fov,fill,direction,[0,1,0]);
      position=[lookAt[0]+direction[0]*distance,lookAt[1]+direction[1]*distance,lookAt[2]+direction[2]*distance];
    }
    return{at:key.at,position,lookAt};
  });
  let index=0;while(index<poses.length-2&&p>poses[index+1]!.at)index++;
  const a=poses[index]!,b=poses[index+1]!;
  const t=smooth(Math.max(0,Math.min(1,(p-a.at)/(b.at-a.at))));
  const mix=(start:CameraVector3,end:CameraVector3):CameraVector3=>[start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t,start[2]+(end[2]-start[2])*t];
  const position=mix(a.position,b.position),lookAt=mix(a.lookAt,b.lookAt);
  const elevation=Math.atan2(position[1]-lookAt[1],Math.hypot(position[0]-lookAt[0],position[2]-lookAt[2]))*180/Math.PI;
  return{position,lookAt,up:[0,1,0],profile,elevation,holding:p>=story.holdStart};
}
