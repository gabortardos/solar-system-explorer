import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {bodies,position,distance,EPOCH}=await vite.ssrLoadModule('/app/astronomy.ts');
test('J2000 Earth barycenter independently known approximate location',()=>{
 const p=position(bodies.find(b=>b.id==='earth'),EPOCH);
 assert.ok(Math.abs(p[0]-(-.17717))<.001);
 assert.ok(Math.abs(p[2]-(-.96721))<.001);
});
test('distance identities and sourced lunar ellipse bounds',()=>{
 const time=Date.UTC(2026,8,8),earth=bodies.find(b=>b.id==='earth'),moon=bodies.find(b=>b.id==='moon');
 const km=distance(earth,moon,time);
 assert.ok(km>=384400*(1-.0554)&&km<=384400*(1+.0554));
 assert.ok(Math.abs(km-384400)>1,'the Moon no longer follows a constant-radius circle');
 for(const a of bodies)for(const b of bodies){assert.equal(distance(a,b,time),distance(b,a,time));assert.ok(Number.isFinite(distance(a,b,time)));}
 assert.equal(distance(earth,earth,time),0);
});
test('planets remain within physical perihelion and aphelion bounds',()=>{
 for(const b of bodies.filter(b=>b.elements)){
 const [a,e]=b.elements[0];
 for(const year of [2000,2026,2049]){
 const r=Math.hypot(...position(b,Date.UTC(year,8,8)));
 assert.ok(r>a*(1-e)*.999 && r<a*(1+e)*1.001,b.id);
 }
 }
});
