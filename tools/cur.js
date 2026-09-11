const {eval1}=require('./sweep2.js');
const p={IMP:3,GRV:.18,VMAX:5.5,GH0:125,GH1:88,SPD0:3,SPD1:4.8,SPAN0:240,SPAN1:300};
const F=process.argv[2];
for(const [cd,label] of [[4,'skilled  15 taps/s'],[7,'engaged  8.6 taps/s'],[11,'casual   5.5 taps/s'],[15,'slow     4.0 taps/s']]){
  const r=eval1(F,cd,p,80);
  console.log(`${label} | clear ${(r.clear*100).toFixed(0).padStart(3)}% | mean dist ${(r.dist/36).toFixed(0).padStart(3)}% of run | mean score ${r.score.toFixed(0).padStart(4)} | lives left ${r.lives.toFixed(2)}`);
}
