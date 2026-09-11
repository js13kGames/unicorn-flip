const {load}=require('./harness.js');
const {makeAI}=require('./sweep2.js');
const F=process.argv[2];
const P_={IMP:3,GRV:.18,VMAX:5.5};
let fail=0;
const ok=(c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m);if(!c)fail++};
const bad=t=>/undefined|NaN|Infinity/.test(t);

console.log('\n[1] fixed timestep: logic steps per second must be 60 at any refresh rate');
for(const hz of [30,50,60,75,100,120,144,165,240]){
  const h=load(F,{seed:7});const P=h.P;P.flip();
  const f0=P.fc,SEC=4;
  for(let i=1;i<=hz*SEC;i++)P.loop(i*1000/hz);
  const rate=(P.fc-f0)/SEC;
  ok(Math.abs(rate-60)<1.2,`${String(hz).padStart(3)}Hz -> ${rate.toFixed(1)} logic steps/s`);
}

console.log('\n[2] tab-away: a huge timestamp jump must not fast-forward the game');
{
  const h=load(F,{seed:7});const P=h.P;P.flip();
  for(let i=1;i<=60;i++)P.loop(i*16.67);
  const before=P.fc;
  P.loop(60*16.67+60000);           // 60 s in one frame
  ok(P.fc-before<=4,`60s jump advanced ${P.fc-before} steps (cap is 4)`);
}

console.log('\n[3] localStorage blocked (sandboxed iframe) must not kill the script');
{
  let threw=null;
  try{const h=load(F,{seed:7,noLocalStorage:true});const P=h.P;
      ok(P.best===0,'best reads as 0 instead of throwing at load');
      P.draw();P.flip();
      for(let i=0;i<400;i++){P.update();P.draw()}
      ok(P.dist>0,'game still runs with storage blocked (dist '+P.dist+')');
  }catch(e){threw=e}
  ok(!threw,'no exception thrown'+(threw?': '+threw.message:''));
}

console.log('\n[4] every screen renders without undefined/NaN text');
{
  const h=load(F,{recordText:true,seed:3});const P=h.P;
  P.draw();                                                   // title
  ok(h.drawn.length>0&&!h.drawn.some(bad),'title: '+JSON.stringify(h.drawn));
  h.drawn.length=0;P.flip();
  const ai=makeAI(P,4,P_.IMP,P_.GRV,P_.VMAX);
  let guard=0;
  while(P.st==='play'&&guard++<6000){ai();P.update();P.draw()}
  ok(P.st==='win','reached the ending (st='+P.st+', dist='+P.dist+')');
  const winTxt=h.drawn.slice(-8);
  ok(!h.drawn.some(bad),'play+win screens clean; win text '+JSON.stringify(winTxt));
  h.drawn.length=0;
  P.flip();                                                   // a mashed tap must NOT skip the ending
  ok(P.st==='win','input locked right after the ending (mashed taps cannot skip it)');
  for(let i=0;i<70;i++){P.update();P.draw()}
  P.flip();
  ok(P.st==='play','tap after the lock resumes play');
  P.st='play';P.y=150;
  guard=0;
  while(P.st==='play'&&guard++<6000){P.update();P.draw()}     // no input -> die
  ok(P.st==='over','falls to game over when abandoned');
  ok(!h.drawn.some(bad),'game-over screen clean: '+JSON.stringify(h.drawn.slice(-5)));
}

console.log('\n[5] NEW BEST must actually appear (it compared score>best after best was updated)');
{
  const h=load(F,{recordText:true,seed:5});const P=h.P;
  P.flip();const ai=makeAI(P,4,P_.IMP,P_.GRV,P_.VMAX);
  let g=0;while(P.st==='play'&&g++<6000){ai();P.update()}
  ok(P.nb===true,'first run flags NEW BEST (nb='+P.nb+', best='+P.best+')');
  ok(h.ls['unicornFlip13k.best']!==undefined&&+h.ls['unicornFlip13k.best']===P.best,'best persisted under namespaced key: '+h.ls['unicornFlip13k.best']);
}

