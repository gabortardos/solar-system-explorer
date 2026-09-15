import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import * as THREE from 'three';

const vite = await createServer({configFile:false, appType:'custom', server:{middlewareMode:true,hmr:false}});
after(() => vite.close());
const scale = await vite.ssrLoadModule('/app/scale.ts');
const {withRenderOrigin,worldLineGeometry,worldPointGeometry} = await vite.ssrLoadModule('/app/render-space.ts');
const {bodies,position,distance,AU} = await vite.ssrLoadModule('/app/astronomy.ts');

test('scientific center distances retain physical ratios for every current body pair', () => {
  const time=Date.UTC(2026,8,9);
  for(const a of bodies) for(const b of bodies) {
    const p=scale.projectPosition(position(a,time),'scientific');
    const q=scale.projectPosition(position(b,time),'scientific');
    const displayed=Math.hypot(...p.map((v,i)=>v-q[i]));
    assert.ok(Math.abs(displayed/100*AU-distance(a,b,time))<.00001);
  }
});

test('exploration compression is continuous, directional, monotonic and finite', () => {
  let last=-1;
  for(const r of [0,1e-12,1e-8,.001,.05,.387,1,30,1000,1e6,1e9]) {
    const p=scale.projectPosition([r,0,0],'exploration');
    assert.ok(Number.isFinite(p[0]) && p[0]>last);
    assert.equal(p[1],0); assert.equal(p[2],0); last=p[0];
  }
  assert.ok(scale.projectPosition([1e-12,0,0],'exploration')[0]<1e-8);
  assert.throws(()=>scale.projectPosition([NaN,0,0],'scientific'));
});

test('satellite hierarchy preserves physical separation in science and local visibility in exploration', () => {
  const offset=[384400/AU,0,0],parent=[30,0,0];
  for(const mode of ['scientific','exploration']) {
    const p=scale.projectSatellite(parent,offset,mode,5/offset[0]);
    const e=scale.projectPosition(parent,mode);
    assert.ok(Math.abs(p[0]-e[0]-(mode==='scientific'?offset[0]*100:5))<1e-10);
  }
});

test('multi-moon exploration compression preserves direction and radial order',()=>{
 const parent=[5,0,0],max=4/1000;
 const inner=scale.projectSatelliteSystem(parent,[1/1000,0,0],'exploration',20,max);
 const outer=scale.projectSatelliteSystem(parent,[4/1000,0,0],'exploration',20,max);
 const center=scale.projectPosition(parent,'exploration');
 assert.ok(inner[0]>center[0]&&outer[0]>inner[0]);
 assert.ok(Math.abs(outer[0]-center[0]-20)<1e-10);
 const scientific=scale.projectSatelliteSystem(parent,[1/1000,0,0],'scientific',20,max);
 assert.ok(Math.abs(scientific[0]-scale.projectPosition(parent,'scientific')[0]-.1)<1e-10);
});

test('a million coordinate records subtract in doubles before bounded Float32 uploads', () => {
  // Synthetic math workload only; this does not claim a million rendered meshes.
  const tile=new Float64Array(3*4096),output=new Float32Array(tile.length);
  let processed=0;
  for(let batch=0;batch<245;batch++) {
    for(let i=0;i<4096;i++){tile[i*3]=1e9+i*.01;tile[i*3+1]=-1e9;tile[i*3+2]=1e9;}
    processed+=scale.writeRelativePositions(tile,[1e9,-1e9,1e9],output);
    assert.ok(Math.abs(output[3]-.01)<1e-7);
    assert.equal(output[4],0);
  }
  assert.ok(processed>=1e6);
  assert.equal(Math.fround(1e9+.01)-Math.fround(1e9),0,'absolute Float32 loses the same offset');
});

test('camera-relative snapshot preserves navigation, sunlight and double line detail', () => {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
  const body=new THREE.Group(),sun=new THREE.PointLight(),uniform=new THREE.Vector3();
  body.position.set(1e9+.01,2,3);camera.position.set(1e9,2,3);scene.add(body,sun);
  const line=new THREE.Line(worldLineGeometry([new THREE.Vector3(1e9,2,3),new THREE.Vector3(1e9+.01,2,3)]));
  line.userData.absoluteLine=true;scene.add(line);
  const before=body.position.clone();
  for(let i=0;i<100;i++)withRenderOrigin(scene,camera,uniform,()=>{
    assert.equal(camera.position.length(),0);
    assert.ok(Math.abs(body.position.x-.01)<1e-7);
    assert.equal(uniform.x,-1e9);assert.equal(sun.position.x,-1e9);
    assert.ok(Math.abs(line.geometry.attributes.position.getX(1)-.01)<1e-7);
  });
  assert.deepEqual(body.position,before);assert.equal(camera.position.x,1e9);
  assert.throws(()=>withRenderOrigin(scene,camera,uniform,()=>{throw Error('render failed');}));
  assert.deepEqual(body.position,before);assert.equal(camera.position.x,1e9);assert.equal(uniform.length(),0);
});

test('camera-relative snapshot preserves double-precision population point detail',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),uniform=new THREE.Vector3();
  camera.position.set(1e9,0,0);
  const points=new THREE.Points(worldPointGeometry(new Float64Array([1e9,0,0,1e9+.01,0,0])));
  points.userData.absoluteLine=true;scene.add(points);
  withRenderOrigin(scene,camera,uniform,()=>{
    assert.equal(points.position.x,0);
    assert.ok(Math.abs(points.geometry.attributes.position.getX(1)-.01)<1e-7);
  });
  assert.equal(camera.position.x,1e9);
});

test('clipping supports close-up scientific Moon and large-distance travel without an infinite far plane', () => {
  for(const clearance of [.0001,.003,1,1e6])for(const extent of [10,3000,1e6,1e12]) {
    const {near,far}=scale.clippingRange(clearance,extent);
    assert.ok(near>0 && far>near && far<=scale.MAX_RENDER_DISTANCE);
    assert.ok(near<=Math.max(.0001,clearance));
  }
});

test('body display size is explicitly independent of scientific radius data', () => {
  for(const b of bodies) {
    const km=b.radius;
    assert.equal(scale.displayRadius(km,b.id==='sun','scientific'),scale.displayRadius(km,b.id==='sun','exploration')*.05);
    assert.equal(b.radius,km);
  }
});

test('spacecraft distance conversion is exact in scientific mode and locally anchored in exploration mode',()=>{
  const exact=scale.estimateSpacecraftPosition([150,20,-30],[1,0,0],[100,0,0],6371,1,'scientific',AU);
  assert.deepEqual(exact,[1.5,.2,-.3]);
  const local=scale.estimateSpacecraftPosition([12,0,0],[1,0,0],[10,0,0],6371,2,'exploration',AU);
  assert.ok(Math.abs(local[0]-(1+6371/AU))<1e-12);assert.equal(local[1],0);
  assert.throws(()=>scale.estimateSpacecraftPosition([0,0,0],[0,0,0],[0,0,0],0,1,'exploration',AU));
});
