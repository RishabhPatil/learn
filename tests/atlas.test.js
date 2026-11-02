import test from 'node:test';
import assert from 'node:assert/strict';
import { methods } from '../public/positional-encoding/atlas-data.js';
import { buildContext, coordinates, phase, pairInfo, relativeBucket, defaults, circlePoint, PAIRS, DIM, encodingComponents, relativeEncoding } from '../public/positional-encoding/atlas-math.js';
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`);

test('every construction has finite coordinates and valid positional components in each sample',()=>{
  for(const scene of ['text','image','video','two-images'])for(const method of methods){
    const context=buildContext({prefix:'Find red',suffix:'What changed?',scene,grid:3});
    const p=coordinates(context,method.id);
    p.forEach(x=>assert.ok([...x.ids,...x.point,...encodingComponents(x,method.id)].every(Number.isFinite),`${method.id}: finite values`));
    if(method.kind==='rotary')for(const x of p.filter(x=>!x.excluded))for(let j=0;j<PAIRS;j++)assert.ok(Number.isFinite(phase(x,method.id,j)));
  }
});
test('MRoPE has a fixed image temporal ID and following text starts after all used axes',()=>{
  const c=buildContext({prefix:'a b c d e',suffix:'after',scene:'image',grid:4}),p=coordinates(c,'mrope');
  assert.deepEqual(p[5].ids,[5,5,5]);assert.deepEqual(p[20].ids,[5,8,8]);assert.deepEqual(p[21].ids,[9,9,9]);
  const v=coordinates(buildContext({prefix:'a b',suffix:'after',scene:'video',grid:3}),'mrope');
  assert.deepEqual(v[2].ids,[2,2,2]);assert.deepEqual(v[11].ids,[3,2,2]);assert.deepEqual(v[20].ids,[4,2,2]);
});
test('interleaving changes frequency allocation but not the baseline geometry; reset changes geometry',()=>{
  const c=buildContext({prefix:'a b c d',suffix:'after',scene:'image',grid:3});
  const a=coordinates(c,'mrope'),b=coordinates(c,'interleaved'),reset=coordinates(c,'mrope-i');
  assert.deepEqual(a.map(p=>p.ids),b.map(p=>p.ids));
  assert.deepEqual(reset[4].ids,[4,0,0]);assert.deepEqual(reset.at(-1).ids,[7,7,7]);
  assert.deepEqual(reset.at(-1).ids,a.at(-1).ids);
  assert.equal(pairInfo('mrope',1).axis,0);assert.equal(pairInfo('interleaved',1).axis,1);
  assert.notEqual(phase(a[5],'mrope',2),phase(b[5],'interleaved',2));
});
test('MHRoPE temporal head has identical phases across all patches in one image',()=>{
  const c=buildContext({prefix:'look',suffix:'red',scene:'image',grid:4}),p=coordinates(c,'mhrope');
  for(let j=0;j<PAIRS;j++){
    for(let i=2;i<=16;i++)close(phase(p[1],'mhrope',j,{head:0}),phase(p[i],'mhrope',j,{head:0}));
    assert.equal(pairInfo('mhrope',j,{head:2}).axis,2);
  }
});
test('Circle projection lies on a fixed-radius plane normal to the text diagonal',()=>{
  const points=[];
  for(let h=0;h<4;h++)for(let w=0;w<4;w++)points.push(circlePoint(h,w,4,4,7,3));
  const distance=Math.hypot(...points[0].map(x=>x-13));
  for(const p of points){close(p.reduce((a,b)=>a+b),21);close(Math.hypot(...p.map(x=>x-7)),3);close(Math.hypot(...p.map(x=>x-13)),distance);}
});
test('VRoPE retains four symmetric directions and advances each frame by H+W−1',()=>{
  const c=buildContext({prefix:'a b',suffix:'next',scene:'video',grid:3}),p=coordinates(c,'vrope');
  assert.deepEqual(p[2].ids,[2,4,6,4]);assert.deepEqual(p[10].ids,[6,4,2,4]);
  assert.deepEqual(p[11].ids,[7,9,11,9]);assert.deepEqual(p.at(-1).ids,[17,17,17,17]);
  for(let i=2;i<29;i++){const ids=p[i].ids;close(ids[0]+ids[2],ids[1]+ids[3]);assert.equal(ids.length,4);}
});
test('VideoRoPE uses official floor-centered layout and temporal-only text boundary',()=>{
  const c=buildContext({prefix:'a b c d e',suffix:'next',scene:'video',grid:4}),p=coordinates(c,'videorope',{stride:2});
  assert.deepEqual(p[5].ids,[5,4,4]);assert.deepEqual(p[20].ids,[5,7,7]);
  assert.deepEqual(p[21].ids,[7,6,6]);assert.deepEqual(p.at(-1).ids,[10,10,10]);
  assert.equal(pairInfo('videorope',PAIRS-1).axis,0);
});
test('PI and YaRN reduce to RoPE at scale one; YaRN leaves fast frequencies unchanged',()=>{
  const c=buildContext({scene:'image',grid:3});
  const rope=coordinates(c,'rope'),pi=coordinates(c,'pi',{scale:1}),yarn=coordinates(c,'yarn',{scale:1});
  for(let j=0;j<PAIRS;j++){close(phase(rope[5],'rope',j),phase(pi[5],'pi',j));close(phase(rope[5],'rope',j),phase(yarn[5],'yarn',j,{scale:1}));}
  close(pairInfo('yarn',0,{scale:8}).frequency,pairInfo('rope',0).frequency);
  close(pairInfo('yarn',PAIRS-1,{scale:8}).frequency,pairInfo('rope',PAIRS-1).frequency/8);
});
test('V2PE current-token increments preserve order and handle a visual first token',()=>{
  const tokens=[{id:0,type:'text'},{id:1,type:'image'},{id:2,type:'image'},{id:3,type:'text'}];
  assert.deepEqual(coordinates({tokens},'v2pe',{increment:.25}).map(p=>p.ids[0]),[0,.25,.5,1.5]);
  assert.equal(coordinates({tokens:[{id:0,type:'image'}]},'v2pe')[0].ids[0],0);
});
test('T5 buckets distinguish signed near offsets and saturate distant offsets',()=>{
  assert.equal(relativeBucket(0),0);assert.equal(relativeBucket(-1),1);assert.equal(relativeBucket(1),17);
  assert.equal(relativeBucket(-10000),15);assert.equal(relativeBucket(10000),31);
  assert.equal(relativeBucket(1,false),0);assert.equal(relativeBucket(-1,false),1);
});
test('explicit elapsed time affects only time-aligned multimodal positions',()=>{
  const c=buildContext({prefix:'see',suffix:'next',scene:'video',grid:3});
  const a=coordinates(c,'time-mrope',{timing:'uniform',stride:2}),b=coordinates(c,'time-mrope',{timing:'irregular',stride:2});
  assert.deepEqual(a[19].ids,[5,1,1]);assert.deepEqual(b[19].ids,[9,1,1]);
  assert.deepEqual(coordinates(c,'mrope',{timing:'uniform'}),coordinates(c,'mrope',{timing:'irregular'}));
});
test('additive components and relative terms follow their definitions',()=>{
  const c=buildContext({prefix:'a b c d e f g h i j k l',suffix:'',scene:'text'}),p=coordinates(c,'sinusoidal');
  const atZero=encodingComponents(p[0],'sinusoidal');
  assert.equal(atZero.length,DIM);
  atZero.forEach((v,d)=>close(v,d%2?1:0));
  for(let d=0;d<DIM;d+=2)close(encodingComponents(p[3],'sinusoidal')[d],Math.sin(3*10000**(-d/DIM)));
  assert.deepEqual(relativeEncoding(p[11],p[0],'shaw').values,relativeEncoding(p[10],p[0],'shaw').values);
  assert.notDeepEqual(encodingComponents(p[0],'learned',{seed:3}),encodingComponents(p[0],'learned',{seed:7}));
  close(relativeEncoding(p[11],p[1],'alibi',{slope:.2}).values[0],-2);
  assert.deepEqual(relativeEncoding(p[0],p[1],'alibi').values,[]);
  assert.equal(relativeEncoding(p[0],p[1],'t5').index,17);
  assert.equal(relativeEncoding(p[1],p[0],'t5').index,1);
  assert.deepEqual(encodingComponents(p[0],'none'),[]);
});
