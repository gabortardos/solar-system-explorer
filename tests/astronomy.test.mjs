import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const src=fs.readFileSync(new URL('../app/astronomy.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {bodies,position,distance,EPOCH}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('J2000 Earth barycenter independently known approximate location',()=>{
 const p=position(bodies.find(b=>b.id==='earth'),EPOCH);
 assert.ok(Math.abs(p[0]-(-.17717))<.001);
 assert.ok(Math.abs(p[2]-(-.96721))<.001);
});
test('distance identities and lunar model physical radius',()=>{
 const time=Date.UTC(2026,8,8),earth=bodies.find(b=>b.id==='earth'),moon=bodies.find(b=>b.id==='moon');
 assert.ok(Math.abs(distance(earth,moon,time)-384400)<.0001);
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