console.log('\n[6] long run: arrays must not grow without bound');
{
  const h=load(F,{seed:9});const P=h.P;
  P.flip();const ai=makeAI(P,4,P_.IMP,P_.GRV,P_.VMAX);
  let g=0,peak=0;
  while(g++<20000){ if(P.st!=='play'){P.flip();P.st='play'} ai();P.update();
    peak=Math.max(peak,P.obs.length+P.item.length+P.pfx.length+P.pops.length+P.trail.length) }
  ok(peak<200,`peak live objects over 20k steps: ${peak} (obs ${P.obs.length}, item ${P.item.length}, pfx ${P.pfx.length}, pops ${P.pops.length}, trail ${P.trail.length})`);
}

console.log('\n[7] gates always stay fully on screen, and every gap is passable');
{
  const h=load(F,{seed:11});const P=h.P;P.flip();
  let minGap=1e9,offscreen=0;
  const ai=makeAI(P,4,P_.IMP,P_.GRV,P_.VMAX);
  for(let i=0;i<20000;i++){ if(P.st!=='play'){P.flip();P.st='play'} ai();P.update();
    for(const o of P.obs){minGap=Math.min(minGap,o.gh);if(o.gy<0||o.gy+o.gh>300)offscreen++} }
  ok(minGap>=66-.01,'narrowest gap ever generated: '+minGap.toFixed(1)+'px (hitbox is 16px)');
  ok(offscreen===0,'gaps clipped off-screen: '+offscreen);
}

console.log('\n[8] keyboard: every CORE-SPEC flip key is wired');
{
  const h=load(F,{seed:1});const P=h.P;
  const kd=h.listeners.keydown[0];
  for(const code of ['Space','ArrowUp','ArrowDown','KeyW','KeyS']){
    const before=P.st;let prevented=false;
    kd({code,preventDefault(){prevented=true}});
    ok(prevented&&P.st!==before||prevented,`${code} handled (preventDefault=${prevented})`);
    if(P.st==='play')break;
  }
  const st0=P.st,d0=P.dir;
  for(const code of ['ArrowUp','ArrowDown','KeyW','KeyS','Space']){
    const d=P.dir;kd({code,preventDefault(){}});
    ok(P.dir===-d,`${code} flips gravity in play`);
  }
  let ignored=true;kd({code:'KeyQ',key:'q',preventDefault(){ignored=false}});
  ok(ignored,'unrelated keys ignored');
  // real-world browsers/input stacks that send an empty e.code must still work
  for(const key of [' ','ArrowUp','ArrowDown','w','s']){
    const d=P.dir;kd({code:'',key,preventDefault(){}});
    ok(P.dir===-d,`e.key="${key}" alone (empty e.code) flips gravity`);
  }
  kd({code:'',key:'p',preventDefault(){}});
  ok(P.st==='pause','e.key="p" alone pauses');
  kd({code:'',key:'Escape',preventDefault(){}});
  ok(P.st==='play','e.key="Escape" alone resumes');
}


console.log('\n[9] pause: freezes the run, shows the rules, and resumes cleanly');
{
  const h=load(F,{recordText:true,seed:4});const P=h.P;
  const kd=h.listeners.keydown[0];
  kd({code:'Space',preventDefault(){}});
  for(let i=0;i<200;i++)P.update();
  const d0=P.dist,f0=P.fc;
  kd({code:'Escape',preventDefault(){}});
  ok(P.st==='pause','ESC pauses');
  for(let i=0;i<120;i++)P.update();
  ok(P.dist===d0&&P.fc===f0,`paused run is frozen (dist ${P.dist} vs ${d0}, fc ${P.fc} vs ${f0})`);
  h.drawn.length=0;P.draw();
  const t=h.drawn.join('|');
  ok(['PAUSED','STAR','GEM','PRISM','HEART','GRAZE','STORM'].every(w=>t.includes(w)),
     'rules panel lists every pickup: '+JSON.stringify(h.drawn.slice(0,8)));
  ok(/resume/.test(t)&&/restart/.test(t)&&/flip gravity/.test(t),'controls shown');
  ok(!h.drawn.some(bad),'pause screen has no undefined/NaN');
  kd({code:'KeyP',preventDefault(){}});
  ok(P.st==='play','P resumes');
  kd({code:'Escape',preventDefault(){}});P.flip();
  ok(P.st==='play','tapping while paused resumes too');
  kd({code:'KeyR',preventDefault(){}});
  ok(P.st==='play'&&P.dist===0&&P.lives===5,'R restarts (dist '+P.dist+', lives '+P.lives+')');
}

