import test from 'node:test';
import assert from 'node:assert/strict';
import { neighborToken,phaseDirection,fitCamera,cameraProjection } from '../public/positional-encoding/atlas-navigation.js';
import { buildContext,coordinates,phase,pairInfo,defaults } from '../public/positional-encoding/atlas-math.js';
import { methods } from '../public/positional-encoding/atlas-data.js';

test('neighbors stop at spatial and temporal boundaries and never cross visual groups',()=>{
  const video=coordinates(buildContext({scene:'video',grid:4}),'mrope');
  assert.equal(neighborToken(video,4,'left'),null);
  assert.equal(neighborToken(video,7,'right'),null);
  assert.equal(neighborToken(video,4,'up'),null);
  assert.equal(neighborToken(video,4,'down'),8);
  assert.equal(neighborToken(video,4,'later'),20);
  assert.equal(neighborToken(video,36,'later'),null);
  assert.equal(neighborToken(video,0,'down'),null);
  const images=coordinates(buildContext({scene:'two-images',grid:4}),'mrope');
  assert.equal(neighborToken(images,4,'later'),null);
  const axial=coordinates(buildContext({scene:'image',grid:4}),'axial');
  assert.equal(neighborToken(axial,4,'previous'),null);
  assert.equal(neighborToken(axial,19,'next'),null);
});

test('highlighted coordinate directions reproduce phase differences, including mixed and four-stream VRoPE',()=>{
  for(const method of methods.filter(m=>m.kind==='rotary')){
    const records=coordinates(buildContext({scene:'video',grid:4}),method.id,defaults).filter(r=>!r.excluded);
    const pairs=[[records[0],records.at(-1)],[records[5],records[9]]];
    for(let j=0;j<24;j++)for(const [a,b] of pairs){
      const v=phaseDirection(method.id,j,defaults).vector;
      const expected=v.reduce((sum,x,i)=>sum+x*(b.point[i]-a.point[i]),0)*pairInfo(method.id,j,defaults).frequency;
      assert.ok(Math.abs(expected-(phase(b,method.id,j,defaults)-phase(a,method.id,j,defaults)))<1e-9,`${method.id} pair ${j}`);
    }
  }
});

test('camera fit keeps line, plane, and volume fixtures inside the viewport including singular views',()=>{
  const fixtures=[[[0,0,0]],[[0,0,0],[100,0,0]],[[0,0,0],[0,3,4],[0,0,4],[0,3,0]],[[0,0,0],[20,3,4],[5,-3,8]]];
  for(const points of fixtures)for(const [width,height] of [[320,200],[900,260]])for(const yaw of [0,.65,Math.PI/2]){
    const fit=fitCamera(points,width,height,yaw,.45);
    assert.ok(Number.isFinite(fit.unit)&&fit.unit>0);
    for(const point of points){
      const q=cameraProjection(point,fit.center,yaw,.45);
      const x=width/2+(q.x-fit.offset[0])*fit.unit,y=height/2-(q.y-fit.offset[1])*fit.unit;
      assert.ok(x>=49.99&&x<=width-49.99);
      assert.ok(y>=35.99&&y<=height-35.99);
    }
  }
});
