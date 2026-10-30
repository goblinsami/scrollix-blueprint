import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { createDefaultProject } from '../src/contracts/defaults';
import { sampleSceneMotion } from '../src/scene/motion';
import { sampleCameraPath } from '../src/scene/cameraPath';
import { buildFloorPlan } from '../src/scene/floorPlan';

const pointDistance = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((value, i) => value - b[i]!));
function cameraAt(progress: number, profile: 'desktop'|'mobile', aspect: number) {
  const project=createDefaultProject(), pose=sampleCameraPath(progress,project,profile,aspect);
  const camera=new PerspectiveCamera(project.camera.fov,aspect,.025,20000);
  camera.position.set(...pose.position);camera.up.set(...pose.up);camera.lookAt(...pose.lookAt);camera.updateMatrixWorld();camera.updateProjectionMatrix();
  return {project,pose,camera};
}
describe('M3.5-A spatial storyboard', () => {
  it('has structural interests visible inside the mobile Draw frames',()=>{
    const p=createDefaultProject(),plan=buildFloorPlan(p.structure.width,p.structure.depth);
    for(const progress of [p.timeline.drawEnd/2,p.timeline.drawEnd]){
      const {camera}=cameraAt(progress,'mobile',.65);
      const interests=plan.structural.flatMap(axis=>[axis.start,axis.end,[(axis.start[0]+axis.end[0])/2,(axis.start[1]+axis.end[1])/2]]);
      expect(interests.some(([x,z])=>{const point=new Vector3(x,.01,z).project(camera);return Math.abs(point.x)<.95&&Math.abs(point.y)<.95&&point.z> -1&&point.z<1;}),'Draw must show a structural interest, not only the grid').toBe(true);
    }
  });
  it('keeps a single global extrusion timeline and the authored hold', () => {
    const p=createDefaultProject();
    expect(sampleSceneMotion(p.timeline.drawEnd,p).wallHeight).toBe(0);
    expect(sampleSceneMotion((p.timeline.drawEnd+p.timeline.extrudeEnd)/2,p).wallHeight).toBeCloseTo(1.5);
    expect(sampleSceneMotion(p.timeline.extrudeEnd,p).wallHeight).toBe(3);
    expect(sampleSceneMotion(1,p).wallHeight).toBe(3);
  });
  it.each(['desktop','mobile'] as const)('has finite continuous reversible poses at every %s key and phase boundary',profile=>{
    const project=createDefaultProject(),points=new Set([...project.camera.storyboard[profile].map(key=>key.at),project.timeline.drawEnd,project.timeline.extrudeEnd]);
    for(const at of points){
      const left=sampleCameraPath(Math.max(0,at-1e-7),project,profile),right=sampleCameraPath(Math.min(1,at+1e-7),project,profile);
      expect(pointDistance(left.position,right.position)).toBeLessThan(1e-5);expect(pointDistance(left.lookAt,right.lookAt)).toBeLessThan(1e-5);
    }
    const reference=sampleCameraPath(.525,project,profile);
    for(let i=0;i<=100;i++){
      const pose=sampleCameraPath(i/100,project,profile),motion=sampleSceneMotion(i/100,project,profile);
      expect([...pose.position,...pose.lookAt,...pose.up,pose.elevation].every(Number.isFinite)).toBe(true);
      expect(new Vector3(...pose.position).sub(new Vector3(...pose.lookAt)).cross(new Vector3(...pose.up)).length()).toBeGreaterThan(1e-5);
      expect(Math.hypot(...motion.direction)).toBeCloseTo(1);expect(Math.hypot(...pose.up)).toBeCloseTo(1);
    }
    expect(sampleCameraPath(.525,project,profile)).toEqual(reference);
  });
  it('actually translates across space and uses distinct responsive paths',()=>{
    const p=createDefaultProject(),a=sampleCameraPath(0,p),b=sampleCameraPath(p.timeline.drawEnd,p),mobile=sampleCameraPath(0,p,'mobile',.65);
    expect(Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2])).toBeGreaterThan(p.structure.width*.4);
    expect(pointDistance(a.lookAt,b.lookAt)).toBeGreaterThan(p.structure.width*.4);
    expect(mobile.position).not.toEqual(a.position);expect(a.elevation).toBeLessThan(30);
  });
  it.each(['desktop','mobile'] as const)('reveals the complete composition only at the final %s camera and holds it to 1',profile=>{
    const p=createDefaultProject(),aspect=profile==='desktop'?2.48:.65,hold=p.camera.storyboard.holdStart;
    const final=sampleCameraPath(1,p,profile,aspect);
    expect(final.elevation).toBeGreaterThanOrEqual(55);expect(final.elevation).toBeLessThanOrEqual(70);
    for(const progress of [hold,(hold+1)/2,1]){
      const pose=sampleCameraPath(progress,p,profile,aspect);
      expect(pose.position).toEqual(final.position);expect(pose.lookAt).toEqual(final.lookAt);expect(pose.holding).toBe(true);
    }
    const plan=buildFloorPlan(p.structure.width,p.structure.depth),maxHeight=Math.max(...plan.wallAxes.map(axis=>axis.heightScale))*p.structure.wallHeight;
    const {camera}=cameraAt(1,profile,aspect);
    for(const x of [-plan.bounds.width/2,plan.bounds.width/2])for(const y of [0,maxHeight])for(const z of [-plan.bounds.depth/2,plan.bounds.depth/2]){
      const point=new Vector3(x,y,z).project(camera);expect(Math.abs(point.x)).toBeLessThanOrEqual(1);expect(Math.abs(point.y)).toBeLessThanOrEqual(1);expect(point.z).toBeGreaterThan(-1);expect(point.z).toBeLessThan(1);
    }
    // Partial discovery is intentional: the complete composition must NOT fit Draw.
    for(const progress of [p.timeline.drawEnd/2,p.timeline.drawEnd]){
      const {camera:close}=cameraAt(progress,profile,aspect);
      const projected=plan.wallAxes.flatMap(axis=>[axis.start,axis.end]).map(([x,z])=>new Vector3(x,0,z).project(close));
      expect(projected.some(point=>Math.abs(point.x)>1||Math.abs(point.y)>1||point.z>1||point.z< -1),profile+' Draw at '+progress).toBe(true);
    }
  });
  it.each(['desktop','mobile'] as const)('does not move the %s camera through a currently extruded wall',profile=>{
    const p=createDefaultProject(),plan=buildFloorPlan(p.structure.width,p.structure.depth),thickness=Math.max(.09,Math.min(p.structure.width,p.structure.depth)*.012),near=.025;
    for(let i=0;i<=1000;i++){
      const motion=sampleSceneMotion(i/1000,p,profile,profile==='desktop'?2.48:.65),[x,y,z]=motion.position;
      for(const axis of plan.wallAxes){
        const height=motion.wallHeight*axis.heightScale;if(y>height+near||height===0)continue;
        const dx=axis.end[0]-axis.start[0],dz=axis.end[1]-axis.start[1];
        const t=Math.max(0,Math.min(1,((x-axis.start[0])*dx+(z-axis.start[1])*dz)/(dx*dx+dz*dz)));
        const distance=Math.hypot(x-axis.start[0]-dx*t,z-axis.start[1]-dz*t);
        expect(distance,profile+' at '+i/1000+' near '+axis.id).toBeGreaterThan(thickness/2+near);
      }
    }
  });
});
