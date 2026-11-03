import { tours } from './atlas-tours.js';
import { stories, corePath, featuredResearch, guidedPath, researchPath, alternativePath, chapterAfter } from './atlas-story.js?v=20261102-featured';
import { experiments, experimentPreset, insight, number, readingGuide } from './atlas-insights.js';
import { lessonPreset, stepNames, sampleText } from './atlas-walkthrough.js?v=20261102-story';
import { methods, furtherReading } from './atlas-data.js';
import { referenceWriteups as references } from './atlas-reference.js?v=20261102-story';
import { buildContext, coordinates, phase, pairInfo, eligibleQueries, axesFor, defaults, PAIRS, DIM, encodingComponents, relativeEncoding, relativeBucket } from './atlas-math.js';
import { PositionScene } from './atlas-scene.js';
import { analyticsId } from '../config.js';
import { createAnalytics } from '../analytics.js';

const $=id=>document.getElementById(id);
const analytics=createAnalytics({window,document,id:analyticsId});
const state={step:0,method:'sinusoidal',scene:'image',grid:4,prefix:'Find the red object',suffix:'Where is it now?',query:0,key:0,pair:0,view:'encoded',color:'texture',options:{...defaults}};
let context,positions,textures=[],statusTimer,experimentAlternate=false,experimentReady=false,showAllMethods=false;
const safeScene=new Set(['image','video','two-images','text']);
function notify(message){$('status').textContent=message;clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('status').textContent='',6500);}
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function option(value,text){const o=element('option',text);o.value=value;return o;}
function method(){return methods.find(m=>m.id===state.method);}
function fmt(n){return Number.isInteger(n)?String(n):n.toFixed(3);}
function tuple(p){return '('+p.ids.map(fmt).join(', ')+')';}

function readLink(){
  const params=new URLSearchParams(location.hash.slice(1));
  if(methods.some(m=>m.id===params.get('method')))state.method=params.get('method');
  if(params.has('step'))state.step=Math.max(0,Math.min(4,Math.floor(Number(params.get('step')))||0));
  if(safeScene.has(params.get('scene')))state.scene=params.get('scene');
  for(const [name,min,max]of[['base',100,1000000],['scale',1,16],['stride',1,8],['radius',1,8],['angle',0,180],['head',0,2],['seed',1,99],['slope',0,.5],['increment',.0625,1]]){
    if(params.has(name)){const value=Number(params.get(name));if(Number.isFinite(value))state.options[name]=Math.max(min,Math.min(max,value));}
  }
  state.options.head=Math.round(state.options.head);
  if(params.get('timing')==='irregular')state.options.timing='irregular';
  if(['texture','modality'].includes(params.get('color')))state.color=params.get('color');
  for(const name of['query','key','pair'])if(params.has(name))state[name]=Math.max(0,Math.floor(Number(params.get(name))||0));
}
readLink();
const initialParams=new URLSearchParams(location.hash.slice(1));
if(!initialParams.has('scene'))Object.assign(state,lessonPreset(state.method,state.step));
else if(!initialParams.has('step'))state.step=4;
else state.view=state.step===0?'source':'encoded';
if(method().family==='Vision'&&state.scene==='text')state.scene='image';
const hasLinkedQuery=new URLSearchParams(location.hash.slice(1)).has('query');
const scene=new PositionScene($('space'),{onSelect(id,isQuery){if(isQuery){if(positions[id].excluded){notify('Select a visual token for this vision-only method.');return;}state.query=id;}else state.key=id;customize();render();showVisualPanel('encoding-view');}});

