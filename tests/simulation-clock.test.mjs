import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {SimulationClock,SIMULATION_RATES,MAX_SIMULATION_TIME,formatSimulationTime,parseSimulationRate}=await vite.ssrLoadModule('/app/simulation-clock.ts');
const {calculatePosition}=await vite.ssrLoadModule('/app/data/positions.ts');
const start=Date.UTC(2026,8,10,12);

test('offers only the required simulation rates and parses them strictly',()=>{
 assert.deepEqual([...SIMULATION_RATES],[0,1,10,100,1000,86400,2592000]);
 for(const rate of SIMULATION_RATES)assert.equal(parseSimulationRate(String(rate)),rate);
 assert.throws(()=>parseSimulationRate('86401'),RangeError);
 assert.throws(()=>parseSimulationRate('fast'),RangeError);
});

test('advances from a monotonic anchor without jumps when rates change',()=>{
 const clock=new SimulationClock(start,1,100);
 assert.equal(clock.read(1100),start+1000);
 assert.equal(clock.setRate(10,1100),start+1000);
 assert.equal(clock.read(2100),start+11000);
 assert.equal(clock.setRate(0,2100),start+11000);
 assert.equal(clock.read(999999),start+11000);
 assert.equal(clock.setRate(1000,999999),start+11000);
 assert.equal(clock.read(1000999),start+1011000);
});

test('clamps to the validated astronomy interval and formats explicit UTC',()=>{
 const clock=new SimulationClock(MAX_SIMULATION_TIME-500,1000,0);
 assert.equal(clock.read(1000),MAX_SIMULATION_TIME);
 assert.equal(clock.read(Number.NaN),MAX_SIMULATION_TIME-500);
 assert.equal(formatSimulationTime(start),'2026-09-10 12:00:00 UTC');
 assert.equal(formatSimulationTime(Number.NaN),'Time unavailable');
});

test('planet positions move smoothly under accelerated simulated time',()=>{
 const first=calculatePosition('earth',start);
 const second=calculatePosition('earth',start+1000*1000);
 assert.equal(first.status,'available');assert.equal(second.status,'available');
 const delta=Math.hypot(...second.value.map((value,index)=>value-first.value[index]));
 assert.ok(delta>0&&delta<.001,'a 1,000-second simulated step should be small and non-zero');
 assert.deepEqual(first.nominalError,{longitudeArcsec:20,latitudeArcsec:8,distanceKm:6000});
});
test('Moon and major satellites move relative to parents during one simulated day',()=>{
 for(const [id,parent] of [['moon','earth'],['io','jupiter'],['titan','saturn'],['triton','neptune']]){
  const rel=t=>{const p=calculatePosition(id,t).value,c=calculatePosition(parent,t).value;return p.map((v,i)=>v-c[i]);};
  const a=rel(start),b=rel(start+86400000);
  assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))>1e-6,id+' must move around its parent');
 }
 const clock=new SimulationClock(start,86400,0);assert.equal(clock.read(1000),start+86400000);
 const fast=new SimulationClock(start,2592000,0);assert.equal(fast.read(1000),start+2592000000);
});
