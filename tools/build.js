const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const SRC=process.argv[2],OUT=process.argv[3];
const html=fs.readFileSync(SRC,'utf8');
const m=html.match(/^([\s\S]*?<script>)([\s\S]*?)(<\/script>[\s\S]*)$/);
const js=m[2];
const tmpIn=path.join(__dirname,'_in.js'),tmpOut=path.join(__dirname,'_out.js');
fs.writeFileSync(tmpIn,js);
// keep the internal names the verification harness drives, so the file we test IS the file we ship
const RESERVED='update,draw,flip,reset,loop,pause,resume,st,y,vy,dir,obs,item,pfx,trail,score,dist,lives,inv,storm,shield,best,won,nb,medal,fc,nStar,nItem,nGate,mxCombo,md,lockT,slow,pops,nPerf,nGraze,mult,fadeAt,badges,mute,shake,path,psi,pace,paceRef,bannerT,bTxt,bCol,RANK,MAXS,WIN_DIST';
execFileSync('npx',['terser',tmpIn,'-o',tmpOut,
  '--compress','passes=3,drop_console=true,drop_debugger=true,unsafe_math=true',
  '--mangle','toplevel=true,reserved=['+RESERVED.split(',').map(s=>`'${s}'`).join(',')+']',
  '--format','comments=false'],{shell:true,stdio:'inherit'});
const min=fs.readFileSync(tmpOut,'utf8').trim();
const shell=m[1].replace(/\n\s*/g,'').replace(/;\}/g,'}')+min+m[3].replace(/\n/g,'');
fs.writeFileSync(OUT,shell);
console.log('minified html:',Buffer.byteLength(shell),'bytes  (js',Buffer.byteLength(min),')');
