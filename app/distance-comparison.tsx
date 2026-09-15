import {AU,formatKm} from './astronomy';
import {getBody} from './data/catalog';
import {calculateDistance} from './data/dynamic';

export type SpacecraftDistance={valueKm:number;atUtcMs:number;note:string};
export type DistanceTarget={value:string;label:string};
export type DistanceComparisonModel={
 fromName:string;toName:string;status:'available'|'unavailable';basis:'simulated-position'|'spacecraft-estimate';
 atUtcMs:number;valueKm?:number;primary?:string;secondary?:string;average?:string;quality?:string;note:string;
};

function displayDistance(km:number){
 const primary=formatKm(km),details:string[]=[];
 if(km>=1e6)details.push(`${Math.round(km).toLocaleString()} km`);
 if(km>=1e7)details.push(`${(km/AU).toLocaleString(undefined,{maximumFractionDigits:4})} AU`);
 return {primary,secondary:details.join(' · ')};
}

function averageOrbitKm(aId:string,bId:string){
 const a=getBody(aId),b=getBody(bId);if(!a||!b)return null;
 const child=a.parentId===b.id?a:b.parentId===a.id?b:null;
 return child?.orbit.semimajorAxisKm.value??null;
}

export function distanceTargets(selectedId:string):DistanceTarget[]{
 const selected=getBody(selectedId),priority=['earth','sun',selected?.parentId,'spacecraft'].filter((id):id is string=>Boolean(id)&&id!==selectedId);
 const remaining=['mercury','venus','earth','moon','mars','jupiter','saturn','uranus','neptune','sun'].filter(id=>id!==selectedId);
 return [...new Set([...priority,...remaining])].map(value=>{
  if(value==='spacecraft')return {value,label:'Spacecraft'};
  const body=getBody(value)!;return {value,label:body.parentId===selectedId||selected?.parentId===value?`${body.name} · parent orbit`:body.name};
 });
}

export function defaultDistanceTarget(selectedId:string){return selectedId==='earth'?'sun':'earth';}

export function buildDistanceComparison(selectedId:string,target:string,time:number,spacecraft?:SpacecraftDistance|null):DistanceComparisonModel{
 const selected=getBody(selectedId),fromName=selected?.name??selectedId;
 if(target==='spacecraft'){
  if(!spacecraft||!Number.isFinite(spacecraft.valueKm))return {fromName,toName:'Spacecraft',status:'unavailable',basis:'spacecraft-estimate',atUtcMs:time,note:'The spacecraft position is not available before the 3D scene starts.'};
  return {fromName,toName:'Spacecraft',status:'available',basis:'spacecraft-estimate',atUtcMs:spacecraft.atUtcMs,valueKm:spacecraft.valueKm,...displayDistance(spacecraft.valueKm),note:spacecraft.note};
 }
 const targetBody=getBody(target),result=calculateDistance(selectedId,target,time),toName=targetBody?.name??target;
 if(result.status==='unavailable')return {fromName,toName,status:'unavailable',basis:'simulated-position',atUtcMs:time,note:result.reason};
 const averageKm=averageOrbitKm(selectedId,target);
 return {fromName,toName,status:'available',basis:'simulated-position',atUtcMs:result.atUtcMs,valueKm:result.value,...displayDistance(result.value),average:averageKm===null?undefined:displayDistance(averageKm).primary,quality:result.quality,note:result.note};
}

export function DistanceComparison({model,selector}:{model:DistanceComparisonModel;selector:React.ReactNode}){
 const iso=new Date(model.atUtcMs).toISOString(),timestamp=iso.replace('.000Z','Z');
 return <section className="distance-calculator" aria-label="Distance comparison">
  <div className="distance-heading"><div><span className="eyebrow">DISTANCE FROM</span><strong>{model.fromName}</strong></div><span aria-hidden="true">→</span>{selector}</div>
  <div className="distance-basis"><span>{model.basis==='simulated-position'?'Simulated position':'Spacecraft estimate'}</span><time dateTime={iso}>{timestamp}</time></div>
  {model.status==='available'?<><output className="distance-result">≈ {model.primary}{model.secondary&&<small>{model.secondary}</small>}</output>
   {model.average&&<div className="distance-average"><span>Average orbital distance</span><strong>{model.average}</strong><small>Semimajor axis of the parent–child orbit; not their separation at this moment.</small></div>}
   <p className="fineprint">{model.note}{model.quality==='illustrative'?' This comparison includes the illustrative lunar position model.':''}</p></>
   :<div className="distance-unavailable"><strong>Distance unavailable</strong><p className="fineprint">{model.note}</p></div>}
 </section>;
}