console.log('\n[10] result screen carries the run stats');
{
  const h=load(F,{recordText:true,seed:8});const P=h.P;
  P.flip();const ai=makeAI(P,7,P_.IMP,P_.GRV,P_.VMAX);
  let g=0;while(P.st==='play'&&g++<9000){ai();P.update()}
  if(P.st==='win'){for(let i=0;i<70;i++)P.update();P.flip();P.st='play';P.y=150;
    g=0;while(P.st==='play'&&g++<9000){P.update()}}
  ok(P.st==='over','run ended at the result screen');
  ok(P.lives===0,'five lives were all spent (lives='+P.lives+')');
  h.drawn.length=0;
  for(let i=0;i<60;i++)P.update();
  P.draw();
  const t=h.drawn.join('|');
  for(const label of ['STARS','ITEMS','GATES','GRAZES','PERFECT','COMBO','DIST','TIME'])
    ok(t.includes(label),`result shows ${label}`);
  ok(/tap to retry/.test(t),'retry hint appears once the lock expires');
  ok(!h.drawn.some(bad),'result screen clean: '+JSON.stringify(h.drawn));
  ok(P.nStar>=0&&P.nGate>0&&P.md>0,`counters populated (stars ${P.nStar}, items ${P.nItem}, gates ${P.nGate}, grazes ${P.nGraze}, dist ${(P.md/10|0)}m)`);
}


console.log('\n[11] shake settles and the result fades in (it used to shake forever)');
{
  const h=load(F,{seed:2});const P=h.P;
  P.flip();
  let g=0;while(P.st==='play'&&g++<9000)P.update();
  ok(P.st==='over','died with no input');
  const s0=P.shake;
  ok(s0>4,'death kicks the screen (shake='+s0.toFixed(1)+')');
  for(let i=0;i<45;i++)P.update();
  ok(P.shake<0.5,`shake has settled ${45} frames later (${P.shake.toFixed(2)}) — decay used to be skipped on the result screen`);
}

console.log('\n[12] counter stop at 13312 is the true ending');
{
  const h=load(F,{recordText:true,seed:6});const P=h.P;
  P.flip();
  ok(P.MAXS===13312,'target is the js13k byte limit: '+P.MAXS);
  const ai=makeAI(P,4,P_.IMP,P_.GRV,P_.VMAX);
  let g=0;
  while(g++<400000){
    if(P.st==='win'){for(let i=0;i<70;i++)P.update();P.flip();continue}
    if(P.st!=='play')break;
    if(P.lives<5)P.lives=5;            // immortal probe: is the cap reachable at all?
    ai();P.update();
  }
  ok(P.st==='max',`reached the counter stop (st=${P.st}, score=${P.score})`);
  ok(P.score===13312,'score is capped exactly at the limit: '+P.score);
  ok((P.badges&16)!==0,'SIZE LIMIT badge awarded (badges='+P.badges+')');
  h.drawn.length=0;
  for(let i=0;i<100;i++)P.update();
  P.draw();
  const t=h.drawn.join('|');
  ok(/COUNTER STOP/.test(t)&&/13312/.test(t),'counter-stop screen renders: '+JSON.stringify(h.drawn.slice(0,6)));
  ok(!h.drawn.some(bad),'counter-stop screen clean');
  P.flip();
  ok(P.st==='play','tapping the counter-stop screen starts a fresh run');
}