function sampleImage(frame,group){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=48;const c=canvas.getContext('2d');
  c.fillStyle='#b9d6c7';c.fillRect(0,0,48,48);
  c.fillStyle='#6e9478';c.fillRect(0,33,48,15);
  c.fillStyle='#dce8c5';c.fillRect(0,31,48,2);
  c.fillStyle='#417db0';c.fillRect(31-group*12,19,10,12);
  c.fillStyle='#c15b42';c.beginPath();c.arc(11+frame*9+group*5,25-frame*2,6,0,Math.PI*2);c.fill();
  c.fillStyle='#edc990';c.fillRect(35,5,6,6);
  return canvas;
}
function prepareTextures(){
  const groups=state.scene==='two-images'?2:state.scene==='text'?0:1;
  textures=Array.from({length:groups},(_,g)=>Array.from({length:state.scene==='video'?3:1},(_,f)=>sampleImage(f,g)));
}
function rebuild(resetQuery=false){
  prepareTextures();context=buildContext({...sampleText(state.method),scene:state.scene,grid:state.grid});
  if(resetQuery){state.query=context.tokens.length-1;state.key=context.groups[0]?.start??0;}
  $('example').querySelector('option[value=text]').disabled=method().family==='Vision';
  $('example').value=state.scene;
  $('example-description').textContent=`${context.tokens.length} illustrative tokens${state.scene==='text'?'':' · 4 × 4 patches per frame'} · fixed sample, no model tokenization`;
  render();
}
function selectMethod(id){
  state.method=id;state.step=0;
  if(!guidedPath.includes(id))showAllMethods=true;
  populateMethods();goToStep(0);analytics.track('method_select',id);
}
function goToStep(index,focus=true){
  experimentAlternate=false;
  const next=Math.max(0,Math.min(4,index));
  if(next<4)Object.assign(state,lessonPreset(state.method,next));
  else{Object.assign(state,experimentPreset(state.method,false));experimentReady=true;}
  setControls();scene.reset();rebuild(false);
  document.querySelector('.lesson-scroll').scrollTop=0;
  document.querySelector('.visual-scroll').scrollTop=0;
  showVisualPanel(state.step>=2?'encoding-view':'geometry-view');
  if(focus)$('tour-title').focus({preventScroll:true});

}
function renderTour(){
  const step=tours[state.method][state.step],story=stories[state.method],chapter=corePath.indexOf(state.method),research=featuredResearch.indexOf(state.method),next=chapterAfter(state.method);
  $('chapter-progress').textContent=chapter>=0?`Core tutorial · Chapter ${chapter+1} of ${corePath.length}`:research>=0?`Research directions · ${research+1} of ${featuredResearch.length}`:'Optional branch';
  $('lab-top').dataset.step=state.step;
  $('tour-short-progress').textContent=`${state.step+1} / 5`;
  $('tour-title').textContent=state.step===0?story.question:step.title;
  $('tour-body').textContent=state.step===0?story.problem:step.body;
  $('research-context').hidden=research<0||state.step!==0;
  $('tour-idea').hidden=state.step!==0;$('tour-idea').textContent=story.idea;
  $('tour-tradeoff').hidden=state.step!==4;$('tour-tradeoff').textContent=story.tradeoff;
  $('chapter-next').hidden=state.step!==4;
  $('chapter-next').textContent=next?`Next question: ${stories[next].question}`:research>=0?'Guided path complete. More approaches are available in Other methods.':'Choose a core chapter or research direction above to return to the guided path.';
  $('tour-focus').textContent=stepNames[state.step].toUpperCase();
  $('tour-prev').disabled=state.step===0;$('tour-next').disabled=false;
  $('tour-next').textContent=state.step===4?(next?(featuredResearch.includes(next)?'Next research →':'Next chapter →'):guidedPath.includes(state.method)?'Start again ↺':'Restart ↺'):'Next →';
  $('tour-next').setAttribute('aria-label',state.step===4&&next?`Next chapter: ${methods.find(m=>m.id===next).name}`:$('tour-next').textContent);
  const a=positions[state.query],b=positions[state.key];
  let observation;
  if(state.step===0)observation=`${context.tokens.length} tokens in the fixed sample. ${state.scene==='text'?'The dots follow sequence order.':'Each image tile is one patch token containing 12 × 12 pixels. The original grid is shown before assigning position IDs.'}`;
  else if(state.step===1)observation=`Token A: ${a.token.label} → ${tuple(a)}. Token B: ${b.token.label} → ${tuple(b)}.`;
  else observation=insight(state.method,a,b,state.options,state.pair);
  $('tour-observation').textContent=observation;
  $('try-experiment').hidden=state.step!==4;
  $('try-experiment').textContent=experimentReady?experiments[state.method][experimentAlternate?1:0]:'Start the focused experiment';
  updateReadingHelp();

}
function setControls(){
  $('frequency-base').value=state.options.base;$('timing').value=state.options.timing;$('color-mode').value=state.color;
  for(const name of['scale','stride','radius','angle','head','seed','slope','increment'])$(name).value=state.options[name];
  // Unknown finite linked values are safely represented instead of leaving a blank select.
  for(const id of['frequency-base','seed','increment'])if($(id).value===''){const key=id==='frequency-base'?'base':id;$(id).append(option(state.options[key],fmt(state.options[key])));$(id).value=state.options[key];}
}
function controlsForMethod(){
  const flags={scale:['pi','yarn'],stride:['circle','videorope','time-mrope'],radius:['circle'],angle:['mixed'],head:['mhrope'],seed:['learned','shaw','t5'],slope:['alibi'],increment:['v2pe']};
  Object.entries(flags).forEach(([key,ids])=>$(key+'-control').hidden=!ids.includes(state.method));
  $('base-control').hidden=['none','learned','shaw','t5','alibi'].includes(state.method);
  $('timing-control').hidden=state.method!=='time-mrope'||state.scene!=='video';
  for(const name of['scale','stride','radius','angle','slope'])$(name+'-value').textContent=state.options[name].toFixed(name==='slope'||name==='radius'?2:0)+(name==='scale'?'×':name==='angle'?'°':'');
}
function render(){
  positions=coordinates(context,state.method,state.options);
  const eligible=eligibleQueries(positions);
  if(!eligible.includes(state.query))state.query=eligible.at(-1)??0;
  state.key=Math.min(state.key,positions.length-1);if(positions[state.key].excluded)state.key=eligible[0]??0;state.pair=Math.min(state.pair,PAIRS-1);
  const m=method();
  $('method-name').textContent=m.name;$('notes-title').textContent=m.name+' — method notes';$('method-summary').textContent=m.summary;$('method-source').href=m.source;
  renderReference();$('method-limits').textContent=m.limits;
  $('frequency-description').textContent=m.frequency;
  $('geometry-caption').textContent=state.method==='vrope'?'3D parameterization · inspect all four IDs':state.view==='source'?'Input layout · independent of the encoding':'Position IDs · not hidden embeddings';
  $('space-title').textContent=state.view==='source'?'SOURCE CONTEXT LAYOUT':state.method==='vrope'?'FOUR COORDINATES · THREE-DIMENSIONAL VIEW':'POSITION-INDEX SPACE';
  $('space-hint').textContent='Drag to rotate · click B · shift-click A';
  const selects=[['query-token',state.query],['key-token',state.key]];
  for(const[id,value]of selects){$(id).replaceChildren(...positions.map(p=>{const el=option(p.token.id,`${p.token.id} · ${p.token.label}`);if(p.excluded)el.disabled=true;return el;}));$(id).value=value;}
  controlsForMethod();renderScene();renderInspector();renderComponents();renderFrequency();renderTable();renderTour();
  $('view-encoded').setAttribute('aria-pressed',String(state.view==='encoded'));$('view-source').setAttribute('aria-pressed',String(state.view==='source'));
}
function renderScene(){
  const records=positions.map(p=>{
    if(state.view!=='source')return p;
    const t=p.token;
    if(t.type!=='text')return {...p,point:[t.f*2+t.group*5,t.h,t.w+1]};
    const before=t.id<(context.groups[0]?.start??context.tokens.length);
    const groupBefore=context.groups.filter(g=>g.end<=t.id).at(-1);
    const local=t.id-(groupBefore?.end??0);
    return {...p,point:[(groupBefore?.id??0)*5,before?-2:6,local*1.7]};
  });
  const flat=['none','sinusoidal','learned','shaw','t5','alibi','rope','pi','yarn','v2pe','circle'].includes(state.method);
  scene.setData({records,axes:state.view==='source'?['context / frame','row','column']:axesFor(state.method),query:state.query,key:state.key,textures,colorMode:state.color,tiles:state.view==='source'||!flat});
}
function renderInspector(){
  const q=positions[state.query],k=positions[state.key];
  const delta=k.ids.map((v,i)=>v-q.ids[i]);const distance=Math.hypot(...k.point.map((v,i)=>v-q.point[i]));
  const rows=[['Token A',`${q.token.id} · ${q.token.label}`],['A IDs',tuple(q)],['Token B',`${k.token.id} · ${k.token.label}`],['B IDs',tuple(k)],['Δ IDs',`(${delta.map(fmt).join(', ')})`],[state.method==='vrope'?'Parameter-space distance':'Index-space distance',fmt(distance)]];
  if(state.method==='t5')rows.push(['Relative bucket',String(relativeEncoding(q,k,'t5').index)]);
  if(state.method==='shaw')rows.push(['Clipped offset',String(Math.max(-8,Math.min(8,k.token.id-q.token.id)))]);
  if(k.excluded)rows.push(['Scope','Text excluded by this vision-only example']);
  $('token-inspector').replaceChildren(...rows.map(([key,value])=>{const row=element('div',undefined,'inspector-row');row.append(element('span',key),element('code',value));return row;}));
  const preview=$('patch-preview'),c=preview.getContext('2d');c.clearRect(0,0,128,128);
  if(k.token.type==='text'){
    c.fillStyle='#e8eee3';c.fillRect(0,0,128,128);c.fillStyle='#294d3d';c.font='16px Georgia';c.textAlign='center';c.fillText(k.token.label.slice(0,11),64,68);
    $('patch-description').textContent='A word-level teaching token. In a real model, a tokenizer may split this word into multiple subword tokens.';
  }else{
    const t=k.token,source=textures[t.group][t.f],size=source.width/t.W;
    c.imageSmoothingEnabled=false;c.drawImage(source,t.w*size,t.h*size,size,size,0,0,128,128);
    $('patch-description').textContent=`One token for this entire ${size} × ${size} pixel region of the 48 × 48 demonstration texture. These pixels share one positional ID tuple.`;
  }
}
function renderReference(){
  const entry=references[state.method];
  $('method-writeup').replaceChildren(...entry.paragraphs.map(p=>element('p',p)));
  $('method-equations').replaceChildren(...entry.equations.map(eq=>element('code',eq)));
  $('method-notation').textContent=entry.notation;
  $('method-distinction').textContent=entry.distinction;
  $('method-references').replaceChildren(...entry.references.map(ref=>{
    const li=element('li'),link=element('a',ref.label);link.href=ref.url;link.target='_blank';link.rel='noopener';li.append(link);return li;
  }));
}
function renderRelativePlot(svg,id,selected){
  const make=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e;};
  const extent=Math.max(id==='t5'?32:16,Math.abs(selected.offset));
  const xmin=-extent,xmax=id==='alibi'?0:extent;
  const ymin=id==='shaw'?-8:id==='alibi'?-Math.max(1,extent*state.options.slope):0,ymax=id==='shaw'?8:id==='t5'?31:0;
  const value=x=>id==='shaw'?Math.max(-8,Math.min(8,x)):id==='t5'?relativeBucket(x):state.options.slope*x;
  const x=v=>48+(v-xmin)/(xmax-xmin)*550,y=v=>132-(v-ymin)/(ymax-ymin)*100;
  const title=id==='shaw'?'Offset → clipped table address':id==='t5'?'Offset → bucket address':'Earlier-token offset → positional penalty';
  svg.setAttribute('aria-label',title);
  $('components-title').textContent=title;
  svg.append(make('line',{x1:48,y1:132,x2:598,y2:132,stroke:'#c6d0bd'}));
  for(const v of [ymin,ymax])svg.append(make('line',{x1:48,y1:y(v),x2:598,y2:y(v),stroke:'#e0e5da'}),make('text',{x:38,y:y(v)+4,'text-anchor':'end','font-size':11,fill:'#64756a'},number(v)));
  if(id==='t5'){
    for(let offset=xmin;offset<=xmax;offset++)svg.append(make('circle',{cx:x(offset),cy:y(value(offset)),r:2.4,fill:value(offset)===selected.index?'#b17830':'#a8b4a0'}));
  }else svg.append(make('polyline',{points:Array.from({length:xmax-xmin+1},(_,i)=>{const v=xmin+i;return `${x(v)},${y(value(v))}`;}).join(' '),fill:'none',stroke:'#638361','stroke-width':2}));
  for(const v of [xmin,0,...(xmax?[xmax]:[])])svg.append(make('text',{x:x(v),y:153,'text-anchor':'middle','font-size':11,fill:'#64756a'},String(v)));
  svg.append(make('text',{x:323,y:176,'text-anchor':'middle','font-size':11,fill:'#64756a'},'Offset = B position − A position'));
  if(id!=='alibi'||selected.offset<=0){
    const v=value(selected.offset),label=`${selected.offset} → ${number(v)}`;
    svg.append(make('circle',{cx:x(selected.offset),cy:y(v),r:5,fill:'#356aa0'}),make('text',{x:Math.max(95,Math.min(550,x(selected.offset))),y:18,'text-anchor':'middle','font-size':12,fill:'#356aa0'},label));
  }
}

