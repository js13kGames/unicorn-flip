const fs=require('fs'),path=require('path');
const {load}=require('./harness.js');
const SRC=fs.readFileSync(process.argv[2],'utf8');
const TUNE=/const IMP=[^\n]*?SPAN1=[\d.]+;/;
const TMP=path.join(__dirname,'_v2.html');
function variant(p){
  const line=`const IMP=${p.IMP},GRV=${p.GRV},VMAX=${p.VMAX},GH0=${p.GH0},GH1=${p.GH1},SPD0=${p.SPD0},SPD1=${p.SPD1},SPAN0=${p.SPAN0},SPAN1=${p.SPAN1};`;
  fs.writeFileSync(TMP,SRC.replace(TUNE,line));return TMP;
}
// Human model: 1-step lookahead. Simulates "flip now" vs "hold" out to the moment
// the next gate arrives, and picks whichever lands closer to the gap centre.
// `cd` caps how often it may tap, standing in for real thumb speed.
function makeAI(P,cd,IMP,GRV,VMAX){
  let cool=0;
  return ()=>{
    let o=null,bx=1e9;
    for(const g of P.obs)if(!g.p&&g.x>50&&g.x<bx){bx=g.x;o=g}
    const target=o?o.gy+o.gh/2:150;
    const k=o?Math.max(1,Math.min(60,Math.round((o.x-70)/3.6))):18;
    const sim=(flip)=>{
      let y=P.y,vy=P.vy,dir=P.dir,pen=0;
      if(flip){dir=-dir;vy=dir*IMP}
      for(let i=0;i<k;i++){
        vy+=dir*GRV;vy=Math.max(-VMAX,Math.min(VMAX,vy));y+=vy;
        if(y<14){y=14;vy=2.5;pen+=400}
        if(y>286){y=286;vy=-2.5;pen+=400}
      }
      return Math.abs(y-target)+pen;
    };
    if(cool<=0){ if(sim(true)<sim(false)-2){P.flip();cool=cd} }
    if(cool>0)cool--;
  };
}
function run(file,seed,cd,p,maxF){
  const h=load(file,{seed});const P=h.P;
  P.flip();
  const ai=makeAI(P,cd,p.IMP,p.GRV,p.VMAX);
  let wall=0,gate=0,prevL=P.lives;
  for(let f=0;f<maxF;f++){
    if(P.st!=='play')break;
    ai();P.update();
    if(P.lives<prevL){prevL=P.lives;(P.y<=14.001||P.y>=285.999)?wall++:gate++}
  }
  return {won:P.won,dist:P.dist,score:P.score,wall,gate,lives:P.lives};
}
function eval1(file,cd,p,N){
  let win=0,sumD=0,sumS=0,w=0,g=0,sumL=0;
  for(let s=0;s<N;s++){const r=run(file,s,cd,p,4200);if(r.won)win++;sumD+=r.dist;sumS+=r.score;w+=r.wall;g+=r.gate;sumL+=r.lives}
  return {clear:win/N,dist:sumD/N,score:sumS/N,wall:w/N,gate:g/N,lives:sumL/N};
}
module.exports={variant,eval1,run,makeAI};
if(require.main===module){
  const N=+(process.env.N||30);
  const grid=[];
  for(const IMP of [3.2,3.8,4.4])
   for(const GRV of [.16,.20,.24])
    for(const GH of [[120,84],[110,74],[100,66]])
     for(const SP of [[2.8,4.2],[3.0,4.8]])
      for(const SPAN of [[240,300],[210,280]])
       grid.push({IMP,GRV,VMAX:6,GH0:GH[0],GH1:GH[1],SPD0:SP[0],SPD1:SP[1],SPAN0:SPAN[0],SPAN1:SPAN[1]});
  const out=[];const t0=Date.now();
  for(const p of grid){const f=variant(p);
    out.push({p,a:eval1(f,4,p,N),b:eval1(f,7,p,N),c:eval1(f,11,p,N)});}
  console.log('configs',grid.length,'elapsed',((Date.now()-t0)/1000).toFixed(1)+'s\n');
  const sc=o=>Math.abs(o.a.clear-.97)*2+Math.abs(o.b.clear-.65)*3+Math.abs(o.c.clear-.22)*3;
  out.sort((u,v)=>sc(u)-sc(v));
  for(const o of out.slice(0,14)){const p=o.p;
    console.log(`IMP${p.IMP} GRV${p.GRV} GH${p.GH0}>${p.GH1} SPD${p.SPD0}>${p.SPD1} SPAN${p.SPAN0}>${p.SPAN1} | clear cd4 ${(o.a.clear*100).toFixed(0)}% cd7 ${(o.b.clear*100).toFixed(0)}% cd11 ${(o.c.clear*100).toFixed(0)}% | cd11 dist ${o.c.dist.toFixed(0)} score ${o.c.score.toFixed(0)} w/g ${o.c.wall.toFixed(1)}/${o.c.gate.toFixed(1)}`);}
  fs.writeFileSync(path.join(__dirname,'sweep2.json'),JSON.stringify(out));
}