console.log('\n[13] badges and mute persist');
{
  const h=load(F,{seed:3});const P=h.P;
  const kd=h.listeners.keydown[0];
  ok(P.mute===0,'sound on by default');
  kd({code:'KeyM',key:'m',preventDefault(){}});
  ok(P.mute===1,'M mutes');
  ok(h.ls['unicornFlip13k.mute']=='1','mute persisted');
  kd({code:'',key:'m',preventDefault(){}});
  ok(P.mute===0,'M unmutes (e.key path)');
  P.flip();
  let g=0;while(P.st==='play'&&g++<9000){ if(P.st==='win')break; P.update() }
  const h2=load(F,{seed:3});
  ok(typeof h2.P.badges==='number','badges load as a number on a fresh boot');
}


console.log('\n[14] attract mode: the title screen plays itself, and scores nothing');
{
  const h=load(F,{recordText:true,seed:12});const P=h.P;
  ok(P.st==='demo','boots straight into the attract loop');
  const b0=P.badges,best0=P.best;
  let maxDist=0;
  for(let i=0;i<20000;i++){P.update();if(P.dist>maxDist)maxDist=P.dist}
  ok(maxDist>1200,'the demo player survives on its own (best stretch '+maxDist+' frames)');
  ok(P.st==='demo','still in the attract loop after 20k frames (st='+P.st+')');
  ok(P.badges===b0&&P.best===best0,'attract mode awards no badges and no best score');
  ok(h.ls['unicornFlip13k.best']===undefined,'nothing was written to storage');
  h.drawn.length=0;P.draw();
  const t=h.drawn.join('|');
  ok(/UNICORN FLIP/.test(t)&&/ATTRACT MODE/.test(t),'title card draws over the demo');
  ok(!h.drawn.some(bad),'attract screen clean: '+JSON.stringify(h.drawn.slice(0,4)));
  P.flip();
  ok(P.st==='play'&&P.dist===0,'any input drops straight into a real run');
}

console.log('\n[15] flight-path ribbon and pace tracking stay bounded');
{
  const h=load(F,{seed:14});const P=h.P;
  P.flip();const ai=makeAI(P,5,P_.IMP,P_.GRV,P_.VMAX);
  let g=0,peak=0;
  while(g++<40000){
    if(P.st==='win'){for(let i=0;i<70;i++)P.update();P.flip();continue}
    if(P.st!=='play')break;
    if(P.lives<5)P.lives=5;
    ai();P.update();
    peak=Math.max(peak,P.path.length);
  }
  ok(peak<=600,`flight-path samples capped at ${peak} (halves resolution instead of growing)`);
  ok(P.pace.length<=900,`pace samples capped at ${P.pace.length}`);
  ok(P.psi>6,'sample interval widened on a long run (psi='+P.psi+')');
}


console.log('\n[16] the progress meter keeps pointing at a next goal, all the way up');
{
  const h=load(F,{recordText:true,seed:21});const P=h.P;
  P.flip();const ai=makeAI(P,4,P_.IMP,P_.GRV,P_.VMAX);
  ok(P.RANK.length===9,'nine rungs from BRONZE to COUNTER STOP');
  ok(P.RANK[P.RANK.length-1][0]===13312,'the top rung is the size limit');
  const seen=[];let g=0,last='';
  while(g++<200000){
    if(P.st==='win'){for(let i=0;i<70;i++)P.update();P.flip();continue}
    if(P.st!=='play')break;
    if(P.lives<5)P.lives=5;
    ai();P.update();
    if(P.bannerT>0&&P.bTxt&&P.bTxt!=='RAINBOW STORM!'&&P.bTxt!==last){last=P.bTxt;seen.push(P.bTxt)}
  }
  const names=P.RANK.map(r=>r[1]);
  ok(seen.length>=6,`rank banners fired on the way up: ${JSON.stringify(seen)}`);
  ok(seen.every((n,i)=>n===names[i]),'they fired in ladder order, none skipped or repeated');
  ok(seen.includes('ALMOST THERE'),'the run warns you when the counter stop is close');
  ok(P.st==='max','and the ladder ends at the counter stop');
  h.drawn.length=0;
  P.st='play';P.won=true;P.draw();
  ok(!h.drawn.some(bad),'the gauge renders clean in phase 2: '+JSON.stringify(h.drawn.slice(0,4)));
}

console.log(fail?`\n${fail} CHECK(S) FAILED\n`:'\nALL CHECKS PASSED\n');
process.exit(fail?1:0);
