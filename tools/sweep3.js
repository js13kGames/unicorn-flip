const fs=require('fs'),path=require('path');
const {variant,eval1}=require('./sweep2.js');
const N=+(process.env.N||40);
const grid=[];
for(const IMP of [2.6,3.0,3.4])
 for(const GRV of [.12,.15,.18])
  for(const GH of [[125,88],[135,96],[145,104]])
   for(const SP of [[2.8,4.2],[3.0,4.8]])
    for(const SPAN of [[240,300],[270,330]])
     grid.push({IMP,GRV,VMAX:5.5,GH0:GH[0],GH1:GH[1],SPD0:SP[0],SPD1:SP[1],SPAN0:SPAN[0],SPAN1:SPAN[1]});
const out=[];const t0=Date.now();
for(const p of grid){const f=variant(p);
  out.push({p,a:eval1(f,4,p,N),b:eval1(f,7,p,N),c:eval1(f,11,p,N),d:eval1(f,15,p,N)});}
console.log('configs',grid.length,'elapsed',((Date.now()-t0)/1000).toFixed(1)+'s\n');
// want: skilled clears, engaged usually clears, casual sees ~60% of the run, very slow sees ~35%
const sc=o=>Math.abs(o.a.clear-1)*4+Math.abs(o.b.clear-.70)*3+Math.abs(o.c.dist/3600-.62)*4+Math.abs(o.d.dist/3600-.34)*3;
out.sort((u,v)=>sc(u)-sc(v));
for(const o of out.slice(0,14)){const p=o.p;
 console.log(`IMP${p.IMP} GRV${p.GRV} GH${p.GH0}>${p.GH1} SPD${p.SPD0}>${p.SPD1} SPAN${p.SPAN0}>${p.SPAN1}`);
 console.log(`   clear: cd4 ${(o.a.clear*100).toFixed(0)}%  cd7 ${(o.b.clear*100).toFixed(0)}%  cd11 ${(o.c.clear*100).toFixed(0)}%  cd15 ${(o.d.clear*100).toFixed(0)}%`);
 console.log(`   dist : cd7 ${(o.b.dist/36).toFixed(0)}%  cd11 ${(o.c.dist/36).toFixed(0)}%  cd15 ${(o.d.dist/36).toFixed(0)}%   | cd11 score ${o.c.score.toFixed(0)} wall/gate ${o.c.wall.toFixed(1)}/${o.c.gate.toFixed(1)}`);}
fs.writeFileSync(path.join(__dirname,'sweep3.json'),JSON.stringify(out));
