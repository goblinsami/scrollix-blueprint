import { AmbientLight, BoxGeometry, BufferGeometry, CanvasTexture, Color, DirectionalLight, DoubleSide, EdgesGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, WebGLRenderer } from 'three';
import type { ArtPreset } from '../contracts/BlueprintProject';
import type { BlueprintScene, SceneFactoryOptions } from '../contracts/ports';
import { sampleTimeline } from '../core/timeline';
import { ResourceOwner } from './ResourceOwner';
import { buildFloorPlan, subdivideSegments } from './floorPlan';
import type { PlanSegment } from './floorPlan';
import { getFramingDistance } from './framing';
import { sampleSceneMotion } from './motion';

const palettes: Record<ArtPreset,{background:string;floor:string;ink:string;muted:string;grid:string;accent:string;wall:string;edge:string}> = {
  paper: { background:'#e9e6dc', floor:'#f7f4ea', ink:'#26382f', muted:'#728077', grid:'#dce0d4', accent:'#b78954', wall:'#e5e4d7', edge:'#7b897d' },
  'inverted-blueprint': { background:'#091b32', floor:'#102b49', ink:'#e5f4f5', muted:'#92b5cc', grid:'#254461', accent:'#d5a872', wall:'#3c6684', edge:'#bad9e8' },
  'material-study': { background:'#d8d0c4', floor:'#eee6d9', ink:'#514537', muted:'#8f7c62', grid:'#d6c7b3', accent:'#b27144', wall:'#c7ac8d', edge:'#816a50' },
};

