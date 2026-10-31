import { describe, expect, it } from 'vitest';
import { EdgesGeometry, Vector3 } from 'three';
import { buildWallUnion } from '../src/scene/wallUnion';
import type { WallAxis } from '../src/scene/floorPlan';
const wall=(id:string,start:[number,number],end:[number,number],heightScale=1):WallAxis=>({id,start,end,heightScale});

describe('orthogonal wall surface union',()=>{
  it.each([
    ['L',[wall('a',[0,0],[2,0]),wall('b',[2,0],[2,2])],5],
    ['T',[wall('a',[-2,0],[2,0]),wall('b',[0,0],[0,2])],7],
    ['cross',[wall('a',[-2,0],[2,0]),wall('b',[0,-2],[0,2])],9],
    ['stepped T',[wall('a',[-2,0],[2,0],2),wall('b',[0,0],[0,2])],12],
  ] as const)('%s emits a closed surface with union volume, no duplicate/internal faces',(name,axes,volume)=>{
    const {geometry}=buildWallUnion(axes,1),a=geometry.getAttribute('position');
    let signedVolume=0;const edges=new Map<string,number>();const triangles=new Set<string>();
    const key=(v:Vector3)=>v.toArray().map(n=>n.toFixed(6)).join(',');
    for(let i=0;i<a.count;i+=3){
      const vs=[0,1,2].map(k=>new Vector3().fromBufferAttribute(a,i+k));
      signedVolume+=vs[0]!.dot(vs[1]!.clone().cross(vs[2]!))/6;
      const tri=vs.map(key).sort().join('|');expect(triangles.has(tri)).toBe(false);triangles.add(tri);
      for(let j=0;j<3;j++){const e=[key(vs[j]!),key(vs[(j+1)%3]!)].sort().join('|');edges.set(e,(edges.get(e)??0)+1);}
    }
    expect(signedVolume).toBeCloseTo(volume,5);
    expect([...edges.values()].every(n=>n===2)).toBe(true);
    const outline=new EdgesGeometry(geometry);const p=outline.getAttribute('position');
    // Equal-height joins must not leave a vertical edge at the shared center axis.
    if(name!=='stepped T')for(let i=0;i<p.count;i+=2){
      const v=new Vector3().fromBufferAttribute(p,i),w=new Vector3().fromBufferAttribute(p,i+1);
      if(v.x===w.x&&v.z===w.z&&v.y!==w.y)expect(Math.abs(v.z)).toBeGreaterThan(0);
    }
    outline.dispose();geometry.dispose();
  });
  it('rejects unsupported diagonals instead of silently moving shared axes',()=>{
    expect(()=>buildWallUnion([wall('d',[0,0],[1,1])],.1)).toThrow();
  });
});

