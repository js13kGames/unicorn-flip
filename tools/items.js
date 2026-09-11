const {load}=require('./harness.js');
const {makeAI}=require('./sweep2.js');
const F=process.argv[2];
const NAME=['STAR','GEM(shield)','PRISM(x2)','HEART(life)'];
// count what a full run actually offers the player
let seen=[0,0,0,0],edge=0,tot=0,runs=25,grazeTiers=[0,0,0];
for(let s=0;s<runs;s++){
  const h=load(F,{seed:s});const P=h.P;
  P.flip();
  const ai=makeAI(P,6,3,.18,5.5);
  const counted=new Set();
  let g=0;
  while(g++<4200){
    if(P.st!=='play'){ if(P.st==='win'){for(let i=0;i<70;i++)P.update();P.flip()} else break }
    ai();P.update();
    for(const t of P.item){ if(!counted.has(t)){counted.add(t);seen[t.k]++;if(t.e)edge++;tot++} }
  }
}
console.log(`items offered across ${runs} full runs (${tot} total, ${(tot/runs).toFixed(1)} per run)\n`);
for(let k=0;k<4;k++)
  console.log(`  ${NAME[k].padEnd(12)} ${String(seen[k]).padStart(4)}   ${(seen[k]/tot*100).toFixed(1).padStart(5)}%   ${(seen[k]/runs).toFixed(1).padStart(5)} per run`);
console.log(`\n  of the stars, ${edge} were ringed edge-line stars (${(edge/seen[0]*100).toFixed(0)}%)`);
