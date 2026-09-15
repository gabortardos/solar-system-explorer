import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});after(()=>vite.close());
const {MinorCatalogue,minorPosition,minorLOD,MINOR_BUDGET}=await vite.ssrLoadModule('/app/minor-bodies.ts');
let reads=0;
const local=async url=>{reads++;try{return new Response(await fs.readFile('public'+url,'utf8'));}catch{return new Response('',{status:404});}};
const provider=new MinorCatalogue(local);
test('real dataset covers requested classes with provenance and independent physics',async()=>{
 const all=await provider.browse('all');assert.equal(all.total,19);
 for(const category of ['neo','pha','comet','tno'])assert.ok((await provider.browse(category)).total>=3);
 for(const summary of all.records){const b=await provider.detail(summary.id);assert.match(b.source.url,/^https:\/\/ssd-api.jpl.nasa.gov/);assert.equal(b.source.sha256.length,64);assert.equal(b.education,null);const p=minorPosition(b,Date.UTC(2026,8,14));assert.ok(p?.every(Number.isFinite));assert.ok(Math.hypot(...p)>=b.boundsAU[0]-1e-9);assert.ok(Math.hypot(...p)<=b.boundsAU[1]+1e-9);}
});
test('prefix aliases, missing queries, bounded paging and reusable cache',async()=>{
 const r=await provider.search('Bennu');assert.match(r.records[0].name,/Bennu/);assert.equal((await provider.search('99942')).records.length,1);
 const before=reads;await provider.search('Bennu');assert.equal(reads,before);
 assert.equal((await provider.search('invented body')).total,0);assert.throws(()=>provider.detail('../secret'));
 const oversized=new MinorCatalogue(async()=>new Response(JSON.stringify({records:Array(33).fill({})})));await assert.rejects(()=>oversized.search('x'),/Invalid catalogue page/);
});
test('high eccentricity propagation closes after one period and rejects missing elements',async()=>{
 const r=await provider.search('Halley'),b=await provider.detail(r.records[0].id),epoch=(b.orbit.epochJD-2440587.5)*86400000;
 const p=minorPosition(b,epoch),q=minorPosition(b,epoch+360/Number(b.orbit.elements.n.value)*86400000);assert.ok(Math.hypot(...p.map((v,i)=>v-q[i]))<1e-7);
 const missing=structuredClone(b);missing.orbit.elements.ma.value=null;assert.equal(minorPosition(missing,epoch),null);
});
test('conservative spatial selection matches exhaustive sample within radius',async()=>{
 const at=Date.UTC(2026,8,14),center=[1,0,0],radius=1.5;
 const result=await provider.nearby(center,at,radius),all=await provider.browse('all'),expected=[];
 for(const r of all.records){const p=minorPosition(await provider.detail(r.id),at);if(Math.hypot(...p.map((v,i)=>v-center[i]))<=radius)expected.push(r.id);}
 assert.deepEqual(result.results.map(r=>r.body.id).sort(),expected.sort());
 assert.equal(minorLOD(200,false),'hidden');assert.equal(minorLOD(200,true),'selected');assert.ok(MINOR_BUDGET.visible<19);
});
