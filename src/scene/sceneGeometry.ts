import {BoxGeometry,BufferGeometry,CanvasTexture,DoubleSide,EdgesGeometry,Float32BufferAttribute,LineBasicMaterial,LineSegments,Mesh,MeshBasicMaterial,MeshStandardMaterial,PlaneGeometry,SRGBColorSpace} from 'three';
import type {PerspectiveCamera,Scene} from 'three';
import type {BlueprintProject} from '../contracts/BlueprintProject';
import {buildFloorPlan,subdivideSegments} from './floorPlan';
import type {PlanSegment} from './floorPlan';
import type {ResourceOwner} from './ResourceOwner';
import type {ScenePalette} from './palettes';
import type {SceneMotion} from './motion';

/** All drawing and extrusion share the provisional model's wall axes. No scheduler here. */
export function createSceneGeometry(scene:Scene,owner:ResourceOwner,project:BlueprintProject,palette:ScenePalette,document:Document){
  const plan=buildFloorPlan(project.structure.width,project.structure.depth);
  const groups:Array<{geometry:BufferGeometry;count:number;start:number;end:number}>=[];
  const labels:Array<{mesh:Mesh;start:number;baseWidth:number;baseX:number;side:boolean}>=[];
  const walls:Array<{mesh:Mesh;length:number;heightScale:number}>=[];
  let visibleSegments=0,totalSegments=0;
  const scale=Math.max(project.structure.width,project.structure.depth);
  // This is ground, not a finite model board: its edge lies far beyond the visible frustum.
  const ground=new Mesh(owner.ownGeometry(new PlaneGeometry(scale*2000,scale*2000)),owner.ownMaterial(new MeshBasicMaterial({color:palette.floor,side:DoubleSide})));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.03;scene.add(ground);
  const step=Math.min(project.structure.width,project.structure.depth)/80;
  const lines=(segments:PlanSegment[],color:string,opacity:number,start:number,end:number,subdivide=true)=>{
    const parts=subdivide?subdivideSegments(segments,step):segments;
    const geometry=owner.ownGeometry(new BufferGeometry());
    geometry.setAttribute('position',new Float32BufferAttribute(parts.flatMap(s=>[s.start[0],.01,s.start[1],s.end[0],.01,s.end[1]]),3));
    const material=owner.ownMaterial(new LineBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
    scene.add(new LineSegments(geometry,material));
    if(start<0)geometry.setDrawRange(0,parts.length*2);
    else{geometry.setDrawRange(0,0);groups.push({geometry,count:parts.length,start,end});totalSegments+=parts.length;}
  };
  const grid:PlanSegment[]=[],gridStep=Math.max(.5,Math.min(project.structure.width,project.structure.depth)/12),extent=scale*16;
  for(let x=-extent;x<=extent;x+=gridStep)grid.push({start:[x,-extent],end:[x,extent]});
  for(let z=-extent;z<=extent;z+=gridStep)grid.push({start:[-extent,z],end:[extent,z]});
  lines(grid,palette.grid,.7,-1,0,false);
  lines(plan.structural,palette.ink,1,0,.72);
  lines(plan.door,palette.accent,1,.22,.62);
  lines(plan.annotations,palette.muted,1,.65,1);
  for(let i=0;i<plan.labels.length;i++){
    const label=plan.labels[i]!,canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;
    const context=canvas.getContext('2d');if(!context)throw new Error('Technical annotations require canvas 2D.');
    context.fillStyle=palette.ink;context.font='600 88px ui-monospace,Consolas,monospace';context.textAlign='center';context.textBaseline='middle';context.fillText(label.text,384,96);
    const texture=owner.ownTexture(new CanvasTexture(canvas));texture.colorSpace=SRGBColorSpace;
    const material=owner.ownMaterial(new MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,side:DoubleSide}));
    const baseWidth=Math.max(1,Math.min(project.structure.width,project.structure.depth)*.21);
    const mesh=new Mesh(owner.ownGeometry(new PlaneGeometry(baseWidth,baseWidth/4)),material);
    mesh.rotation.x=-Math.PI/2;if(i===1)mesh.rotation.z=Math.PI/2;
    mesh.position.set(label.position[0],.025,label.position[1]);mesh.visible=false;mesh.renderOrder=10;scene.add(mesh);
    labels.push({mesh,start:i===0?.88:.94,baseWidth,baseX:label.position[0],side:i===1});
  }
  const wallGeometry=owner.ownGeometry(new BoxGeometry(1,1,1)),edgeGeometry=owner.ownGeometry(new EdgesGeometry(wallGeometry));
  const wallMaterial=owner.ownMaterial(new MeshStandardMaterial({color:palette.wall,roughness:.9,metalness:.02}));
  const edgeMaterial=owner.ownMaterial(new LineBasicMaterial({color:palette.edge,transparent:true,opacity:.65}));
  for(const axis of plan.wallAxes){
    const dx=axis.end[0]-axis.start[0],dz=axis.end[1]-axis.start[1];
    const mesh=new Mesh(wallGeometry,wallMaterial);mesh.position.set((axis.start[0]+axis.end[0])/2,0,(axis.start[1]+axis.end[1])/2);
    mesh.rotation.y=-Math.atan2(dz,dx);mesh.visible=false;mesh.add(new LineSegments(edgeGeometry,edgeMaterial));scene.add(mesh);
    walls.push({mesh,length:Math.hypot(dx,dz),heightScale:axis.heightScale});
  }
  return{
    plan,
    setDraw(draw:number){visibleSegments=0;for(const group of groups){const fraction=Math.max(0,Math.min(1,(draw-group.start)/(group.end-group.start)));const count=Math.floor(group.count*fraction+1e-8);group.geometry.setDrawRange(0,count*2);visibleSegments+=count;}for(const label of labels)label.mesh.visible=draw>=label.start;},
    applyMotion(motion:SceneMotion,camera:PerspectiveCamera,viewportHeight:number){
      const thickness=Math.max(.09,Math.min(project.structure.width,project.structure.depth)*.012);
      for(const wall of walls){const h=motion.wallHeight*wall.heightScale;wall.mesh.visible=h>0;wall.mesh.position.y=h/2;wall.mesh.scale.set(wall.length,h,thickness);}
      for(const label of labels){
        const clearance=motion.wallHeight*Math.max(0,motion.direction[0])/Math.max(.2,motion.direction[1]);
        label.mesh.position.x=label.baseX-(label.side?clearance:0);
        const distance=Math.hypot(camera.position.x-label.mesh.position.x,camera.position.y-label.mesh.position.y,camera.position.z-label.mesh.position.z);
        const worldPerPixel=2*distance*Math.tan(project.camera.fov*Math.PI/360)/viewportHeight;
        // Technical text stays readable without covering nearby architecture at low angles.
        const foreshortening=Math.max(.45,motion.direction[1]);
        const labelWorldWidth=12*768/88*worldPerPixel/foreshortening;
        label.mesh.scale.setScalar(labelWorldWidth/label.baseWidth);
      }
    },
    diagnostics(){return{lineSegmentsVisible:visibleSegments,lineSegmentsTotal:totalSegments,wallHeight:walls[0]?.mesh.visible?walls[0].mesh.scale.y:0};},
  };
}
