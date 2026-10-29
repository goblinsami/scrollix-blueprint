export type PlanPoint = [number, number];
export interface PlanSegment { start: PlanPoint; end: PlanPoint }
export interface FloorPlan {
  structural: PlanSegment[];
  annotations: PlanSegment[];
  door: PlanSegment[];
  labels: Array<{ text: string; position: PlanPoint }>;
  bounds: { width: number; depth: number };
}
export function buildFloorPlan(width: number, depth: number): FloorPlan {
  if (![width, depth].every(value => Number.isFinite(value) && value > 0)) throw new RangeError('Plan dimensions must be finite and positive.');
  const x = width / 2, z = depth / 2;
  const gap = Math.min(1.8, width * 0.25);
  const margin = Math.max(0.7, Math.min(width, depth) * 0.12);
  const structural: PlanSegment[] = [];
  const annotations: PlanSegment[] = [];
  const door: PlanSegment[] = [];
  const line = (pool: PlanSegment[], a: PlanPoint, b: PlanPoint) => pool.push({start:a,end:b});
  // A pavilion perimeter with a genuine entry gap. These are also the wall axes in M3.
  line(structural, [-x,-z],[x,-z]);
  line(structural, [x,-z],[x,z]);
  line(structural, [x,z],[gap/2,z]);
  line(structural, [-gap/2,z],[-x,z]);
  line(structural, [-x,z],[-x,-z]);
  // An L partition makes the conceptual plan legible without imitating a CAD import.
  line(structural, [-x, -z * 0.2], [x * 0.22, -z * 0.2]);
  line(structural, [x * 0.22, -z * 0.2], [x * 0.22, z * 0.45]);
  const hinge: PlanPoint = [-gap/2,z];
  line(door, hinge, [-gap/2,z-gap]);
  for (let i=0;i<32;i++) {
    const a = (i/32)*Math.PI/2, b = ((i+1)/32)*Math.PI/2;
    line(door, [hinge[0]+Math.cos(a)*gap,hinge[1]-Math.sin(a)*gap], [hinge[0]+Math.cos(b)*gap,hinge[1]-Math.sin(b)*gap]);
  }
  const dz = z + margin, dx = -x - margin, tick = margin * 0.16;
  line(annotations, [-x,z+margin*0.25], [-x,dz+tick*2]);
  line(annotations, [x,z+margin*0.25], [x,dz+tick*2]);
  line(annotations, [-x,dz],[x,dz]);
  for (const px of [-x,x]) line(annotations,[px-tick,dz+tick],[px+tick,dz-tick]);
  line(annotations, [-x-margin*0.25,-z], [dx-tick*2,-z]);
  line(annotations, [-x-margin*0.25,z], [dx-tick*2,z]);
  line(annotations, [dx,-z],[dx,z]);
  for (const pz of [-z,z]) line(annotations,[dx-tick,pz-tick],[dx+tick,pz+tick]);
  const format = (value:number) => value.toFixed(2) + ' m';
  return { structural, annotations, door,
    labels:[{text:format(width),position:[0,dz+margin*0.5]}, {text:format(depth),position:[dx-margin*0.45,0]}],
    bounds:{width:width+margin*4.8,depth:depth+margin*4.8},
  };
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
