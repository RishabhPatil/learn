import { methods, furtherReading } from './atlas-data.js';
import { buildContext, coordinates, distribution, phase, pairInfo, relativeBucket, eligibleQueries, axesFor, defaults, PAIRS, DIM, logit } from './atlas-math.js';
import { PositionScene } from './atlas-scene.js';
import { analyticsId } from './config.js';
import { createAnalytics } from './analytics.js';

const $=id=>document.getElementById(id);
const analytics=createAnalytics({window,document,id:analyticsId});
const state={method:'mrope',scene:'image',grid:4,prefix:'Find the red object',suffix:'Where is it now?',query:0,key:0,pair:0,view:'encoded',color:'texture',options:{...defaults}};
let context,positions,attention,textures=[],uploaded=null,statusTimer,imageRequest=0;
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
  if(safeScene.has(params.get('scene')))state.scene=params.get('scene');
  if([3,4,6].includes(Number(params.get('grid'))))state.grid=Number(params.get('grid'));
  for(const [name,min,max]of[['base',100,1000000],['scale',1,16],['stride',1,8],['radius',1,8],['angle',0,180],['head',0,2],['seed',1,99],['slope',0,.5],['increment',.0625,1],['temperature',.25,2]]){
    if(params.has(name)){const value=Number(params.get(name));if(Number.isFinite(value))state.options[name]=Math.max(min,Math.min(max,value));}
  }
  state.options.head=Math.round(state.options.head);
  if(params.get('mask')==='full')state.options.causal=false;
  if(params.get('content')==='toy')state.options.content='toy';
  if(params.get('timing')==='irregular')state.options.timing='irregular';
  if(['texture','attention','modality'].includes(params.get('color')))state.color=params.get('color');
  for(const name of['query','key','pair'])if(params.has(name))state[name]=Math.max(0,Math.floor(Number(params.get(name))||0));
}
readLink();
const hasLinkedQuery=new URLSearchParams(location.hash.slice(1)).has('query');
const scene=new PositionScene($('space'),{onSelect(id,isQuery){if(isQuery){if(positions[id].excluded){notify('This vision-only method has no text query. Select a visual token.');return;}state.query=id;}else state.key=id;render();}});

