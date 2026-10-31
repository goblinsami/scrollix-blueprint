export type PlanPoint = [number,number];
export interface PlanSegment { start: PlanPoint; end: PlanPoint }
export interface WallAxis extends PlanSegment { id: string; heightScale: number }
export interface FloorPlan {
  structural: PlanSegment[];
  wallAxes: WallAxis[];
  annotations: PlanSegment[];
  door: PlanSegment[];
  labels: Array<{text:string;position:PlanPoint}>;
  bounds: {width:number;depth:number};
}
/** Temporary three-zone composition for reviewing the camera, not the final B geometry. */
export function buildFloorPlan(width:number,depth:number):FloorPlan {
  if(![width,depth].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Plan dimensions must be positive.');
  const wallAxes:WallAxis[]=[];
  const wall=(id:string,a:PlanPoint,b:PlanPoint,heightScale:number)=>wallAxes.push({id,start:[a[0]*width,a[1]*depth],end:[b[0]*width,b[1]*depth],heightScale});
  // West studio: open north-east edge and a real entry in the south screen.
  wall('west-spine',[-.48,.12],[-.48,.48],1);
  wall('west-back',[-.48,.12],[-.24,.12],1.15);
  wall('west-entry-left',[-.48,.48],[-.28,.48],.85);
  wall('west-entry-right',[-.14,.48],[-.05,.48],.85);
  wall('west-return',[-.05,.35],[-.05,.48],.65);
  wall('west-low-screen',[-.48,.30],[-.31,.30],.5);
  // East gallery: long screen, open approach and a lower freestanding blade.
  wall('east-spine',[.50,-.05],[.50,.30],1.25);
  wall('east-back',[.10,-.05],[.50,-.05],1.25);
  wall('east-return',[.30,.30],[.50,.30],.8);
  wall('east-low-screen',[.23,.11],[.23,.24],.55);
  // North forum: a taller L with two open corners, not a closed room.
  wall('north-back',[-.38,-.48],[.10,-.48],1.3);
  wall('north-spine',[-.38,-.48],[-.38,-.24],1.3);
  wall('north-return',[-.38,-.24],[-.23,-.24],.9);
  wall('north-blade',[.10,-.48],[.10,-.38],1.05);
  const door:PlanSegment[]=[], annotations:PlanSegment[]=[];
  const line=(pool:PlanSegment[],start:PlanPoint,end:PlanPoint)=>pool.push({start,end});
  const hinge:PlanPoint=[-.28*width,.48*depth], gap=.14*width;
  line(door,hinge,[hinge[0],hinge[1]-gap]);
  for(let i=0;i<32;i++){
    const a=i*Math.PI/64,b=(i+1)*Math.PI/64;
    line(door,[hinge[0]+Math.cos(a)*gap,hinge[1]-Math.sin(a)*gap],[hinge[0]+Math.cos(b)*gap,hinge[1]-Math.sin(b)*gap]);
  }
  const thickness=Math.max(.09,Math.min(width,depth)*.012);
  const minX=Math.min(...wallAxes.flatMap(a=>[a.start[0],a.end[0]]))-thickness/2;
  const maxX=Math.max(...wallAxes.flatMap(a=>[a.start[0],a.end[0]]))+thickness/2;
  const minZ=Math.min(...wallAxes.flatMap(a=>[a.start[1],a.end[1]]))-thickness/2;
  const maxZ=Math.max(...wallAxes.flatMap(a=>[a.start[1],a.end[1]]))+thickness/2;
  const x=maxX,z=maxZ,margin=Math.max(.7,Math.min(width,depth)*.12),tick=margin*.16;
  const dz=z+margin,dx=minX-margin;
  line(annotations,[minX,z+margin*.25],[minX,dz+tick*2]);line(annotations,[x,z+margin*.25],[x,dz+tick*2]);
  line(annotations,[minX,dz],[x,dz]);
  for(const px of[minX,x])line(annotations,[px-tick,dz+tick],[px+tick,dz-tick]);
  line(annotations,[minX-margin*.25,minZ],[dx-tick*2,minZ]);line(annotations,[minX-margin*.25,z],[dx-tick*2,z]);
  line(annotations,[dx,minZ],[dx,z]);
  for(const pz of[minZ,maxZ])line(annotations,[dx-tick,pz-tick],[dx+tick,pz+tick]);
  return{wallAxes,structural:wallAxes.map(({start,end})=>({start,end})),door,annotations,
    labels:[{text:(maxX-minX).toFixed(2)+' m',position:[0,dz+margin*.5]},{text:(maxZ-minZ).toFixed(2)+' m',position:[dx-margin*.45,0]}],
    bounds:{width:width+margin*4.8,depth:depth+margin*4.8}};
}
/** Equal-distance subdivisions avoid whole long walls popping into view. */
export function subdivideSegments(segments: readonly PlanSegment[], step: number): PlanSegment[] {
  if (!Number.isFinite(step) || step <= 0) throw new RangeError('Subdivision step must be positive.');
  return segments.flatMap(segment => {
    const dx=segment.end[0]-segment.start[0], dz=segment.end[1]-segment.start[1];
    const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/step));
    return Array.from({length:count},(_,i)=>({ start:[segment.start[0]+dx*i/count,segment.start[1]+dz*i/count] as PlanPoint,
      end:[segment.start[0]+dx*(i+1)/count,segment.start[1]+dz*(i+1)/count] as PlanPoint }));
  });
}
