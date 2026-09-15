import {calculatePosition,type PositionResult} from './positions';
import {AU_KM,LIGHT_KM_S} from './sources';
export type DistanceResult={status:'available';value:number;unit:'km';atUtcMs:number;quality:'approximate'|'illustrative';sourceIds:string[];note:string}|{status:'unavailable';value:null;atUtcMs:number;reason:string};
export function calculateDistance(a:string,b:string,time:number):DistanceResult {
 const p=calculatePosition(a,time),q=calculatePosition(b,time);
 if(p.status==='unavailable')return p;
 if(q.status==='unavailable')return q;
 return {status:'available',value:Math.hypot(...p.value.map((v,i)=>v-q.value[i]))*AU_KM,unit:'km',atUtcMs:time,
 quality:p.quality==='illustrative'||q.quality==='illustrative'?'illustrative':'approximate',sourceIds:[...new Set([...p.sourceIds,...q.sourceIds])],note:'Simultaneous geometric center separation in the stated model; not observed distance or a flight route.'};
}
export function dynamicValues(id:string,time:number):{position:PositionResult;distanceFromSun:DistanceResult;lightTimeFromSunSeconds:number|null;observations:{status:'unavailable';value:null;reason:string}}{
 const distanceFromSun=calculateDistance(id,'sun',time);
 return {position:calculatePosition(id,time),distanceFromSun,lightTimeFromSunSeconds:distanceFromSun.value===null?null:distanceFromSun.value/LIGHT_KM_S,
 observations:{status:'unavailable',value:null,reason:'No live observation dataset is connected. Static facts and simulated positions are not current measurements.'}};
}