function sampleImage(frame,group){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=48;const c=canvas.getContext('2d');
  if(uploaded){c.drawImage(uploaded,0,0,48,48);return canvas;}
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
function sample(frame,h,w,grid,group){
  const c=textures[group][frame].getContext('2d'),size=48/grid;
  const data=c.getImageData(w*size,h*size,size,size).data;
  const sums=[0,0,0];for(let i=0;i<data.length;i+=4)for(let j=0;j<3;j++)sums[j]+=data[i+j];
  return sums.map(v=>v/(data.length/4*255));
}
function rebuild(resetQuery=false){
  prepareTextures();context=buildContext({prefix:state.prefix,suffix:state.suffix,scene:state.scene,grid:state.grid,sample});
  if(resetQuery){state.query=context.tokens.length-1;state.key=context.groups[0]?.start??0;}
  $('token-count').textContent=`${context.tokens.length} tokens`;
  $('apply-context').textContent='Apply context ↗';
  $('timing-wrap').hidden=state.scene!=='video';
  render();
}
function listMethods(){
  const search=$('method-search').value.toLowerCase().trim(),family=$('family-filter').value;
  const families=['Foundations','Rotary & context','Vision','Multimodal','Video'];
  const entries=methods.filter(m=>(family==='all'||m.family===family)&&`${m.name} ${m.summary} ${m.family}`.toLowerCase().includes(search)).sort((a,b)=>families.indexOf(a.family)-families.indexOf(b.family));
  $('method-list').replaceChildren();let current='';
  for(const m of entries){
    if(m.family!==current){$('method-list').append(element('p',m.family,'family-label'));current=m.family;}
    const button=element('button',undefined,'method-button');button.dataset.method=m.id;button.setAttribute('aria-pressed',String(m.id===state.method));
    button.append(element('span',m.name),element('small',m.year.split(' ')[0]));button.addEventListener('click',()=>selectMethod(m.id));$('method-list').append(button);
  }
  $('search-empty').hidden=entries.length>0;
}
function selectMethod(id){state.method=id;listMethods();scene.reset();render();analytics.track('method_select',id);}
function setControls(){
  $('scene').value=state.scene;$('grid').value=state.grid;$('prefix-text').value=state.prefix;$('suffix-text').value=state.suffix;
  $('frequency-base').value=state.options.base;$('content-mode').value=state.options.content;$('mask').value=state.options.causal?'causal':'full';$('timing').value=state.options.timing;$('color-mode').value=state.color;
  for(const name of['scale','stride','radius','angle','head','seed','slope','increment','temperature'])$(name).value=state.options[name];
  // Unknown finite linked values are safely represented instead of leaving a blank select.
  for(const id of['frequency-base','seed','increment'])if($(id).value===''){const key=id==='frequency-base'?'base':id;$(id).append(option(state.options[key],fmt(state.options[key])));$(id).value=state.options[key];}
}
function controlsForMethod(){
  const flags={scale:['pi','yarn'],stride:['circle','videorope','time-mrope'],radius:['circle'],angle:['mixed'],head:['mhrope'],seed:['learned','shaw','t5'],slope:['alibi'],increment:['v2pe']};
  Object.entries(flags).forEach(([key,ids])=>$(key+'-control').hidden=!ids.includes(state.method));
  $('frequency-base').disabled=['none','learned','shaw','t5','alibi'].includes(state.method);
  for(const name of['scale','stride','radius','angle','slope','temperature'])$(name+'-value').textContent=state.options[name].toFixed(name==='temperature'||name==='slope'?2:0)+(name==='scale'?'×':name==='angle'?'°':'');
}
function render(){
  positions=coordinates(context,state.method,state.options);
  const eligible=eligibleQueries(positions);
  if(!eligible.includes(state.query))state.query=eligible.at(-1)??0;
  state.key=Math.min(state.key,positions.length-1);state.pair=Math.min(state.pair,PAIRS-1);
  attention=distribution(positions,state.query,state.method,state.options);
  const m=method();
  $('method-family').textContent=`${m.family.toUpperCase()} / ${m.year}`;$('method-name').textContent=m.name;$('method-summary').textContent=m.summary;$('method-source').href=m.source;
  $('geometry-explanation').textContent=state.view==='source'?'Source layout keeps the original patch grid visible, independently of the chosen encoding. Switch to Position IDs to inspect the mathematical layout.':m.geometry;
  $('method-formula').textContent=m.formula;$('method-experiment').textContent=m.experiment;$('method-limits').textContent=m.limits;
  $('frequency-description').textContent=m.frequency;
  $('geometry-caption').textContent=state.method==='vrope'?'3D parameterization · inspect all four IDs':state.view==='source'?'Input layout · independent of the encoding':'Position IDs · not hidden embeddings';
  $('space-title').textContent=state.view==='source'?'SOURCE CONTEXT LAYOUT':state.method==='vrope'?'FOUR COORDINATES · THREE-DIMENSIONAL VIEW':'POSITION-INDEX SPACE';
  $('space-hint').textContent='Drag to orbit · wheel to zoom · click key · shift-click query';
  const selects=[['query-token',state.query],['key-token',state.key]];
  for(const[id,value]of selects){$(id).replaceChildren(...positions.map(p=>{const el=option(p.token.id,`${p.token.id} · ${p.token.label}`);if(id==='query-token'&&p.excluded)el.disabled=true;return el;}));$(id).value=value;}
  controlsForMethod();renderScene();renderInspector();renderAttention();renderFrequency();renderTable();
  $('view-encoded').setAttribute('aria-pressed',String(state.view==='encoded'));$('view-source').setAttribute('aria-pressed',String(state.view==='source'));
}
function renderScene(){
  const records=positions.map(p=>{
    if(state.view!=='source')return p;
    const t=p.token;
    const start=context.groups[t.group]?.start??0;
    return {...p,point:t.type==='text'?[t.id*.35,-2,-2]:[start*.35+t.f*2+t.group*4,t.h,t.w]};
  });
  const flat=['none','sinusoidal','learned','shaw','t5','alibi','rope','pi','yarn','v2pe','circle'].includes(state.method);
  scene.setData({records,axes:state.view==='source'?['context / frame','row','column']:axesFor(state.method),query:state.query,key:state.key,attention,textures,colorMode:state.color,tiles:state.view==='source'||!flat});
}
function renderInspector(){
  const q=positions[state.query],k=positions[state.key];
  const delta=k.ids.map((v,i)=>v-q.ids[i]);const distance=Math.hypot(...k.point.map((v,i)=>v-q.point[i]));
  const rows=[['Query',`${q.token.id} · ${q.token.label}`],['Query IDs',tuple(q)],['Key',`${k.token.id} · ${k.token.label}`],['Key IDs',tuple(k)],['Δ IDs',`(${delta.map(fmt).join(', ')})`],['Plotted distance',fmt(distance)],['Key weight',`${(attention[state.key]*100).toFixed(3)}%`]];
  if(state.method==='t5')rows.push(['Relative bucket',String(relativeBucket(k.token.id-q.token.id,!state.options.causal))]);
  if(state.method==='shaw')rows.push(['Clipped offset',String(Math.max(-8,Math.min(8,k.token.id-q.token.id)))]);
  if(k.excluded)rows.push(['Scope','Text excluded by this vision-only example']);
  else if(state.options.causal&&k.token.id>q.token.id)rows.push(['Mask','Future key → weight 0']);
  $('token-inspector').replaceChildren(...rows.map(([key,value])=>{const row=element('div',undefined,'inspector-row');row.append(element('span',key),element('code',value));return row;}));
  const preview=$('patch-preview'),c=preview.getContext('2d');c.clearRect(0,0,128,128);
  if(k.token.type==='text'){
    c.fillStyle='#e8eee3';c.fillRect(0,0,128,128);c.fillStyle='#294d3d';c.font='16px Georgia';c.textAlign='center';c.fillText(k.token.label.slice(0,11),64,68);
    $('patch-description').textContent='A word-level teaching token. In a real model, a tokenizer may split this word into multiple subword tokens.';
  }else{
    const t=k.token,source=textures[t.group][t.f],size=source.width/t.W;
    c.imageSmoothingEnabled=false;c.drawImage(source,t.w*size,t.h*size,size,size,0,0,128,128);
    $('patch-description').textContent=`One token for this entire ${size} × ${size} pixel region of the 48 × 48 demonstration texture. These pixels share one positional ID tuple. Original uploads are resampled locally.`;
  }
}
function renderAttention(){
  $('attention-explanation').textContent=state.options.content==='position'?`Identical (1,0) vectors in all ${PAIRS} Q/K pairs; ${method().kind==='additive'?'zero content plus the positional vectors':'content held constant'}. Softmax of the method’s logits, temperature ${state.options.temperature.toFixed(2)}.`:'Engineered RGB/word features, not learned representations. “red”, “blue”, and “green” map to simple color vectors; arbitrary text is not semantically understood.';
  const totals={text:0,image:0,video:0};positions.forEach((p,i)=>totals[p.token.type]+=attention[i]);
  $('attention-mass').replaceChildren(...Object.entries(totals).map(([name,value])=>{const row=element('div',undefined,'mass-row'),track=element('div',undefined,'mass-track'),bar=element('span');bar.style.width=`${value*100}%`;track.append(bar);row.append(element('span',name),track,element('b',`${(value*100).toFixed(1)}%`));return row;}));
  const top=positions.map((p,i)=>({p,a:attention[i]})).filter(x=>x.a>0).sort((a,b)=>b.a-a.a).slice(0,5);
  $('attention-keys').replaceChildren(element('p','Highest-weight keys in this example','micro'),...top.map(({p,a})=>{
    const button=element('button',undefined,'attention-key');button.setAttribute('aria-pressed',String(p.token.id===state.key));button.append(element('b',`${p.token.id} · ${p.token.label}`),element('span',`${(a*100).toFixed(2)}%`));button.addEventListener('click',()=>{state.key=p.token.id;render();});return button;
  }));
  if(!top.length)$('attention-keys').append(element('p','No eligible visual tokens. Add an image or video to explore this vision-only method.','micro'));
}
function renderFrequency(){
  const rotary=method().kind==='rotary',sin=state.method==='sinusoidal';
  $('pair-select').disabled=!rotary&&!sin;
  $('frequency-strip').replaceChildren();
  if(rotary||sin)for(let j=0;j<PAIRS;j++){
    const info=pairInfo(state.method,j,state.options),button=element('button',info.name,'frequency-pair');button.dataset.axis=info.name;
    button.append(element('small',String(j)));button.title=`Pair ${j}: ${info.name}, frequency ${info.frequency.toPrecision(3)}`;button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(j===state.pair));button.addEventListener('click',()=>{state.pair=j;$('pair-select').value=j;renderFrequency();});$('frequency-strip').append(button);
  }
  const svg=$('phase-wheel');svg.replaceChildren();
  const make=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e;};
  if(rotary||sin){
    const q=phase(positions[state.query],state.method,state.pair,state.options),k=phase(positions[state.key],state.method,state.pair,state.options),info=pairInfo(state.method,state.pair,state.options);
    svg.append(make('circle',{cx:82,cy:72,r:49,fill:'none',stroke:'#bccbb6'}));
    svg.append(make('line',{x1:25,y1:72,x2:139,y2:72,stroke:'#d1dbca'}));
    for(const[a,color,label]of[[q,'#b17830','Q'],[k,'#356aa0','K']]){const x=82+Math.cos(a)*49,y=72-Math.sin(a)*49;svg.append(make('line',{x1:82,y1:72,x2:x,y2:y,stroke:color,'stroke-width':2.3}),make('circle',{cx:x,cy:y,r:3,fill:color}),make('text',{x:x+6,y:y+(label==='Q'?-7:13),fill:color,'font-size':11},label));}
    $('phase-readout').textContent=`Pair ${state.pair} · axis ${info.name} · θ = ${info.frequency.toPrecision(4)}\nQuery phase ${q.toFixed(3)} rad\nKey phase ${k.toFixed(3)} rad\nΔφ ${(k-q).toFixed(3)} rad · cos(Δφ) ${Math.cos(k-q).toFixed(4)}`;
    $('frequency-footnote').textContent=sin?'Sine/cosine input features are shown as phase angles, not Q/K rotations. The score uses input addition.':`${PAIRS} pairs / ${DIM} dimensions. Equal t/h/w allocations in this lab make comparisons inspectable; released checkpoints use their own ratios. Pair indices run from high to low frequency. The wheel wraps modulo 2π; numeric phases do not.`;
  }else{
    $('phase-readout').textContent=state.method==='t5'?'Relative offsets select buckets. Each bucket has an illustrative learned scalar bias.':state.method==='shaw'?'Relative offsets select illustrative key vectors. No rotary phases are used.':state.method==='learned'?'The seed controls a deterministic example table. A real table is optimized during training.':'No rotary frequency allocation for this method.';
    $('frequency-footnote').textContent='The 3D scene is a layout reference for this method; it is not a learned positional vector.';
  }
}
function renderTable(){
  $('coordinate-table').replaceChildren(...positions.map((p,i)=>{const row=element('tr');row.append(element('td',`${i}: ${p.token.label}`),element('td',p.token.type),element('td',tuple(p)),element('td',p.excluded?'excluded':`${(attention[i]*100).toFixed(3)}%`));return row;}));
}

