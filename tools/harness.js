// Load a UNICORN FLIP html, stub the browser, expose internals. No jsdom.
const fs=require('fs');

function mkCtx(rec){
  const g={addColorStop(){}};
  const noop=()=>{};
  return {
    save:noop,restore:noop,translate:noop,rotate:noop,scale:noop,
    beginPath:noop,closePath:noop,moveTo:noop,lineTo:noop,
    arc:noop,ellipse:noop,rect:noop,fill:noop,stroke:noop,clip:noop,
    fillRect:noop,strokeRect:noop,clearRect:noop,
    createLinearGradient:()=>g,createRadialGradient:()=>g,
    measureText:()=>({width:10}),
    fillText:(t)=>{if(rec)rec.push(String(t))},
    strokeText:noop,drawImage:noop,setTransform:noop,
    fillStyle:'',strokeStyle:'',lineWidth:1,font:'',textAlign:'',textBaseline:'',globalAlpha:1
  };
}

// deterministic PRNG so runs are reproducible
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function load(file,opts={}){
  const html=fs.readFileSync(file,'utf8');
  const m=html.match(/<script>([\s\S]*?)<\/script>/);
  if(!m)throw new Error('no <script> in '+file);
  const drawn=[];
  const listeners={};
  const timers=[];
  let rafCbs=[];
  const canvas={width:480,height:300,style:{},getContext:()=>mkCtx(opts.recordText?drawn:null)};
  const ls={};
  const env={
    document:{getElementById:()=>canvas,createElement:()=>canvas,body:{appendChild(){}}},
    innerWidth:960,innerHeight:600,
    addEventListener:(k,f)=>{(listeners[k]=listeners[k]||[]).push(f)},
    removeEventListener:()=>{},
    localStorage:opts.noLocalStorage?new Proxy({},{get(){throw new Error('blocked')},set(){throw new Error('blocked')}}):ls,
    setInterval:(f,ms)=>{timers.push(f);return timers.length},
    clearInterval:()=>{},
    requestAnimationFrame:(f)=>{rafCbs.push(f);return rafCbs.length},
    performance:{now:()=>0},
    AudioContext:function(){return {state:'running',currentTime:0,destination:{},resume(){},
      createOscillator:()=>({type:'',frequency:{value:0},connect(){},start(){},stop(){}}),
      createGain:()=>({gain:{value:0,exponentialRampToValueAtTime(){},setValueAtTime(){}},connect(){}})}},
    onresize:null,onload:null,
    Math:Object.create(Math)
  };
  env.window=env;
  env.self=env;
  env.Math.random=mulberry32(opts.seed==null?12345:opts.seed);

  const probe=`
;globalThis.__P={
 get st(){return st},set st(v){st=v},
 get y(){return y},set y(v){y=v},
 get vy(){return vy},get dir(){return dir},set dir(v){dir=v},
 get obs(){return obs},get item(){return item},get pfx(){return pfx},get trail(){return trail},
 get score(){return score},get dist(){return dist},get lives(){return lives},set lives(v){lives=v},get inv(){return inv},
 get storm(){return storm},get shield(){return shield},get best(){return best},get won(){return won},set won(v){won=v},
 get nb(){return nb},get medal(){return medal},get fc(){return fc},
 get nStar(){return nStar},get nGate(){return nGate},
 get mxCombo(){return mxCombo},get md(){return md},get lockT(){return lockT},
 get slow(){return slow},get shake(){return shake},get bannerT(){return bannerT},get bTxt(){return bTxt},get RANK(){return RANK},get path(){return path},get psi(){return psi},get pace(){return pace},get paceRef(){return paceRef},get badges(){return badges},get mute(){return mute},get MAXS(){return MAXS},get pops(){return pops},get nPerf(){return nPerf},get nGraze(){return nGraze},get nItem(){return nItem},get mult(){return mult},
 get slow(){return slow},get shake(){return shake},get bannerT(){return bannerT},get bTxt(){return bTxt},get RANK(){return RANK},get path(){return path},get psi(){return psi},get pace(){return pace},get paceRef(){return paceRef},get badges(){return badges},get mute(){return mute},get MAXS(){return MAXS},get pops(){return pops},get nPerf(){return nPerf},get nGraze(){return nGraze},
 update,draw,flip,reset,loop,pause,resume,WIN_DIST
};`;
  const keys=Object.keys(env);
  const fn=new Function(...keys,'"use strict";'+m[1]+probe);
  fn(...keys.map(k=>env[k]));
  const P=globalThis.__P;
  return {P,env,listeners,timers,drawn,rafCbs:()=>rafCbs,resetRaf:()=>{rafCbs=[]},ls,canvas};
}
module.exports={load,mkCtx,mulberry32};