/** Scene owns all its GPU allocations; Core owns scheduling and host lifecycle. */
export function createBlueprintScene({ container, project, signal }: SceneFactoryOptions): BlueprintScene {
  if (signal.aborted) throw new DOMException('Scene construction aborted.','AbortError');
  const owner=new ResourceOwner();
  let renderer:WebGLRenderer|undefined;
  let disposed=false,renderCount=0,renderedProgress=-1,progress=0,width=1,height=1;
  const scene=new Scene(), palette=palettes[project.art.preset];
  scene.background=new Color(palette.background);
  const camera=new PerspectiveCamera(project.camera.fov,1,0.1,2000);
  camera.up.set(0,0,-1);
  const plan=buildFloorPlan(project.structure.width,project.structure.depth);
  const lineGroups:Array<{geometry:BufferGeometry;count:number;start:number;end:number}>=[];
  const labels:Array<{mesh:Mesh;start:number;baseWidth:number;baseX:number;side:boolean}>=[];
  const step=Math.min(project.structure.width,project.structure.depth)/80;
  let visibleSegments=0,totalSegments=0;
  let actualWallHeight=0;
  const walls: Array<{mesh:Mesh;length:number}>=[];

  const dispose=()=>{
    if(disposed)return;
    disposed=true;
    signal.removeEventListener('abort',dispose);
    try { owner.dispose(); } finally {
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove(); scene.clear();
    }
  };
  try {
    renderer=new WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.outputColorSpace=SRGBColorSpace;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%;';
    renderer.domElement.setAttribute('aria-label','Pabellón arquitectónico conceptual: plano, puerta, cotas y muros extruidos');
    renderer.domElement.setAttribute('role','img');
    container.append(renderer.domElement);
    const board=new Mesh(owner.ownGeometry(new PlaneGeometry(plan.bounds.width,plan.bounds.depth)),owner.ownMaterial(new MeshBasicMaterial({color:palette.floor,side:DoubleSide})));
    board.rotation.x=-Math.PI/2; board.position.y=-0.03; scene.add(board);
    scene.add(new AmbientLight('#ffffff',1.25));
    const sun=new DirectionalLight('#fff5df',2.2);sun.position.set(8,18,12);scene.add(sun);
    const fillLight=new DirectionalLight('#dce9f0',0.65);fillLight.position.set(-10,8,-4);scene.add(fillLight);

    const addLines=(segments:PlanSegment[],color:string,opacity:number,start:number,end:number,subdivide=true)=>{
      const parts=subdivide?subdivideSegments(segments,step):segments;
      const positions=parts.flatMap(s=>[s.start[0],0.01,s.start[1],s.end[0],0.01,s.end[1]]);
      const geometry=owner.ownGeometry(new BufferGeometry());
      geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
      const material=owner.ownMaterial(new LineBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
      const object=new LineSegments(geometry,material);scene.add(object);
      if(start<0)geometry.setDrawRange(0,parts.length*2);
      else {geometry.setDrawRange(0,0);lineGroups.push({geometry,count:parts.length,start,end});totalSegments+=parts.length;}
    };
    const grid:PlanSegment[]=[];
    const gridStep=Math.max(0.5,Math.min(project.structure.width,project.structure.depth)/12);
    for(let x=-project.structure.width/2;x<=project.structure.width/2+0.001;x+=gridStep)grid.push({start:[x,-project.structure.depth/2],end:[x,project.structure.depth/2]});
    for(let z=-project.structure.depth/2;z<=project.structure.depth/2+0.001;z+=gridStep)grid.push({start:[-project.structure.width/2,z],end:[project.structure.width/2,z]});
    addLines(grid,palette.grid,0.7,-1,0,false);
    addLines(plan.structural,palette.ink,1,0,0.68);
    addLines(plan.door,palette.accent,1,0.55,0.86);
    addLines(plan.annotations,palette.muted,1,0.72,1);

    for(let i=0;i<plan.labels.length;i++){
      const label=plan.labels[i]!;
      const canvas=container.ownerDocument.createElement('canvas');canvas.width=768;canvas.height=192;
      const context=canvas.getContext('2d');if(!context)throw new Error('Technical annotations require canvas 2D.');
      context.clearRect(0,0,canvas.width,canvas.height);context.fillStyle=palette.ink;
      context.font='600 88px ui-monospace, Consolas, monospace';context.textAlign='center';context.textBaseline='middle';context.fillText(label.text,384,96);
      const texture=owner.ownTexture(new CanvasTexture(canvas));texture.colorSpace=SRGBColorSpace;
      const material=owner.ownMaterial(new MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,side:DoubleSide}));
      const labelWidth=Math.max(1,Math.min(project.structure.width,project.structure.depth)*0.21);
      const mesh=new Mesh(owner.ownGeometry(new PlaneGeometry(labelWidth,labelWidth/4)),material);
      mesh.rotation.x=-Math.PI/2;if(i===1)mesh.rotation.z=Math.PI/2;
      mesh.position.set(label.position[0],0.025,label.position[1]);mesh.visible=false;mesh.renderOrder=10;scene.add(mesh);labels.push({mesh,start:i===0?0.88:0.94,baseWidth:labelWidth,baseX:label.position[0],side:i===1});
    }
    const wallGeometry=owner.ownGeometry(new BoxGeometry(1,1,1));
    const wallMaterial=owner.ownMaterial(new MeshStandardMaterial({color:palette.wall,roughness:0.9,metalness:0.02}));
    const edgeGeometry=owner.ownGeometry(new EdgesGeometry(wallGeometry));
    const edgeMaterial=owner.ownMaterial(new LineBasicMaterial({color:palette.edge,transparent:true,opacity:0.65}));
    const thickness=Math.max(0.09,Math.min(project.structure.width,project.structure.depth)*0.012);
    for(const segment of plan.structural){
      const dx=segment.end[0]-segment.start[0],dz=segment.end[1]-segment.start[1];
      const mesh=new Mesh(wallGeometry,wallMaterial);
      mesh.position.set((segment.start[0]+segment.end[0])/2,0,(segment.start[1]+segment.end[1])/2);
      mesh.rotation.y=-Math.atan2(dz,dx);mesh.visible=false;
      mesh.add(new LineSegments(edgeGeometry,edgeMaterial));scene.add(mesh);
      walls.push({mesh,length:Math.hypot(dx,dz)});
    }
    const frameCamera=()=>{
      const motion=sampleSceneMotion(progress,project);
      actualWallHeight=motion.wallHeight;
      for(const wall of walls){
        wall.mesh.visible=actualWallHeight>0;
        wall.mesh.position.y=actualWallHeight/2;
        wall.mesh.scale.set(wall.length,actualWallHeight,thickness);
      }
      camera.aspect=width/height;
      const fill=width<700?project.camera.mobileFill:project.camera.desktopFill;
      // The same basis is used for camera and fitting, avoiding a roll jump at top view.
      const lateralClearance=actualWallHeight*motion.direction[0]/Math.max(0.2,motion.direction[1]);
      const distance=getFramingDistance(plan.bounds.width+2*lateralClearance,plan.bounds.depth,actualWallHeight,camera.aspect,project.camera.fov,fill,motion.direction,motion.up);
      camera.up.set(...motion.up);
      camera.position.set(motion.direction[0]*distance,motion.targetY+motion.direction[1]*distance,motion.direction[2]*distance);
      camera.far=Math.max(100,distance+Math.max(plan.bounds.width,plan.bounds.depth)*4+actualWallHeight*4);
      camera.lookAt(0,motion.targetY,0);camera.updateProjectionMatrix();
      // Correct ground-plane foreshortening while keeping >=12 CSS-pixel glyphs.
      const glyphPixels=width<700?12:13;
      const worldPerPixel=2*distance*Math.tan(project.camera.fov*Math.PI/360)/height;
      const labelWorldWidth=glyphPixels*768/88*worldPerPixel/Math.max(0.45,motion.direction[1]);
      for(const label of labels){
        label.mesh.scale.setScalar(labelWorldWidth/label.baseWidth);
        // Move the far-side annotation beyond the projected wall silhouette.
        label.mesh.position.x=label.baseX-(label.side?lateralClearance:0);
      }
    };
    const api:BlueprintScene={
      setProgress(value){
        if(disposed)return;
        const state=sampleTimeline(value,project.timeline);progress=state.progress;visibleSegments=0;
        for(const group of lineGroups){const fraction=Math.max(0,Math.min(1,(state.draw-group.start)/(group.end-group.start)));const count=Math.floor(group.count*fraction+1e-8);group.geometry.setDrawRange(0,count*2);visibleSegments+=count;}
        for(const label of labels)label.mesh.visible=state.draw>=label.start;
        frameCamera();
      },
      resize(w,h,dpr){
        if(disposed)return;
        if(![w,h,dpr].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Invalid scene size.');
        width=w;height=h;renderer!.setPixelRatio(Math.min(dpr,project.quality.dprCap));renderer!.setSize(w,h,false);frameCamera();
      },
      render(){if(disposed)return;renderer!.render(scene,camera);renderCount++;renderedProgress=progress;},
      getDiagnostics(){return{renderCount,renderedProgress,lineSegmentsVisible:visibleSegments,lineSegmentsTotal:totalSegments,wallHeight:walls[0]?.mesh.visible ? walls[0].mesh.scale.y : 0,cameraPosition:[camera.position.x,camera.position.y,camera.position.z],geometries:owner.geometries,materials:owner.materials,textures:owner.textures};},
      dispose,
    };
    signal.addEventListener('abort',dispose,{once:true});
    if(signal.aborted){dispose();throw new DOMException('Scene construction aborted.','AbortError');}
    api.resize(Math.max(1,container.clientWidth),Math.max(1,container.clientHeight),1);api.setProgress(progress);
    return api;
  }catch(error){dispose();throw error;}
}
