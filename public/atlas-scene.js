// Orthographic 3D projection with painter's ordering. No external renderer/CDN.
// This displays position indices; it never claims to project hidden embeddings.
export class PositionScene {
  constructor(canvas,{onSelect,onCamera}={}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onSelect=onSelect;this.onCamera=onCamera;
    this.yaw=.65;this.pitch=.45;this.zoom=1;this.records=[];this.targets=[];this.width=800;this.height=480;
    this.pointer=null;this.dragged=false;this.drawPending=false;
    this.resize=new ResizeObserver(()=>this.requestDraw());this.resize.observe(canvas);
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};this.dragged=false;canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{
      if(!this.pointer||e.pointerId!==this.pointer.id)return;
      const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;
      if(Math.hypot(e.clientX-this.pointer.startX,e.clientY-this.pointer.startY)>4)this.dragged=true;
      if(this.dragged){this.yaw+=dx*.008;this.pitch=Math.max(-1.35,Math.min(1.35,this.pitch+dy*.008));this.requestDraw();}
      this.pointer.x=e.clientX;this.pointer.y=e.clientY;
    });
    canvas.addEventListener('pointerup',e=>{
      if(!this.pointer||e.pointerId!==this.pointer.id)return;
      if(!this.dragged){const box=canvas.getBoundingClientRect();const x=e.clientX-box.left,y=e.clientY-box.top;const hit=[...this.targets].reverse().find(p=>Math.hypot(p.x-x,p.y-y)<p.radius);if(hit)this.onSelect?.(hit.id,e.shiftKey);}
      this.pointer=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
      this.onCamera?.();
    });
    canvas.addEventListener('pointercancel',()=>{this.pointer=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(.35,Math.min(5,this.zoom*Math.exp(-e.deltaY*.001)));this.requestDraw();},{passive:false});
    canvas.addEventListener('keydown',e=>{
      const actions={ArrowLeft:()=>this.orbit(-.15,0),ArrowRight:()=>this.orbit(.15,0),ArrowUp:()=>this.orbit(0,-.12),ArrowDown:()=>this.orbit(0,.12),'+':()=>this.zoomBy(1.2),'=':()=>this.zoomBy(1.2),'-':()=>this.zoomBy(1/1.2),'0':()=>this.reset()};
      if(actions[e.key]){e.preventDefault();actions[e.key]();}
    });
  }
  orbit(x,y){this.yaw+=x;this.pitch=Math.max(-1.35,Math.min(1.35,this.pitch+y));this.requestDraw();}
  zoomBy(f){this.zoom=Math.max(.35,Math.min(5,this.zoom*f));this.requestDraw();}
  reset(){this.yaw=.65;this.pitch=.45;this.zoom=1;this.requestDraw();}
  setData(data){Object.assign(this,data);this.requestDraw();}
  requestDraw(){if(this.drawPending)return;this.drawPending=true;requestAnimationFrame(()=>{this.drawPending=false;this.draw();});}
  project(p){
    const a=p.map((v,i)=>v-this.center[i]);
    // World axes are [time, height, width]. Height increases downward.
    const wx=a[2],wy=-a[1],wz=a[0];
    const x=wx*Math.cos(this.yaw)+wz*Math.sin(this.yaw);
    const z=-wx*Math.sin(this.yaw)+wz*Math.cos(this.yaw);
    const y=wy*Math.cos(this.pitch)-z*Math.sin(this.pitch);
    const depth=wy*Math.sin(this.pitch)+z*Math.cos(this.pitch);
    return {x:this.width/2+x*this.unit,y:this.height/2-y*this.unit+5,z:depth};
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
    this.center=min.map((v,i)=>(v+max[i])/2);
    // Fit once to the initial orientation, then retain scale during orbit so
    // rotating does not cause distracting changes in apparent distance.
    const span=Math.max(4,Math.hypot(...max.map((v,i)=>v-min[i])));
    this.unit=Math.min(this.width*.95,this.height*.95)/span*this.zoom;
    // A quiet reference grid on the lower h plane.
    const extent=Math.max(3,...max.map((v,i)=>v-min[i]));
    const floor=Math.max(max[1]+.8,1),step=Math.max(1,Math.ceil(extent/10));
    for(let i=0;i<=8;i++){
      const s=(i-4)*step;
      this.segment([this.center[0]+s,floor,this.center[2]-4*step],[this.center[0]+s,floor,this.center[2]+4*step],'#aecbb910');
      this.segment([this.center[0]-4*step,floor,this.center[2]+s],[this.center[0]+4*step,floor,this.center[2]+s],'#aecbb910');
    }
    const origin=min.map(x=>x-.8),axisLength=Math.max(3,extent*.35);
    ['#f0bd78','#d99371','#91b9ee'].forEach((color,axis)=>{
      const end=[...origin];end[axis]+=axisLength;this.segment(origin,end,color,1.3);
      const p=this.project(end);c.fillStyle=color;c.font='10px Consolas, monospace';c.fillText(this.axes?.[axis]||String(axis),p.x+5,p.y-6);
    });
    // Neighbor edges retain original image adjacency, even when geometry bends.
    const byCell=new Map(this.records.filter(r=>r.token.type!=='text').map(r=>[`${r.token.group}:${r.token.f}:${r.token.h}:${r.token.w}`,r]));
    for(const r of this.records){
      if(r.excluded)continue;
      if(r.token.type!=='text'){
        for(const [dh,dw]of[[0,1],[1,0]]){const n=byCell.get(`${r.token.group}:${r.token.f}:${r.token.h+dh}:${r.token.w+dw}`);if(n)this.segment(r.point,n.point,'#a8d2c235',.7);}
      }
    }
    const q=this.records[this.query],k=this.records[this.key];
    if(q&&k&&q!==k&&!q.excluded&&!k.excluded)this.segment(q.point,k.point,'#f2d99a99',1.4,true);
    const sorted=this.records.map(r=>({...r,screen:this.project(r.point)})).sort((a,b)=>a.screen.z-b.screen.z);
    const maxAttention=Math.max(...(this.attention||[1]),.0001);
    for(const record of sorted){
      const {token,screen}=record;const isText=token.type==='text';const selected=token.id===this.query,inspected=token.id===this.key;
      const size=Math.max(4,Math.min(24,this.unit*.82)),p=screen;
      const weight=this.attention?.[token.id]||0;
      c.globalAlpha=record.excluded ? .22 : 1;
      let fill=isText?'#e8c990':token.type==='video'?'#9caeea':'#78bfaa';
      if(this.colorMode==='attention'){
        const t=weight/maxAttention;
        fill=`rgb(${Math.round(40+205*t)},${Math.round(76+129*t)},${Math.round(66+57*t)})`;
      }
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
      if(selected||inspected){c.strokeStyle=selected?'#ffd186':'#9dc5ff';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,Math.max(8,size*.72),0,Math.PI*2);c.stroke();}
      if((selected||inspected)||(isText&&this.records.length<48)){
        c.font=(selected?'bold ':'')+'10px Consolas, monospace';c.fillStyle=selected?'#ffe2a9':inspected?'#c2dcff':'#c6d9cd';
        const text=(selected?'Q · ':inspected?'K · ':'')+token.label.slice(0,24);
        const textWidth=c.measureText(text).width;
        const right=p.x+size*.6+4;
        const labelX=right+textWidth>this.width-10?p.x-size*.6-4-textWidth:right;
        c.fillText(text,Math.max(10,labelX),Math.max(50,Math.min(this.height-12,p.y-5)));
      }
      c.globalAlpha=1;this.targets.push({id:token.id,x:p.x,y:p.y,radius:Math.max(10,size*.8)});
    }
    // Orientation widget, independent of scene scale or centering.
    const oldCenter=this.center,oldUnit=this.unit,oldWidth=this.width,oldHeight=this.height;
    this.center=[0,0,0];this.unit=23;this.width=100;this.height=oldHeight*2-115;
    ['#f0bd78','#d99371','#91b9ee'].forEach((color,i)=>{const e=[0,0,0];e[i]=1;this.segment([0,0,0],e,color,2);const p=this.project(e);c.fillStyle=color;c.font='9px Consolas';c.fillText(['t','h','w'][i],p.x+3,p.y-3);});
    this.center=oldCenter;this.unit=oldUnit;this.width=oldWidth;this.height=oldHeight;
  }
}
