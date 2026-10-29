type Vec3 = readonly [number,number,number];
const dot = (a: Vec3,b: Vec3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a: Vec3,b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = (v: Vec3): Vec3 => { const n=Math.hypot(...v); if(!n) throw new RangeError('Direction must be nonzero.'); return [v[0]/n,v[1]/n,v[2]/n]; };
/** Distance which fits all eight bounding corners in both perspective axes. */
export function getFramingDistance(width:number,depth:number,height:number,aspect:number,fov:number,fill:number,direction:Vec3,cameraUp?:Vec3):number {
  if (![width,depth,aspect].every(v=>Number.isFinite(v)&&v>0) || !Number.isFinite(height)||height<0 || !Number.isFinite(fov)||fov<=0||fov>=180 || !Number.isFinite(fill)||fill<=0||fill>1 || !direction.every(Number.isFinite) || (cameraUp !== undefined && !cameraUp.every(Number.isFinite))) throw new RangeError('Invalid framing inputs.');
  const back=unit(direction);
  const reference:Vec3 = cameraUp ?? (Math.abs(back[1])>0.999 ? [0,0,-1]:[0,1,0]);
  const right=unit(cross(reference,back)), up=unit(cross(back,right));
  const tanV=Math.tan(fov*Math.PI/360)*fill, tanH=tanV*aspect;
  let distance=0;
  for(const x of [-width/2,width/2]) for(const y of [-height/2,height/2]) for(const z of [-depth/2,depth/2]) {
    const corner:Vec3=[x,y,z], near=dot(corner,back);
    distance=Math.max(distance,near+Math.abs(dot(corner,right))/tanH,near+Math.abs(dot(corner,up))/tanV);
  }
  return distance+0.5;
}
