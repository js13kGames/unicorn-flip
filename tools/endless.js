const {load}=require('./harness.js');
const F=process.argv[2];
// two player models: one that flies gap centres, one that hunts the edge line for grazes
function ai(P,cd,edgeOff){
  let cool=0;
  return()=>{
    let o=null,bx=1e9;
    for(const g of P.obs)if(!g.p&&g.x>50&&g.x<bx){bx=g.x;o=g}
    let t=150;
    if(o)t=edgeOff?o.gy+edgeOff:o.gy+o.gh/2;
    const k=o?Math.max(1,Math.min(60,Math.round((o.x-70)/3.6))):18;
    const sim=f=>{let Y=P.y,V=P.vy,D=P.dir,p=0;if(f){D=-D;V=D*3}
      for(let i=0;i<k;i++){V+=D*.18;V=Math.max(-5.5,Math.min(5.5,V));Y+=V;
        if(Y<14){Y=14;V=2.5;p+=400}if(Y>286){Y=286;V=-2.5;p+=400}}
      return Math.abs(Y-t)+p};
    if(cool<=0&&sim(true)<sim(false)-1.5){P.flip();cool=cd}
    if(cool>0)cool--;
  };
}
function endless(seed,cd,edgeOff,cap){
  const h=load(F,{seed});const P=h.P;
  P.flip();
  const a=ai(P,cd,edgeOff);
  let g=0;
  while(g++<cap){
    if(P.st==='win'){for(let i=0;i<70;i++)P.update();P.flip();continue}
    if(P.st!=='play')break;
    a();P.update();
  }
  return {score:P.score,dist:P.dist,graze:P.nGraze,perf:P.nPerf,t:(P.dist/60)|0,st:P.st};
}
const N=+(process.env.N||20),CAP=+(process.env.CAP||60000);
for(const [cd,off,label] of [[4,0,'skilled, centre line'],[4,11,'skilled, edge line (grazes)'],[6,0,'engaged, centre line'],[6,11,'engaged, edge line']]){
  const r=[];
  for(let s=0;s<N;s++)r.push(endless(s,cd,off,CAP));
  const sc=r.map(v=>v.score).sort((a,b)=>a-b);
  const mean=sc.reduce((a,b)=>a+b,0)/N;
  console.log(`${label.padEnd(28)} score  median ${sc[N>>1].toString().padStart(6)}  mean ${mean.toFixed(0).padStart(6)}  max ${sc[N-1].toString().padStart(6)}   time ${(r.reduce((a,v)=>a+v.t,0)/N/60).toFixed(1)}min  grazes ${(r.reduce((a,v)=>a+v.graze,0)/N).toFixed(0)}`);
}
