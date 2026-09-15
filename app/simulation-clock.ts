import {MODEL_END,MODEL_START} from './data/positions';

export const SIMULATION_RATES=[0,1,10,100,1000] as const;
export type SimulationRate=(typeof SIMULATION_RATES)[number];
export const MAX_SIMULATION_TIME=MODEL_END-1;

export function isSimulationRate(value:number):value is SimulationRate {
 return SIMULATION_RATES.includes(value as SimulationRate);
}
export function parseSimulationRate(value:string):SimulationRate {
 const rate=Number(value);
 if(!isSimulationRate(rate))throw new RangeError(`Unsupported simulation rate: ${value}`);
 return rate;
}
export function formatSimulationTime(time:number):string {
 if(!Number.isFinite(time))return 'Time unavailable';
 return new Date(time).toISOString().replace('T',' ').slice(0,19)+' UTC';
}

// The simulation time is anchored to a monotonic browser timestamp. This avoids
// accumulating frame-rounding error, and changing speed never jumps the clock.
export class SimulationClock {
 private anchorSimulationMs:number;
 private anchorMonotonicMs:number;
 private rate:SimulationRate;
 constructor(simulationMs:number,rate:SimulationRate,monotonicMs:number){
  if(!Number.isFinite(simulationMs)||!Number.isFinite(monotonicMs))throw new RangeError('Invalid clock anchor');
  this.anchorSimulationMs=Math.min(MAX_SIMULATION_TIME,Math.max(MODEL_START,simulationMs));
  this.anchorMonotonicMs=monotonicMs;
  this.rate=rate;
 }
 read(monotonicMs:number):number {
  if(!Number.isFinite(monotonicMs))return this.anchorSimulationMs;
  const elapsed=Math.max(0,monotonicMs-this.anchorMonotonicMs);
  return Math.min(MAX_SIMULATION_TIME,this.anchorSimulationMs+elapsed*this.rate);
 }
 setRate(rate:SimulationRate,monotonicMs:number):number {
  const settled=this.read(monotonicMs);
  this.anchorSimulationMs=settled;
  this.anchorMonotonicMs=monotonicMs;
  this.rate=rate;
  return settled;
 }
 getRate():SimulationRate{return this.rate;}
}