function renderComponents(){
  const m=method(),relative=['shaw','t5','alibi'].includes(m.id),active=m.kind!=='rotary';
  $('components-panel').hidden=!active;if(!active)return;
  const a=positions[state.query],b=positions[state.key],r=relativeEncoding(a,b,m.id,state.options);
  const av=relative?r.values:encodingComponents(a,m.id,state.options),bv=relative?[]:encodingComponents(b,m.id,state.options);
  const scalar=m.id==='t5'||m.id==='alibi',baseline=m.id==='none';
  $('components-title').textContent=relative?'RELATIVE POSITIONAL TERM':'POSITION VECTOR COMPONENTS';
  $('components-description').textContent=baseline?'No positional signal is supplied. The plotted sequence indices are only a reference.':m.id==='sinusoidal'?'The actual sine–cosine vectors for A (amber) and B (blue), before addition to token embeddings.':m.id==='learned'?'Illustrative table rows for A (amber) and B (blue). These reproducible values are not pretrained parameters.':m.id==='shaw'?'The curve maps B − A to a clipped table address. Beyond ±8 it is flat: different offsets select the same relative vector. Open Component values for that illustrative vector.':m.id==='t5'?'A signed offset selects one of 32 bidirectional buckets (maximum distance 128). The scalar table value is illustrative, not pretrained.':'The causal positional bias for B at or before A: slope × (B − A). It is a raw additive bias, not a probability.';
  $('components-readout').textContent=baseline?'No encoding vector.':m.id==='t5'?`B − A = ${r.offset} · bucket ${r.index} · example bias ${fmt(av[0])}`:m.id==='alibi'?`B − A = ${r.offset} · ${av.length?'positional bias '+fmt(av[0]):'B is after A; outside the original causal domain'}`:m.id==='shaw'?`B − A = ${r.offset} · clipped index ${r.index} · ${DIM} components`:`${DIM} dimensions · A at ${tuple(a)} · B at ${tuple(b)}`;
  const svg=$('encoding-components');svg.replaceChildren();svg.hidden=baseline;
  if(relative){renderRelativePlot(svg,m.id,r);$('component-data').hidden=m.id!=='shaw';$('component-table').replaceChildren(...av.map((v,i)=>{const row=element('tr');row.append(element('td',String(i)),element('td',fmt(v)),element('td','relative vector'));return row;}));return;}
  $('component-data').hidden=scalar||baseline;
  if(scalar||baseline)return;
  const make=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e;};
  for(const value of[-1,0,1]){const y=80-value*56;svg.append(make('line',{x1:38,y1:y,x2:615,y2:y,stroke:'#d1dbca'}),make('text',{x:24,y:y+4,'text-anchor':'end',fill:'#64756a','font-size':10},String(value)));}
  for(const [values,color]of[[av,'#b17830'],[bv,'#356aa0']])if(values.length)svg.append(make('polyline',{points:values.map((v,i)=>`${38+i*577/(DIM-1)},${80-v*56}`).join(' '),fill:'none',stroke:color,'stroke-width':1.6}));
  for(const d of[0,12,24,36,47])svg.append(make('text',{x:38+d*577/(DIM-1),y:157,'text-anchor':'middle',fill:'#64756a','font-size':10},String(d)));
  svg.append(make('text',{x:326,y:177,'text-anchor':'middle',fill:'#64756a','font-size':10},'Component index'));
  $('component-table').replaceChildren(...av.map((v,i)=>{const row=element('tr');row.append(element('td',String(i)),element('td',fmt(v)),element('td',bv.length?fmt(bv[i]):'relative vector'));return row;}));
}
function renderFrequency(){
  $('pair-select').value=state.pair;
  const rotary=method().kind==='rotary';
  $('frequency-panel').hidden=!rotary;
  if(!rotary)return;
  const make=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e;};
  // Keep the same buttons when changing selection so keyboard focus is retained.
  if(!$('phase-grid').children.length)for(let j=0;j<PAIRS;j++){
    const button=element('button',undefined,'phase-pair');button.type='button';
    button.append(make('svg',{viewBox:'0 0 100 88','aria-hidden':'true'}),element('span'));
    button.addEventListener('click',()=>{state.pair=j;renderFrequency();renderTour();});
    $('phase-grid').append(button);
  }
  $('frequency-strip').replaceChildren();
  for(let j=0;j<PAIRS;j++){
    const info=pairInfo(state.method,j,state.options),q=phase(positions[state.query],state.method,j,state.options),k=phase(positions[state.key],state.method,j,state.options);
    const button=$('phase-grid').children[j],svg=button.querySelector('svg');
    button.setAttribute('aria-pressed',String(j===state.pair));
    button.setAttribute('aria-label',`Pair ${j}, axis ${info.name}, frequency ${info.frequency.toPrecision(3)}; A ${number(q)} radians, B ${number(k)} radians`);
    button.title=`Pair ${j} · ${info.name} · θ = ${info.frequency.toPrecision(4)}`;
    const different=Math.abs(k-q)>1e-10;button.dataset.different=String(different);
    button.lastElementChild.textContent=`${j} · ${info.name}${different?' •':''}`;
    svg.replaceChildren(make('circle',{cx:50,cy:44,r:32,fill:'none',stroke:'#bccbb6','stroke-width':1.2}),make('line',{x1:14,y1:44,x2:86,y2:44,stroke:'#dce2d7'}));
    // Draw A wider and B narrower: both remain visible when their phases coincide.
    for(const [angle,color,width,radius] of [[q,'#b17830',4.5,4],[k,'#356aa0',2,2]]){
      const x=50+Math.cos(angle)*32,y=44-Math.sin(angle)*32;
      svg.append(make('line',{x1:50,y1:44,x2:x,y2:y,stroke:color,'stroke-width':width}),make('circle',{cx:x,cy:y,r:radius,fill:color}));
    }
    const allocation=element('button',info.name,'frequency-pair');allocation.dataset.axis=info.name;
    allocation.append(element('small',String(j)));allocation.title=button.title;allocation.setAttribute('aria-label',button.title);allocation.setAttribute('aria-pressed',String(j===state.pair));
    allocation.addEventListener('click',()=>{state.pair=j;renderFrequency();renderTour();});$('frequency-strip').append(allocation);
  }
  const q=phase(positions[state.query],state.method,state.pair,state.options),k=phase(positions[state.key],state.method,state.pair,state.options),info=pairInfo(state.method,state.pair,state.options);
  let rule=`Δφ = ΔID[${info.name}] × θ = ${number(positions[state.key].ids[info.axis]-positions[state.query].ids[info.axis])} × ${number(info.frequency)}`;
  if(state.method==='mixed'){
    const angle=(state.options.angle+(state.pair%2)*90)*Math.PI/180;
    rule=`φ = ${number(info.frequency*Math.cos(angle))}w + ${number(info.frequency*Math.sin(angle))}h`;
  }
  $('phase-readout').textContent=`Pair ${state.pair} · ${info.name} · ${rule}\nA ${number(q)} rad · B ${number(k)} rad · Δφ ${number(k-q)} rad`;
  $('frequency-footnote').textContent=`${PAIRS} pairs / ${DIM} dimensions in this teaching example, not an entire model or every attention head. Axis allocations are illustrative: equal thirds for the three-axis examples, equal quarters for VRoPE. Released checkpoints specify their own allocations. Pair indices run from high to low frequency. Circles wrap modulo 2π; numeric phases do not. MHRoPE shows the currently selected head.`;
}

