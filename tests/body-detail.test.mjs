import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {createServer} from 'vite';
import * as THREE from 'three';
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {BodyDetailManager}=await vite.ssrLoadModule('/app/body-detail.ts');
const {DETAIL_BODIES,detailLevel,detailWidth,projectedRadius,textureBytes}=await vite.ssrLoadModule('/app/body-lod.ts');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function harness(mobile=false,fetcher){
 const textures=[],requests=[],scene=new THREE.Scene();
 const load=fetcher??(async(path,signal)=>{requests.push({path,signal});const width=Number(path.match(/-(\d+)\.webp/)?.[1]??1024);const t=new THREE.Texture({width,height:width/2});t.userData.disposed=false;t.addEventListener('dispose',()=>t.userData.disposed=true);textures.push(t);return t;});
 const manager=new BodyDetailManager(mobile,false,4,load);
 const meshes=DETAIL_BODIES.map((id,index)=>{const g=new THREE.Group();g.position.x=index*100;scene.add(g);const m=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshStandardMaterial());g.add(m);manager.register(id,m,1);return m;});
 const camera=new THREE.PerspectiveCamera(43,1,0.01,1000);
 function view(index,distance){camera.position.set(index*100,0,distance);camera.lookAt(index*100,0,0);camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);}
 async function frames(n=12){for(let i=0;i<n;i++){manager.update(camera,800,.15);await settle();}}
 return {manager,meshes,camera,scene,view,frames,textures,requests};
}
test('LOD thresholds have hysteresis and finite near-body projection',()=>{
 assert.equal(detailLevel(66,0),1);assert.equal(detailLevel(50,1),1);assert.equal(detailLevel(44,1),0);
 assert.equal(detailLevel(221,1),2);assert.equal(detailLevel(180,2),2);assert.equal(detailLevel(164,2),1);
 assert.ok(projectedRadius(1,3,43,800)>projectedRadius(1,10,43,800));assert.ok(Number.isFinite(projectedRadius(1,1,43,800)));
 assert.equal(detailWidth('earth',2,true),2048);assert.equal(detailWidth('earth',2,false),4096);
 assert.ok(textureBytes(4096)<45*1024*1024);
});
test('all image tiers exist; Titan has no invented surface map',async()=>{
 for(const id of DETAIL_BODIES.filter(id=>id!=='titan'))for(const width of [512,1024,2048,4096])await access(`public/textures/detail/${id}-${width}.webp`);
 for(const path of ['earth-clouds','earth-night','moon-height'])await access(`public/textures/detail/${path}.webp`);
 await assert.rejects(access('public/textures/detail/titan-4096.webp'));
});
test('loads only visible bodies, fades, evicts old detail and reuses small base',async()=>{
 const h=harness();h.view(0,3);await h.frames();
 assert.equal(h.manager.diagnostics().bodies[0].level,2);assert.ok(h.requests.every(r=>r.path.includes('earth')));
 const old=h.textures.find(t=>t.image.width===4096);assert.ok(old);
 h.view(1,8);await h.frames();assert.equal(old.userData.disposed,true);
 assert.equal(h.manager.diagnostics().bodies[1].level,1);
 assert.ok(h.manager.diagnostics().estimatedTextureBytes<5*1024*1024);
 h.view(0,3);await h.frames();assert.equal(h.requests.filter(r=>r.path.includes('earth-512')).length,1);
 h.manager.dispose();assert.ok(h.textures.every(t=>t.userData.disposed));
});
test('stationary detail load is not cancelled before completion; obsolete loads are aborted',async()=>{
 let pending;const load=async(path,signal)=>{if(path.includes('-512'))return new THREE.Texture({width:512,height:256});return new Promise(resolve=>{pending={signal,resolve};});};
 const h=harness(false,load);h.view(0,3);await h.frames(4);assert.ok(pending);assert.equal(pending.signal.aborted,false);
 h.view(0,100);await h.frames(8);assert.equal(pending.signal.aborted,true);
 const late=new THREE.Texture({width:4096,height:2048});let disposed=false;late.addEventListener('dispose',()=>disposed=true);pending.resolve(late);await settle();assert.equal(disposed,true);h.manager.dispose();
});
test('failed map keeps base and does not retry each animation frame',async()=>{
 let calls=0;const h=harness(false,async(path)=>{calls++;if(path.includes('-512'))return new THREE.Texture({width:512,height:256});throw new Error('fixture unavailable');});
 h.view(0,3);await h.frames(30);assert.equal(calls,2);assert.equal(h.manager.diagnostics().bodies[0].failed,true);h.manager.dispose();
});
test('mobile caps detailed bundles at one, including concurrent visible candidates',async()=>{
 const h=harness(true);h.meshes[1].parent.position.set(1,0,0);h.view(0,3);await h.frames();
 assert.equal(h.manager.diagnostics().bodies.filter(b=>b.level>0||b.loading).length,1);
 assert.ok(h.requests.every(r=>!r.path.includes('4096')));h.manager.dispose();
});
test('Titan stays opaque and texture-free through all detail tiers',async()=>{
 const h=harness();h.view(6,3);await h.frames(); // DETAIL_BODIES order puts Titan at index 6.
 assert.equal(h.manager.diagnostics().bodies[6].level,2);assert.equal(h.requests.length,0);
 assert.equal(h.meshes[6].material.transparent,false);h.manager.dispose();
});
test('tier downgrade fades to base before releasing and replacing detailed geometry',async()=>{
 const h=harness();h.view(0,3);await h.frames();const close=h.meshes[0].geometry;
 h.view(0,8);await h.frames(1);assert.equal(h.meshes[0].geometry,close);
 await h.frames();assert.notEqual(h.meshes[0].geometry,close);assert.equal(h.manager.diagnostics().bodies[0].level,1);h.manager.dispose();
});
test('focused moon retains the mobile detail slot when its larger parent enters the edge of view',async()=>{
 const h=harness(true);h.meshes[1].parent.position.set(.5,0,0);h.view(0,4);
 for(let i=0;i<15;i++){h.manager.update(h.camera,800,.15,'moon');await settle();}
 assert.equal(h.manager.diagnostics().bodies[1].level,2);
 assert.equal(h.manager.diagnostics().bodies[0].level,0);h.manager.dispose();
});
test('desktop keeps at most two simultaneous close bundles and disposes both on teardown',async()=>{
 const h=harness();h.meshes[1].parent.position.set(.7,0,0);h.meshes[2].parent.position.set(-.7,0,0);h.view(0,3);await h.frames();
 assert.equal(h.manager.diagnostics().bodies.filter(b=>b.level||b.loading).length,2);
 assert.ok(h.manager.diagnostics().estimatedTextureBytes<90*1024*1024);
 h.manager.dispose();assert.ok(h.textures.every(t=>t.userData.disposed));
});
test('an auxiliary load failure releases its partially loaded surface texture',async()=>{
 const owned=[];const h=harness(false,async(path)=>{if(path.includes('missing'))throw new Error('fixture failure');const t=new THREE.Texture({width:512,height:256});t.userData.disposed=false;t.addEventListener('dispose',()=>t.userData.disposed=true);owned.push(t);return t;});
 const extra=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshStandardMaterial());const g=new THREE.Group();g.add(extra);h.scene.add(g);h.meshes[0].parent.visible=false;
 h.manager.register('earth',extra,1,[{path:'/missing',apply:()=>{}}]);h.view(0,3);await h.frames();
 assert.ok(owned.some(t=>t.userData.disposed));h.manager.dispose();assert.ok(owned.every(t=>t.userData.disposed));
});
