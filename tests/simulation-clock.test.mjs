import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {SimulationClock,SIMULATION_RATES,MAX_SIMULATION_TIME,formatSimulationTime,parseSimulationRate}=await vite.ssrLoadModule('/app/simulation-clock.ts');
const {calculatePosition}=await vite.ssrLoadModule('/app/data/positions.ts');
const start=Date.UTC(2026,8,10,12);

test('offers only the required simulation rates and parses them strictly',()=>{
 assert.deepEqual([...SIMULATION_RATES],[0,1,10,100,1000]);
 for(const rate of SIMULATION_RATES)assert.equal(parseSimulationRate(String(rate)),rate);
 assert.throws(()=>parseSimulationRate('86400'),RangeError);
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
