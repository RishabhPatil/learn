import test from 'node:test';
import assert from 'node:assert/strict';
import { methods } from '../public/positional-encoding/atlas-data.js';
import { sampleText, lessonPreset } from '../public/positional-encoding/atlas-walkthrough.js';
import { experimentPreset, insight } from '../public/positional-encoding/atlas-insights.js';
import { buildContext, coordinates, relativeEncoding, phase, pairInfo, PAIRS } from '../public/positional-encoding/atlas-math.js';
function example(id,p){const positions=coordinates(buildContext({scene:p.scene,grid:4,...sampleText(id)}),id,p.options);return {p,positions,a:positions[p.query],b:positions[p.key]};}
test('Shaw and T5 guided examples reach and demonstrate their many-to-one mappings',()=>{
  for(const id of ['shaw','t5']){
    const a=example(id,lessonPreset(id,2)),b=example(id,lessonPreset(id,3));
    const ra=relativeEncoding(a.a,a.b,id,a.p.options),rb=relativeEncoding(b.a,b.b,id,b.p.options);
    assert.equal(ra.offset,9);assert.equal(rb.offset,id==='shaw'?12:11);
    assert.equal(ra.index,id==='shaw'?8:24);assert.equal(rb.index,ra.index);
    assert.deepEqual(rb.values,ra.values,'different offsets share the exact same illustrative table entry');
  }
});
test('every focused experiment has valid selections, values, and a live takeaway',()=>{
  for(const m of methods)for(const alternate of [false,true]){
    const e=example(m.id,experimentPreset(m.id,alternate));
    assert.ok(e.a&&!e.a.excluded&&e.b&&!e.b.excluded,m.id);
    const text=insight(m.id,e.a,e.b,e.p.options,e.p.pair);
    assert.ok(text.length>15&&!/NaN|undefined|Infinity/.test(text),m.id);
    if(m.kind==='rotary')for(let j=0;j<PAIRS;j++)assert.ok(Number.isFinite(phase(e.a,m.id,j,e.p.options))&&Number.isFinite(phase(e.b,m.id,j,e.p.options)));
  }
});
test('RoPE shared shift preserves every relative phase; Circle patch switch preserves text distance',()=>{
  const a=example('rope',experimentPreset('rope',false)),b=example('rope',experimentPreset('rope',true));
  for(let j=0;j<PAIRS;j++)assert.ok(Math.abs((phase(a.b,'rope',j)-phase(a.a,'rope',j))-(phase(b.b,'rope',j)-phase(b.a,'rope',j)))<1e-12);
  const ca=example('circle',experimentPreset('circle',false)),cb=example('circle',experimentPreset('circle',true));
  const distance=e=>Math.hypot(...e.a.ids.map((v,i)=>v-e.b.ids[i]));
  assert.ok(Math.abs(distance(ca)-distance(cb))<1e-12);
});
test('mixed and circle labels describe projected directions and coordinates',()=>{
  assert.equal(pairInfo('mixed',0,{angle:30}).name,'30°');assert.equal(pairInfo('mixed',1,{angle:30}).name,'120°');
  assert.deepEqual([0,8,16].map(j=>pairInfo('circle',j).name),['c₁','c₂','c₃']);
});
