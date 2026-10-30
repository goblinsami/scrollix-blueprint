import { describe, expect, it } from 'vitest';
import { createDefaultProject, createDefaultStoryboard } from '../src/contracts/defaults';
import { validateBlueprintProject, ProjectValidationError } from '../src/contracts/validate';
import type { BlueprintProject } from '../src/contracts/BlueprintProject';

describe('camera storyboard contract',()=>{
  it.each([[[1,1,0],[-1,1,0]],[[1,1,0],[-1,-1,0]]] as const)('rejects a path interval whose interpolated view collapses or becomes parallel to up', (a,b)=>{
    const p=createDefaultProject();p.camera.storyboard.desktop=[{at:0,position:[...a],lookAt:[0,0,0]},{at:p.camera.storyboard.holdStart,position:[...b],lookAt:[0,0,0],fit:true}];
    expect(()=>validateBlueprintProject(p)).toThrow(ProjectValidationError);
  });
  it('defaults legacy/minimal inputs and adapts pose timing to configured phase boundaries',()=>{
    const project=validateBlueprintProject({timeline:{drawEnd:.2,extrudeEnd:.8},structure:{width:20,depth:30}});
    expect(project.camera.storyboard.desktop.map(key=>key.at)).toEqual([0,.1,.2,.5,.8,.96]);
    expect(project.camera.storyboard.holdStart).toBe(.96);
    expect(project.camera.storyboard.mobile.at(-1)?.fit).toBe(true);
    expect(validateBlueprintProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
  });
  it('owns independent keyframes and coordinate tuples per project/profile',()=>{
    const a=createDefaultProject(),b=createDefaultProject();a.camera.storyboard.desktop[0]!.position[0]=100;
    expect(b.camera.storyboard.desktop[0]!.position[0]).not.toBe(100);
    expect(a.camera.storyboard.mobile[0]!.position[0]).not.toBe(100);
    const normalized=validateBlueprintProject(b);normalized.camera.storyboard.desktop[0]!.lookAt[0]=100;
    expect(b.camera.storyboard.desktop[0]!.lookAt[0]).not.toBe(100);
  });
  it('generates final authored rays at 62 degrees for extreme geometry aspect ratios',()=>{
    for(const structure of [{width:1,depth:100,wallHeight:.5},{width:100,depth:1,wallHeight:20}]){
      const story=createDefaultStoryboard({drawEnd:.35,extrudeEnd:.7},structure);
      for(const profile of ['desktop','mobile']as const){const key=story[profile].at(-1)!;const dx=(key.position[0]-key.lookAt[0])*structure.width,dy=(key.position[1]-key.lookAt[1])*structure.width,dz=(key.position[2]-key.lookAt[2])*structure.depth;expect(Math.atan2(dy,Math.hypot(dx,dz))*180/Math.PI).toBeCloseTo(62);}
    }
  });
  const invalid:Array<[string,(p:BlueprintProject)=>void]>=[
    ['hold before Reveal',p=>{p.camera.storyboard.holdStart=.6;}],['hold at endpoint',p=>{p.camera.storyboard.holdStart=1;}],
    ['missing keyframe',p=>{p.camera.storyboard.desktop=[];}],['too many keys',p=>{p.camera.storyboard.desktop=Array(33).fill(p.camera.storyboard.desktop[0]!);}],
    ['unordered keys',p=>{p.camera.storyboard.desktop[2]!.at=.1;}],['missing start',p=>{p.camera.storyboard.desktop[0]!.at=.01;}],
    ['missing hold arrival',p=>{p.camera.storyboard.desktop.at(-1)!.at=.99;}],['fit before final',p=>{p.camera.storyboard.desktop[0]!.fit=true;}],
    ['no final fit',p=>{p.camera.storyboard.mobile.at(-1)!.fit=false;}],['nonfinite point',p=>{p.camera.storyboard.desktop[0]!.position[1]=Infinity;}],
    ['lookAt equals position',p=>{p.camera.storyboard.desktop[0]!.lookAt=[...p.camera.storyboard.desktop[0]!.position];}],
    ['up parallel view',p=>{p.camera.storyboard.desktop[0]!.position=[0,1,0];p.camera.storyboard.desktop[0]!.lookAt=[0,0,0];}],
    ['sparse tuple',p=>{p.camera.storyboard.desktop[0]!.position=new Array(3)as[number,number,number];}],
    ['sparse profile',p=>{p.camera.storyboard.mobile=new Array(6);}],
    ['unknown keyframe field',p=>{Object.assign(p.camera.storyboard.desktop[0]!,{cameraSpeed:3});}],
  ];
  it.each(invalid)('rejects %s',(_name,change)=>{const p=createDefaultProject();change(p);expect(()=>validateBlueprintProject(p)).toThrow(ProjectValidationError);});
});
