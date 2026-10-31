import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { PlanSegment, WallAxis } from './floorPlan';

/** Orthogonal wall union. Shared cells are emitted once, internal faces never emitted.
 * Height layers keep L/T/cross intersections conforming even at stepped tops.
 * Y is a height multiplier, so extrusion scales the entire union reversibly. */
export function buildWallUnion(axes: readonly WallAxis[], thickness: number) {
  if (!(thickness > 0) || !Number.isFinite(thickness)) throw new RangeError('Invalid wall thickness');
  const boxes = axes.map(axis => {
    const [x,z] = axis.start, [ex,ez] = axis.end;
    if ((x !== ex && z !== ez) || (x === ex && z === ez) || ![x,z,ex,ez,axis.heightScale].every(Number.isFinite) || axis.heightScale <= 0) throw new RangeError('Walls require positive orthogonal axes');
    return { x0: Math.min(x,ex)-thickness/2, x1: Math.max(x,ex)+thickness/2,
      z0: Math.min(z,ez)-thickness/2, z1: Math.max(z,ez)+thickness/2, h: axis.heightScale };
  });
  const sorted = (values: number[]) => [...new Set(values.map(v=>Number(v.toFixed(9))))].sort((a,b)=>a-b);
  const xs=sorted(boxes.flatMap(b=>[b.x0,b.x1])), zs=sorted(boxes.flatMap(b=>[b.z0,b.z1])), ys=sorted([0,...boxes.map(b=>b.h)]);
  const nx=xs.length-1,nz=zs.length-1;
  const heights=Array.from({length:Math.max(0,nx)},(_,i)=>Array.from({length:Math.max(0,nz)},(_,j)=>{
    const x=(xs[i]!+xs[i+1]!)/2,z=(zs[j]!+zs[j+1]!)/2;
    return Math.max(0,...boxes.filter(b=>x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1).map(b=>b.h));
  }));
  const occupied=(i:number,j:number,k:number)=>k>=0&&k<ys.length-1&&(heights[i]?.[j]??0)>ys[k]!+1e-8;
  const positions:number[]=[], footprint:PlanSegment[]=[];
  type V=[number,number,number];
  const quad=(v:V[],normal:V)=>{
    const a=v[0]!,b=v[1]!,c=v[2]!;
    const u=b.map((n,i)=>n-a[i]!),w=c.map((n,i)=>n-a[i]!);
    const dot=(u[1]!*w[2]!-u[2]!*w[1]!)*normal[0]+(u[2]!*w[0]!-u[0]!*w[2]!)*normal[1]+(u[0]!*w[1]!-u[1]!*w[0]!)*normal[2];
    const order=dot>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
    for(const index of order)positions.push(...v[index]!);
  };
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)for(let k=0;k<ys.length-1;k++){
    if(!occupied(i,j,k))continue;
    const x=xs[i]!,X=xs[i+1]!,z=zs[j]!,Z=zs[j+1]!,y=ys[k]!,Y=ys[k+1]!;
    for(const side of [-1,1]){
      if(!occupied(i+side,j,k)){
        const px=side<0?x:X;quad([[px,y,z],[px,Y,z],[px,Y,Z],[px,y,Z]],[side,0,0]);
        if(k===0)footprint.push({start:[px,z],end:[px,Z]});
      }
      if(!occupied(i,j+side,k)){
        const pz=side<0?z:Z;quad([[x,y,pz],[X,y,pz],[X,Y,pz],[x,Y,pz]],[0,0,side]);
        if(k===0)footprint.push({start:[x,pz],end:[X,pz]});
      }
      if(!occupied(i,j,k+side)){
        const py=side<0?y:Y;quad([[x,py,z],[X,py,z],[X,py,Z],[x,py,Z]],[0,side,0]);
      }
    }
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  return {geometry,footprint};
}
