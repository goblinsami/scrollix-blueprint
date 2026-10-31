import {AmbientLight,Color,DirectionalLight,PerspectiveCamera,Scene,SRGBColorSpace,WebGLRenderer} from 'three';
import type {BlueprintScene,SceneFactoryOptions} from '../contracts/ports';
import {sampleTimeline} from '../core/timeline';
import {ResourceOwner} from './ResourceOwner';
import {sampleSceneMotion} from './motion';
import {createSceneGeometry} from './sceneGeometry';
import {palettes} from './palettes';

/** Composition point only: lifecycle belongs to Core, camera and geometry to helpers. */
export function createBlueprintScene({container,project,signal}:SceneFactoryOptions):BlueprintScene{
  if(signal.aborted)throw new DOMException('Scene construction aborted.','AbortError');
  const owner=new ResourceOwner();let renderer:WebGLRenderer|undefined;
  let disposed=false,renderCount=0,renderedProgress=-1,progress=0,width=1,height=1;
  const scene=new Scene(),palette=palettes[project.art.preset];
  // Matching ground/background removes any artificial tabletop silhouette at the horizon.
  scene.background=new Color(palette.floor);
  const camera=new PerspectiveCamera(project.camera.fov,1,.025,20000);camera.up.set(0,1,0);
  let motion=sampleSceneMotion(0,project);
  const dispose=()=>{if(disposed)return;disposed=true;signal.removeEventListener('abort',dispose);try{owner.dispose();}finally{renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();scene.clear();}};
  try{
    renderer=new WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.outputColorSpace=SRGBColorSpace;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%;';renderer.domElement.setAttribute('role','img');
    renderer.domElement.setAttribute('aria-label','Recorrido cinematográfico sobre plano arquitectónico y composición abierta provisional');container.append(renderer.domElement);
    scene.add(new AmbientLight('#ffffff',1.25));
    const sun=new DirectionalLight('#fff5df',2.2);sun.position.set(8,18,12);scene.add(sun);
    const fill=new DirectionalLight('#dce9f0',.65);fill.position.set(-10,8,-4);scene.add(fill);
    const geometry=createSceneGeometry(scene,owner,project,palette,container.ownerDocument);
    const apply=()=>{
      const reduced=project.accessibility.reducedMotion==='always'||container.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
      geometry.setDraw(reduced?1:sampleTimeline(progress,project.timeline).draw);
      motion=sampleSceneMotion(reduced?1:progress,project,width<700?'mobile':'desktop',width/height);
      camera.aspect=width/height;camera.position.set(...motion.position);camera.up.set(...motion.up);camera.lookAt(...motion.lookAt);camera.updateProjectionMatrix();
      geometry.applyMotion(motion,camera,height);
    };
    const api:BlueprintScene={
      setProgress(value){if(disposed)return;const state=sampleTimeline(value,project.timeline);progress=state.progress;geometry.setDraw(state.draw);apply();},
      resize(w,h,dpr){if(disposed)return;if(![w,h,dpr].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Invalid scene size.');width=w;height=h;renderer!.setPixelRatio(Math.min(dpr,project.quality.dprCap));renderer!.setSize(w,h,false);apply();},
      render(){if(disposed)return;renderer!.render(scene,camera);renderCount++;renderedProgress=progress;},
      getDiagnostics(){return{renderCount,renderedProgress,...geometry.diagnostics(),cameraPosition:[camera.position.x,camera.position.y,camera.position.z],cameraLookAt:[...motion.lookAt],cameraProfile:motion.profile,cameraElevation:motion.elevation,geometries:owner.geometries,materials:owner.materials,textures:owner.textures};},
      dispose,
    };
    signal.addEventListener('abort',dispose,{once:true});if(signal.aborted){dispose();throw new DOMException('Scene construction aborted.','AbortError');}
    api.resize(Math.max(1,container.clientWidth),Math.max(1,container.clientHeight),1);api.setProgress(0);return api;
  }catch(error){dispose();throw error;}
}
