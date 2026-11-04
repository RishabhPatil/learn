import { cameraProjection, fitCamera } from './atlas-navigation.js';
// Orthographic 3D projection with painter's ordering. No external renderer/CDN.
// This displays position indices; it never claims to project hidden embeddings.
export class PositionScene {
  constructor(canvas,{onSelect,onCamera,onHover}={}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onSelect=onSelect;this.onCamera=onCamera;this.onHover=onHover;this.hovered=null;this.fitMode='all';this.fitKey=null;this.highlight=null;
    this.yaw=.65;this.pitch=.45;this.zoom=1;this.records=[];this.targets=[];this.width=800;this.height=480;
    this.pointer=null;this.dragged=false;this.drawPending=false;
    this.resize=new ResizeObserver(()=>this.requestDraw());this.resize.observe(canvas);
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.setHover(null);this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};this.dragged=false;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{
      if(!this.pointer){if(e.pointerType!=='touch')this.setHover(this.hitTest(e));return;}
      if(e.pointerId!==this.pointer.id)return;
      const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;
      if(Math.hypot(e.clientX-this.pointer.startX,e.clientY-this.pointer.startY)>4)this.dragged=true;
      if(this.dragged){this.yaw+=dx*.008;this.pitch=Math.max(-1.35,Math.min(1.35,this.pitch+dy*.008));this.requestDraw();}
      this.pointer.x=e.clientX;this.pointer.y=e.clientY;
    });
    canvas.addEventListener('pointerup',e=>{
      if(!this.pointer||e.pointerId!==this.pointer.id)return;
      if(!this.dragged){const hit=this.hitTest(e);if(hit)this.onSelect?.(hit.id,e.shiftKey);}
      this.pointer=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
      this.onCamera?.();
    });
    canvas.addEventListener('pointercancel',()=>{this.pointer=null;this.setHover(null);});
    canvas.addEventListener('pointerleave',()=>this.setHover(null));
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.35,Math.min(5,this.zoom*Math.exp(-e.deltaY*.001)));this.requestDraw();},{passive:false});
    canvas.addEventListener('keydown',e=>{
      const actions={ArrowLeft:()=>this.orbit(-.15,0),ArrowRight:()=>this.orbit(.15,0),ArrowUp:()=>this.orbit(0,-.12),ArrowDown:()=>this.orbit(0,.12),'+':()=>this.zoomBy(1.2),'=':()=>this.zoomBy(1.2),'-':()=>this.zoomBy(1/1.2),'0':()=>this.reset()};
      if(actions[e.key]){e.preventDefault();actions[e.key]();}
    });
  }
  orbit(x,y){this.yaw+=x;this.pitch=Math.max(-1.35,Math.min(1.35,this.pitch+y));this.requestDraw();}
  zoomBy(f){this.zoom=Math.max(.35,Math.min(5,this.zoom*f));this.requestDraw();}
  reset(){this.yaw=.65;this.pitch=.45;this.fit('all');}
  fit(mode='all'){this.fitMode=mode;this.fitKey=null;this.zoom=1;this.setHover(null);this.requestDraw();}
  highlightDirection(direction){this.highlight=direction;this.requestDraw();}
  hitTest(event){const rect=this.canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;return [...this.targets].reverse().map(t=>({...t,d:Math.hypot(t.x-x,t.y-y)})).filter(t=>t.d<t.radius).sort((a,b)=>a.d-b.d)[0]??null;}
  setHover(hit){if(this.hovered===(hit?.id??null))return;this.hovered=hit?.id??null;this.onHover?.(hit?this.records.find(r=>r.token.id===hit.id):null,hit);this.requestDraw();}
  setData(data){this.setHover(null);Object.assign(this,data);this.requestDraw();}
  requestDraw(){if(this.drawPending)return;this.drawPending=true;requestAnimationFrame(()=>{this.drawPending=false;this.draw();});}
  project(p){
    const projected=cameraProjection(p,this.center,this.yaw,this.pitch);
    return {x:this.width/2+(projected.x-this.offset[0])*this.unit,y:this.height/2-(projected.y-this.offset[1])*this.unit,z:projected.z};
  }

  segment(a,b,color,width=1,dashed=false){const c=this.ctx,p=this.project(a),q=this.project(b);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dashed?[4,5]:[]);c.stroke();c.setLineDash([]);}
  draw(){
    const rect=this.canvas.getBoundingClientRect();if(!rect.width)return;
    this.width=rect.width;this.height=rect.height;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(this.canvas.width!==Math.round(rect.width*dpr)||this.canvas.height!==Math.round(rect.height*dpr)){this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);}
    const c=this.ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,this.width,this.height);this.targets=[];
    if(!this.records.length)return;
    const min=[0,1,2].map(i=>Math.min(...this.records.map(r=>r.point[i]))),max=[0,1,2].map(i=>Math.max(...this.records.map(r=>r.point[i])));
    const eligible=this.records.filter(r=>!r.excluded);
    const framed=this.fitMode==='selection'?eligible.filter(r=>r.token.id===this.query||r.token.id===this.key):eligible;
    const fitPoints=(framed.length?framed:eligible).flatMap(r=>this.tiles&&r.token.type!=='text'
      ? [-.5,.5].flatMap(h=>[-.5,.5].map(w=>[r.point[0],r.point[1]+h,r.point[2]+w]))
      : [r.point]);
    const key=JSON.stringify([this.width,this.height,this.fitMode,fitPoints]);
    if(key!==this.fitKey){this.fitted=fitCamera(fitPoints,this.width,this.height,this.yaw,this.pitch);this.fitKey=key;}
    this.center=this.fitted.center;this.offset=this.fitted.offset;this.unit=this.fitted.unit*this.zoom;
    // A quiet reference grid on the lower h plane.
    const extent=Math.max(3,...max.map((v,i)=>v-min[i]));
    const floor=Math.max(max[1]+.8,1),step=Math.max(1,Math.ceil(extent/10));
    for(let i=0;i<=8;i++){
      const s=(i-4)*step;
      this.segment([this.center[0]+s,floor,this.center[2]-4*step],[this.center[0]+s,floor,this.center[2]+4*step],'#284f3210');
      this.segment([this.center[0]-4*step,floor,this.center[2]+s],[this.center[0]+4*step,floor,this.center[2]+s],'#284f3210');
    }
    const origin=min.map(x=>x-.8),axisLength=Math.max(3,extent*.35);
    ['#99681e','#ac583e','#416da5'].forEach((color,axis)=>{
      const end=[...origin];end[axis]+=axisLength;this.segment(origin,end,color,1.3);
      const p=this.project(end);c.fillStyle=color;c.font='10px Consolas, monospace';const label=this.axes?.[axis]||String(axis);if(p.x>=0&&p.x<=this.width&&p.y>=25&&p.y<=this.height)c.fillText(label,Math.max(8,Math.min(this.width-c.measureText(label).width-8,p.x+5)),Math.max(28,Math.min(this.height-12,p.y-6)));
    });
    // Neighbor edges retain original image adjacency, even when geometry bends.
    const byCell=new Map(this.records.filter(r=>r.token.type!=='text').map(r=>[`${r.token.group}:${r.token.f}:${r.token.h}:${r.token.w}`,r]));
    for(const r of this.records){
      if(r.excluded)continue;
      if(r.token.type!=='text'){
        for(const [dh,dw]of[[0,1],[1,0]]){const n=byCell.get(`${r.token.group}:${r.token.f}:${r.token.h+dh}:${r.token.w+dw}`);if(n)this.segment(r.point,n.point,'#42694740',.7);}
      }
    }
    const q=this.records[this.query],k=this.records[this.key];
    if(q&&k&&q!==k&&!q.excluded&&!k.excluded)this.segment(q.point,k.point,'#a4763499',1.4,true);
    if(this.highlight&&q&&!q.excluded){
      const v=this.highlight.vector,norm=Math.hypot(...v),length=Math.max(1,Math.min(3,extent*.3));
      const a=q.point.map((x,i)=>x-v[i]/norm*length),b=q.point.map((x,i)=>x+v[i]/norm*length);
      this.segment(a,b,'#8a48a5',3.5);
      const tip=this.project(b);c.fillStyle='#8a48a5';c.beginPath();c.arc(tip.x,tip.y,4,0,Math.PI*2);c.fill();
    }
    const sorted=this.records.map(r=>({...r,screen:this.project(r.point)})).sort((a,b)=>a.screen.z-b.screen.z);
    const textCount=this.records.filter(r=>r.token.type==='text').length;
    const labels=[];
    for(const record of sorted){
      const {token,screen}=record;const isText=token.type==='text';const selected=token.id===this.query,inspected=token.id===this.key;
      const size=Math.max(4,Math.min(24,this.unit*.82)),p=screen;
      if(p.x < -size||p.x > this.width+size||p.y < -size||p.y > this.height+size)continue;
      c.globalAlpha=record.excluded ? .22 : 1;
      let fill=isText?'#b8873d':token.type==='video'?'#7a8cc6':'#609c87';
      if(isText){
        c.beginPath();c.arc(p.x,p.y,Math.max(4,size*.28),0,Math.PI*2);c.fillStyle=fill;c.fill();
      }else if(this.colorMode==='texture'&&this.textures?.[token.group]?.[token.f]){
        const texture=this.textures[token.group][token.f];const cw=texture.width/token.W,ch=texture.height/token.H;
        if(this.tiles){
          // Orthographic projection makes a patch a parallelogram. Apply the
          // exact affine transform of its h/w plane to the source patch.
          const a=this.project([record.point[0],record.point[1]-.43,record.point[2]-.43]);
          const b=this.project([record.point[0],record.point[1]-.43,record.point[2]+.43]);
          const d=this.project([record.point[0],record.point[1]+.43,record.point[2]-.43]);
          c.save();c.transform(b.x-a.x,b.y-a.y,d.x-a.x,d.y-a.y,a.x,a.y);c.imageSmoothingEnabled=false;c.drawImage(texture,token.w*cw,token.h*ch,cw,ch,0,0,1,1);c.restore();
        }else {c.imageSmoothingEnabled=false;c.drawImage(texture,token.w*cw,token.h*ch,cw,ch,p.x-size/2,p.y-size/2,size,size);}
      }else {c.fillStyle=fill;c.fillRect(p.x-size/2,p.y-size/2,size,size);}
      if(token.id===this.hovered&&!record.excluded){c.strokeStyle='#216c51';c.lineWidth=2;c.setLineDash([3,3]);c.beginPath();c.arc(p.x,p.y,Math.max(12,size*.9),0,Math.PI*2);c.stroke();c.setLineDash([]);}
      if(selected||inspected){c.strokeStyle=selected?'#b17830':'#356aa0';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,Math.max(8,size*.72),0,Math.PI*2);c.stroke();}
      if((selected||inspected)||(isText&&textCount<=12)||(!isText&&token.h===0&&token.w===0)){
        c.font=(selected?'bold ':'')+'10px Consolas, monospace';c.fillStyle=selected?'#875617':inspected?'#2d6293':'#52665c';
        const text=(selected&&inspected?'A/B · ':selected?'A · ':inspected?'B · ':'')+token.label.slice(0,24);
        labels.push({text,priority:selected||inspected?0:isText?1:2,x:p.x,y:p.y,size,color:c.fillStyle});
      }
      c.globalAlpha=1;if(!record.excluded)this.targets.push({id:token.id,x:p.x,y:p.y,radius:Math.max(10,size*.8)});
    }
    // Lay labels out after the geometry; selected tokens get first choice.
    // On narrow screens this prevents a cluster of overlapping patch names.
    const occupied=[];
    c.font='10px Consolas, monospace';
    for(const label of labels.sort((a,b)=>a.priority-b.priority)){
      const width=c.measureText(label.text).width;
      const candidates=[ [label.x+label.size*.6+4,label.y-5], [label.x-width-8,label.y-5], [label.x-width/2,label.y-22], [label.x-width/2,label.y+24] ];
      const point=candidates.map(([x,y])=>[Math.max(10,Math.min(this.width-width-10,x)),Math.max(36,Math.min(this.height-12,y))]).find(([x,y])=>!occupied.some(r=>x<r.x+r.w+4&&x+width+4>r.x&&y-11<r.y+14&&y+3>r.y));
      if(!point)continue;
      const [x,y]=point;
      occupied.push({x,y:y-11,w:width});c.fillStyle=label.color;c.fillText(label.text,x,y);
    }
  }
}
