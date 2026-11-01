import test from 'node:test';
import assert from 'node:assert/strict';
import { methods } from '../public/atlas-data.js';
import { buildContext, coordinates, distribution, phase, pairInfo, relativeBucket, defaults, circlePoint, PAIRS, logit } from '../public/atlas-math.js';
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`);

test('every catalog entry produces finite normalized weights over its eligible keys',()=>{
  for(const scene of ['text','image','video','two-images'])for(const method of methods)for(const content of ['position','toy']){
    const context=buildContext({prefix:'Find red',suffix:'What changed?',scene,grid:3});
    const p=coordinates(context,method.id);const query=p.findLastIndex(x=>!x.excluded);
    if(query<0){assert.deepEqual(distribution(p,0,method.id),p.map(()=>0));continue;}
    for(const causal of [true,false]){
      const weights=distribution(p,query,method.id,{causal,content});
      assert.equal(weights.length,context.tokens.length);
      close(weights.reduce((a,b)=>a+b),1);
      weights.forEach((value,i)=>{assert.ok(Number.isFinite(value)&&value>=0);if(p[i].excluded||(causal&&i>query))close(value,0);});
      p.forEach(x=>assert.ok([...x.ids,...x.point].every(Number.isFinite),`${method.id}: coordinates finite`));
    }
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
test('MHRoPE temporal head gives equal positional scores to every patch in one image',()=>{
  const c=buildContext({prefix:'look',suffix:'red',scene:'image',grid:4}),p=coordinates(c,'mhrope');
  const query=p.length-1,weights=distribution(p,query,'mhrope',{head:0});
  for(let i=2;i<=16;i++)close(weights[1],weights[i]);
  for(let j=0;j<PAIRS;j++)assert.equal(pairInfo('mhrope',j,{head:2}).axis,2);
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
  close(logit(rope[5],rope[3],'rope'),logit(yarn[5],yarn[3],'yarn',{scale:1}));
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
test('adding padding to identical Q/K does not turn position-only scores into semantic inference',()=>{
  const c=buildContext({prefix:'red blue green',suffix:'object',scene:'text'}),p=coordinates(c,'none');
  distribution(p,p.length-1,'none').forEach(x=>close(x,1/p.length));
  assert.equal(methods.length,new Set(methods.map(m=>m.id)).size);
  assert.ok(methods.every(m=>m.source.startsWith('https://')&&m.limits));
});