function populateReading(){
  $('reading-index').replaceChildren(...methods.filter(m=>m.id!=='none').map(m=>{
    const row=element('div',undefined,'reading-item'),link=element('a',m.name);link.href=m.source;link.target='_blank';link.rel='noopener';link.append(element('small',`${m.year} · ${m.family}`));
    const button=element('button','Explore ↗');button.addEventListener('click',()=>{selectMethod(m.id);$('lab-top').scrollIntoView({behavior:'smooth',block:'start'});});row.append(link,button);return row;
  }));
  $('further-reading').replaceChildren(...furtherReading.map(m=>{const item=element('div'),link=element('a',`${m.name} · ${m.year}`);link.href=m.url;item.append(link,element('p',m.note));return item;}));
}

$('method-search').addEventListener('input',listMethods);$('family-filter').addEventListener('change',listMethods);
$('apply-context').addEventListener('click',()=>{state.prefix=$('prefix-text').value;state.suffix=$('suffix-text').value;state.scene=$('scene').value;state.grid=Number($('grid').value);state.options.timing=$('timing').value;rebuild(true);scene.reset();notify('Context updated. Select a key in the scene or shift-click to change the query.');});
for(const id of['scene','grid','timing'])$(id).addEventListener('change',()=>{$('apply-context').textContent='Apply changes ↗';});
$('query-token').addEventListener('change',()=>{state.query=Number($('query-token').value);render();});$('key-token').addEventListener('change',()=>{state.key=Number($('key-token').value);render();});
$('content-mode').addEventListener('change',()=>{state.options.content=$('content-mode').value;render();});$('mask').addEventListener('change',()=>{state.options.causal=$('mask').value==='causal';render();});
$('frequency-base').addEventListener('change',()=>{state.options.base=Number($('frequency-base').value);render();});
for(const name of['scale','stride','radius','angle','head','seed','slope','increment','temperature'])$(name).addEventListener('input',()=>{state.options[name]=Number($(name).value);render();});
for(const [id,value]of[['view-source','source'],['view-encoded','encoded']])$(id).addEventListener('click',()=>{state.view=value;scene.reset();render();});
$('color-mode').addEventListener('change',()=>{state.color=$('color-mode').value;renderScene();});
$('pair-select').append(...Array.from({length:PAIRS},(_,j)=>option(j,`Pair ${j}`)));$('pair-select').addEventListener('change',()=>{state.pair=Number($('pair-select').value);renderFrequency();});
$('rotate-left').addEventListener('click',()=>scene.orbit(-.25,0));$('rotate-right').addEventListener('click',()=>scene.orbit(.25,0));$('zoom-in').addEventListener('click',()=>scene.zoomBy(1.2));$('zoom-out').addEventListener('click',()=>scene.zoomBy(1/1.2));$('reset-view').addEventListener('click',()=>scene.reset());
$('image-upload').addEventListener('change',async()=>{
  const file=$('image-upload').files[0];if(!file)return;
  const request=++imageRequest;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024){notify('Choose a PNG, JPEG, or WebP image up to 12 MB.');$('image-upload').value='';return;}
  try{
    $('image-status').textContent='Decoding your image locally…';
    const bitmap=await createImageBitmap(file,{resizeWidth:48,resizeHeight:48,resizeQuality:'high'});
    if(request!==imageRequest){bitmap.close();return;}
    uploaded?.close();uploaded=bitmap;
    if(state.scene==='text'){state.scene='image';$('scene').value='image';}
    $('image-status').textContent='Your image is used locally and resampled to 48 × 48. In video mode the same uploaded image appears in every frame. It is never uploaded or sent to analytics.';
    rebuild(true);notify('Local image loaded. Each patch has one positional ID tuple.');
  }catch{if(request===imageRequest){$('image-status').textContent='Image could not be decoded; the previous texture is unchanged.';notify('This image could not be decoded. Try a PNG or JPEG.');}}
});
$('reset-image').addEventListener('click',()=>{imageRequest++;uploaded?.close();uploaded=null;$('image-upload').value='';$('image-status').textContent='Sample restored. Images stay in this browser. Word tokens and patch grids are illustrative, not checkpoint tokenization.';rebuild(true);});
$('copy-link').addEventListener('click',async()=>{
  const params=new URLSearchParams({method:state.method,scene:state.scene,grid:String(state.grid),query:String(state.query),key:String(state.key),pair:String(state.pair),mask:state.options.causal?'causal':'full',content:state.options.content,color:state.color});
  for(const key of['base','scale','stride','radius','angle','head','seed','slope','increment','temperature','timing'])params.set(key,String(state.options[key]));
  const url=location.origin+location.pathname+'#'+params.toString();
  try{await navigator.clipboard.writeText(url);notify('Configuration link copied. Recipients see the sample context; your text/image is omitted.');}catch{notify('Clipboard unavailable. The configuration is now in your address bar; copy it there.');}
  history.replaceState(null,'','#'+params.toString());
});
$('export-data').addEventListener('click',()=>{
  const data={title:'Position Atlas — teaching example',method:state.method,source:method().source,options:state.options,query:state.query,inspected_key:state.key,note:'Synthetic scores, not trained model attention. Includes token labels; image bytes are omitted.',tokens:positions.map((p,i)=>({sequence_index:i,label:p.token.label,modality:p.token.type,position_ids:p.ids,plot_point:p.point,excluded:!!p.excluded,attention:attention[i],logit:Number.isFinite(logit(positions[state.query],p,state.method,state.options))?logit(positions[state.query],p,state.method,state.options):null}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`position-atlas-${state.method}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Coordinates and synthetic attention downloaded.');
});

$('consent').hidden=!analytics.needsChoice;
$('privacy-settings').addEventListener('click',()=>{if(analytics.available){$('consent').hidden=false;$('decline-analytics').focus();}else notify('Analytics is inactive: no ID, preview environment, or browser privacy preference.');});
for(const[id,choice]of[['accept-analytics','accepted'],['decline-analytics','declined']])$(id).addEventListener('click',()=>{analytics.setChoice(choice);$('consent').hidden=true;});
$('close-consent').addEventListener('click',()=>{$('consent').hidden=true;$('privacy-settings').focus();});
setControls();listMethods();populateReading();rebuild(!hasLinkedQuery);$('pair-select').value=state.pair;