function renderTable(){
  $('coordinate-table').replaceChildren(...positions.map((p,i)=>{const row=element('tr');row.append(element('td',`${i}: ${p.token.label}`),element('td',p.token.type),element('td',tuple(p)),element('td',p.excluded?'not encoded':'included'));return row;}));
}

function populateReading(){
  $('reading-index').replaceChildren(...methods.filter(m=>m.id!=='none').map(m=>{
    const row=element('div',undefined,'reading-item'),link=element('a',m.name);link.href=m.source;link.target='_blank';link.rel='noopener';link.append(element('small',`${m.year} · ${m.family}`));
    const button=element('button','Explore ↗');button.addEventListener('click',()=>{selectMethod(m.id);$('library-dialog').close();$('method-select').focus();});row.append(link,button);return row;
  }));
  $('further-reading').replaceChildren(...furtherReading.map(m=>{const item=element('div'),link=element('a',`${m.name} · ${m.year}`);link.href=m.url;item.append(link,element('p',m.note));return item;}));
}

function populateMethods(){
  const groups=[['Core tutorial',corePath],['Research directions',featuredResearch]];
  if(showAllMethods)groups.push(['More research',researchPath],['Other approaches & baseline',alternativePath]);
  $('method-select').replaceChildren(...groups.map(([label,ids])=>{
    const group=element('optgroup');group.label=label;
    group.append(...ids.map((id,i)=>option(id,`${label==='Core tutorial'?`${i+1}. `:''}${methods.find(m=>m.id===id).name}`)));return group;
  }));
  $('method-select').value=state.method;
  $('toggle-methods').setAttribute('aria-expanded',String(showAllMethods));
  $('toggle-methods').textContent=showAllMethods?'Show guided path only':'Other methods';
}
showAllMethods=!guidedPath.includes(state.method);
populateMethods();
$('toggle-methods').addEventListener('click',()=>{
  showAllMethods=!showAllMethods;
  if(!showAllMethods&&!guidedPath.includes(state.method))selectMethod(corePath[0]);
  else populateMethods();
});
$('method-select').addEventListener('change',()=>selectMethod($('method-select').value));
function showVisualPanel(id){
  const combined=id==='encoding-view';
  $('geometry-view').hidden=false;
  $('encoding-view').hidden=!combined;
  document.body.classList.toggle('combined-view',combined);
  $('show-geometry').setAttribute('aria-pressed',String(!combined));
  $('show-encoding').setAttribute('aria-pressed',String(combined));
  document.querySelector('.visual-scroll').scrollTop=0;
  scene.requestDraw();updateReadingHelp();
}
function updateReadingHelp(){
  const geometry=state.view==='source'
    ? 'Dots represent word-level teaching tokens; each tile represents one patch of 12 × 12 pixels. This is the original input layout before assigning position IDs.'
    : 'The 3D scene plots position IDs, not trained vectors. The image texture helps you follow patches when the layout changes.';
  const controls=' Choose Token A and Token B above the scene, or click a token for B and shift-click for A. Drag to rotate.';
  $('reading-help').textContent=geometry+controls+($('encoding-view').hidden?'':' Below the scene, the encoding uses those same two tokens. '+readingGuide(state.method,method().kind==='rotary'));
}
for(const [button,id] of [['open-notes','notes-dialog'],['open-settings','settings-dialog'],['open-library','library-dialog']]){
  $(button).addEventListener('click',()=>$(id).showModal());
  $(id).querySelector('[data-close]').addEventListener('click',()=>$(id).close());
}
function customize(){state.step=4;experimentAlternate=false;experimentReady=false;}
$('try-experiment').addEventListener('click',()=>{
  if(experimentReady)experimentAlternate=!experimentAlternate;
  else{experimentReady=true;experimentAlternate=false;}
  Object.assign(state,experimentPreset(state.method,experimentAlternate));
  setControls();scene.reset();rebuild();showVisualPanel('encoding-view');
});
$('show-geometry').addEventListener('click',()=>showVisualPanel('geometry-view'));
$('show-encoding').addEventListener('click',()=>showVisualPanel('encoding-view'));
$('tour-prev').addEventListener('click',()=>goToStep(state.step-1));
$('tour-next').addEventListener('click',()=>{
  if(state.step<4)goToStep(state.step+1);
  else if(guidedPath.includes(state.method))selectMethod(chapterAfter(state.method)??corePath[0]);
  else goToStep(0);
});
$('restart-tour').addEventListener('click',()=>goToStep(0));
$('explore-freely').addEventListener('click',()=>goToStep(4));
$('tour-title').addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();goToStep(state.step+(event.key==='ArrowRight'?1:-1));}});
$('settings-dialog').addEventListener('input',event=>{if(event.target.matches('select,input')&&event.target.id!=='color-mode')customize();},true);
$('settings-dialog').addEventListener('change',event=>{if(event.target.matches('select,input')&&event.target.id!=='color-mode')customize();},true);
$('example').addEventListener('change',()=>{state.scene=$('example').value;rebuild(true);scene.reset();});
$('timing').addEventListener('change',()=>{state.options.timing=$('timing').value;render();});
for(const [id,key] of [['query-token','query'],['key-token','key']])$(id).addEventListener('change',()=>{
  state[key]=Number($(id).value);customize();render();showVisualPanel('encoding-view');
});
$('frequency-base').addEventListener('change',()=>{state.options.base=Number($('frequency-base').value);render();});
for(const name of['scale','stride','radius','angle','head','seed','slope','increment'])$(name).addEventListener('input',()=>{state.options[name]=Number($(name).value);render();});
for(const [id,value]of[['view-source','source'],['view-encoded','encoded']])$(id).addEventListener('click',()=>{customize();state.view=value;scene.reset();render();});
$('color-mode').addEventListener('change',()=>{state.color=$('color-mode').value;renderScene();});
$('pair-select').append(...Array.from({length:PAIRS},(_,j)=>option(j,`Pair ${j}`)));$('pair-select').addEventListener('change',()=>{state.pair=Number($('pair-select').value);renderFrequency();renderTour();});
$('zoom-in').addEventListener('click',()=>scene.zoomBy(1.2));$('zoom-out').addEventListener('click',()=>scene.zoomBy(1/1.2));$('reset-view').addEventListener('click',()=>scene.reset());
$('copy-link').addEventListener('click',async()=>{
  const params=new URLSearchParams({method:state.method,step:String(state.step),scene:state.scene,query:String(state.query),key:String(state.key),pair:String(state.pair),color:state.color});
  for(const key of['base','scale','stride','radius','angle','head','seed','slope','increment','timing'])params.set(key,String(state.options[key]));
  const url=location.origin+location.pathname+'#'+params.toString();
  try{await navigator.clipboard.writeText(url);notify('Configuration link copied. The fixed example and encoding settings are preserved.');}catch{notify('Clipboard unavailable. The configuration is now in your address bar; copy it there.');}
  history.replaceState(null,'','#'+params.toString());
});
$('export-data').addEventListener('click',()=>{
  const data={title:'Position Atlas — positional construction',method:state.method,walkthrough_step:state.step+1,sources:references[state.method].references,example:state.scene,options:state.options,token_a:state.query,token_b:state.key,scope:method().limits,note:'Illustrative position indices and components, not trained embeddings or model outputs.',relative_term:relativeEncoding(positions[state.query],positions[state.key],state.method,state.options),tokens:positions.map((p,i)=>({sequence_index:i,label:p.token.label,modality:p.token.type,position_ids:p.ids,plot_point:p.point,excluded:!!p.excluded,components:encodingComponents(p,state.method,state.options),phases:method().kind==='rotary'&&!p.excluded?Array.from({length:PAIRS},(_,j)=>phase(p,state.method,j,state.options)):[]}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`position-atlas-${state.method}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Positional data downloaded.');
});

$('consent').hidden=!analytics.needsChoice;
$('privacy-settings').addEventListener('click',()=>{if(analytics.available){$('library-dialog').close();$('consent').hidden=false;$('decline-analytics').focus();}else notify('Analytics is inactive: no ID, preview environment, or browser privacy preference.');});
for(const[id,choice]of[['accept-analytics','accepted'],['decline-analytics','declined']])$(id).addEventListener('click',()=>{analytics.setChoice(choice);$('consent').hidden=true;});
$('close-consent').addEventListener('click',()=>{$('consent').hidden=true;$('open-library').focus();});
setControls();populateReading();rebuild(initialParams.has('scene')&&!hasLinkedQuery);$('pair-select').value=state.pair;

showVisualPanel(state.step>=2?'encoding-view':'geometry-view');
