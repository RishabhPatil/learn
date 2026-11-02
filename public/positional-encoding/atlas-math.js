export const PAIRS = 24;
export const DIM = PAIRS * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const defaults = { base:10000, scale:4, stride:2, radius:3, angle:30, head:0, seed:3, slope:.12, increment:.25, timing:'uniform' };
const visualOnly = new Set(['axial','mixed']);
const lineMethods = new Set(['none','sinusoidal','learned','shaw','t5','alibi','rope','pi','yarn','v2pe']);
export function buildContext({prefix='Find the red object',suffix='Where is it now?',scene='image',grid=4}) {
  const tokens=[], groups=[];
  function text(str) {
    for (const word of str.trim().split(/\s+/).filter(Boolean).slice(0,24)) tokens.push({id:tokens.length,type:'text',label:word,group:-1});
  }
  function visual(frames) {
    const group=groups.length; const start=tokens.length;
    for(let f=0;f<frames;f++) for(let h=0;h<grid;h++) for(let w=0;w<grid;w++) {
      tokens.push({id:tokens.length,type:frames>1?'video':'image',label:`${frames>1?'F'+f:'I'+group}[${h},${w}]`,f,h,w,H:grid,W:grid,F:frames,group});
    }
    groups.push({id:group,start,end:tokens.length,frames,H:grid,W:grid});
  }
  text(prefix);
  if(scene==='image') visual(1);
  if(scene==='video') visual(3);
  if(scene==='two-images') { visual(1); text('and then'); visual(1); }
  text(suffix);
  if(!tokens.length) text('A token');
  return {tokens,groups};
}
export function circlePoint(h,w,H,W,center,radius) {
  const angles=[];
  for(let r=0;r<H;r++) for(let c=0;c<W;c++) angles.push(Math.atan2(r-(H-1)/2,c-(W-1)/2));
  const lo=Math.min(...angles), hi=Math.max(...angles);
  const raw=angles[h*W+w];
  const spatial=hi===lo?0:2*Math.PI*(raw-lo)/(hi-lo);
  const grid=2*Math.PI*(h*W+w)/(H*W);
  const angle=.5*spatial+.5*grid;
  const u=[-1/Math.sqrt(2),1/Math.sqrt(2),0];
  const v=[-1/Math.sqrt(6),-1/Math.sqrt(6),2/Math.sqrt(6)];
  return u.map((value,i)=>center+radius*(Math.cos(angle)*value+Math.sin(angle)*v[i]));
}
export function coordinates(context,method,options={}) {
  const o={...defaults,...options}; let cursor=0, lastGroup=-1, start=0;
  let fractional=0;
  return context.tokens.map(token=>{
    const p=token.id;
    if(lineMethods.has(method)) {
      if(p>0) fractional += token.type==='text'?1:o.increment;
      const scalar=method==='pi'?p/o.scale:method==='v2pe'?fractional:p;
      return {ids:[scalar],point:[scalar,0,0],token};
    }
    if(visualOnly.has(method)) {
      return {ids:token.type==='text'?[0,0]:[token.h,token.w],point:token.type==='text'?[p,0,0]:[0,token.h,token.w],token,excluded:token.type==='text'};
    }
    if(token.type==='text') {
      const s=cursor++;
      return {ids:Array(method==='vrope'?4:3).fill(s),point:method==='vrope'?[s,0,0]:[s,s,s],token};
    }
    if(token.group!==lastGroup) { start=cursor; lastGroup=token.group; }
    const {f,h,w,H,W,F}=token;
    let ids,point;
    if(method==='vrope') {
      const s=start+f*(H+W-1);
      ids=[s+w+h,s+w-h+H-1,s-w-h+H+W-2,s-w+h+W-1];
      point=[s+(H+W-2)/2,h-(H-1)/2,w-(W-1)/2];
      cursor=start+F*(H+W-1);
    } else if(method==='circle') {
      ids=circlePoint(h,w,H,W,start+f*o.stride,o.radius); point=ids;
      cursor=start+(F-1)*o.stride+1;
    } else if(method==='videorope') {
      // The segment starts at a frame center on the text diagonal.
      const t=start+f*o.stride;
      ids=[t,t+h-Math.floor((H-1)/2),t+w-Math.floor((W-1)/2)]; point=ids;
      cursor=start+(F-1)*o.stride+1;
    } else {
      const reset=method==='mrope-i'||method==='mhrope';
      const timestamp=o.timing==='irregular'?[0,1,4][f]:f;
      const temporal=method==='time-mrope'?timestamp*o.stride:f;
      ids=[start+temporal,(reset?0:start)+h,(reset?0:start)+w]; point=ids;
      // Spatial reset changes visual h/w, not the reserved segment span.
      // Keep the text boundary consistent with the unreset visual extents.
      cursor=reset ? start+Math.max(F,H,W) : Math.max(cursor,...ids.map(value=>value+1));
    }
    return {ids,point,token};
  });
}
export function yarnFrequency(j,o) {
  const theta=o.base**(-j/PAIRS), length=128;
  const correction=rotations=>DIM*Math.log(length/(rotations*2*Math.PI))/(2*Math.log(o.base));
  const low=clamp(Math.floor(correction(32)),0,PAIRS-1);
  const high=clamp(Math.ceil(correction(1)),0,DIM-1);
  const ramp=clamp((j-low)/Math.max(.001,high-low),0,1);
  return theta*(1-ramp+ramp/o.scale);
}
export function pairInfo(method,j,options={}) {
  const o={...defaults,...options}; let axis=0, name='p', frequency=o.base**(-j/PAIRS);
  if(['mrope','time-mrope','circle'].includes(method)) {axis=Math.floor(j/(PAIRS/3));name=['t','h','w'][axis];}
  if(['interleaved','mrope-i'].includes(method)) {axis=j%3;name=['t','h','w'][axis];}
  if(method==='mhrope') {axis=o.head;name=['t','h','w'][axis];}
  if(method==='videorope') {axis=j>=PAIRS*2/3?0:(j%2?2:1);name=['t','h','w'][axis];}
  if(method==='vrope') {axis=j%4;name=['w+h','w−h','−w−h','−w+h'][axis];}
  if(method==='axial'||method==='mixed') {
    axis=j%2?0:1;name=method==='mixed'?'h+w':['h','w'][axis];
    frequency=o.base**(-Math.floor(j/2)/(PAIRS/2));
  }
  if(method==='circle') name=['c₁','c₂','c₃'][axis];
  if(method==='mixed') name=`${o.angle+(j%2)*90}°`;
  if(method==='yarn') frequency=yarnFrequency(j,o);
  return {axis,name,frequency};
}
export function phase(position,method,j,options={}) {
  const o={...defaults,...options}, info=pairInfo(method,j,o);
  if(method==='mixed') {
    const a=o.angle*Math.PI/180+(j%2)*Math.PI/2;
    return info.frequency*(Math.cos(a)*position.ids[1]+Math.sin(a)*position.ids[0]);
  }
  return (position.ids[info.axis]||0)*info.frequency;
}
export function relativeBucket(relative,bidirectional=true,buckets=32,maxDistance=128) {
  let bucket=0, n=-relative;
  if(bidirectional) {buckets/=2;if(n<0)bucket+=buckets;n=Math.abs(n);} else n=Math.max(n,0);
  const exact=buckets/2;
  return bucket+(n<exact?n:Math.min(buckets-1,exact+Math.floor(Math.log(n/exact)/Math.log(maxDistance/exact)*(buckets-exact))));
}
// Reproducible example values; these are not trained model parameters.
function weight(index,dimension,seed) { return Math.sin((index+17)*127.1+(dimension+3)*311.7+seed*79.3); }
export function encodingComponents(position,method,options={}) {
  const o={...defaults,...options};
  if(method==='sinusoidal') return Array.from({length:DIM},(_,d)=>{
    const angle=position.ids[0]*o.base**(-Math.floor(d/2)/PAIRS);
    return d%2?Math.cos(angle):Math.sin(angle);
  });
  if(method==='learned') return Array.from({length:DIM},(_,d)=>weight(position.token.id,d,o.seed));
  return [];
}
export function relativeEncoding(a,b,method,options={}) {
  const o={...defaults,...options},offset=b.token.id-a.token.id;
  if(method==='shaw') {
    const index=clamp(offset,-8,8);
    return {offset,index,values:Array.from({length:DIM},(_,d)=>weight(index,d,o.seed))};
  }
  if(method==='t5') {
    const index=relativeBucket(offset,true);
    return {offset,index,values:[weight(index,0,o.seed)]};
  }
  // Original causal ALiBi is defined here only for B at or before A.
  if(method==='alibi')return {offset,index:offset,values:offset<=0?[o.slope*offset]:[]};
  return {offset,index:offset,values:[]};
}
export function axesFor(method) {
  if(lineMethods.has(method)) return ['position p','display only','display only'];
  if(method==='vrope') return ['frame center','centered height','centered width'];
  if(visualOnly.has(method)) return ['no time axis','height h','width w'];
  if(method==='circle') return ['coordinate 1','coordinate 2','coordinate 3'];
  return ['time / sequence t','height h','width w'];
}
export function eligibleQueries(positions) {return positions.filter(p=>!p.excluded).map(p=>p.token.id);}
