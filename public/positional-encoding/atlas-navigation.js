import { pairInfo, defaults } from './atlas-math.js';

export function neighborToken(records,id,move) {
  const current=records.find(r=>r.token.id===id&&!r.excluded);
  if(!current)return null;
  if(move==='previous'||move==='next'){
    const eligible=records.filter(r=>!r.excluded),index=eligible.indexOf(current);
    return eligible[index+(move==='next'?1:-1)]?.token.id??null;
  }
  const t=current.token;
  if(t.type==='text')return null;
  const shifts={left:[0,0,-1],right:[0,0,1],up:[0,-1,0],down:[0,1,0],earlier:[-1,0,0],later:[1,0,0]};
  const shift=shifts[move];if(!shift)return null;
  return records.find(r=>!r.excluded&&r.token.type!=='text'&&r.token.group===t.group&&r.token.f===t.f+shift[0]&&r.token.h===t.h+shift[1]&&r.token.w===t.w+shift[2])?.token.id??null;
}

// Gradient of the phase argument in the displayed position-coordinate basis.
// It is a coordinate direction, not a learned vector or a rotary channel plane.
export function phaseDirection(method,pair,options={}) {
  const o={...defaults,...options},info=pairInfo(method,pair,o);
  if(method==='mixed'){
    const angle=(o.angle+(pair%2)*90)*Math.PI/180;
    return {vector:[0,Math.sin(angle),Math.cos(angle)],label:`mixed direction ${info.name}`};
  }
  if(method==='vrope'){
    const signs=[[1,1],[ -1,1],[-1,-1],[1,-1]][info.axis];
    return {vector:[1,...signs],label:`frame progression + ${info.name}`};
  }
  const axis=method==='axial'?info.axis+1:info.axis;
  return {vector:[0,1,2].map(i=>i===axis?1:0),label:info.name};
}

export function cameraProjection(point,center,yaw,pitch) {
  const [z,y,x]=point.map((v,i)=>v-center[i]);
  const depth=-x*Math.sin(yaw)+z*Math.cos(yaw);
  return {x:x*Math.cos(yaw)+z*Math.sin(yaw),y:-y*Math.cos(pitch)-depth*Math.sin(pitch),z:-y*Math.sin(pitch)+depth*Math.cos(pitch)};
}
export function fitCamera(points,width,height,yaw,pitch) {
  const min=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
  const center=min.map((v,i)=>(v+max[i])/2),projected=points.map(p=>cameraProjection(p,center,yaw,pitch));
  const xs=projected.map(p=>p.x),ys=projected.map(p=>p.y);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  return {center,offset:[(x0+x1)/2,(y0+y1)/2],unit:Math.max(1,Math.min(Math.max(40,width-100)/Math.max(2,x1-x0),Math.max(40,height-72)/Math.max(2,y1-y0)))};
}
