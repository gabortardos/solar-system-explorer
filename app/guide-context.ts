import {catalog,getBody} from './data/catalog';
import {calculatePosition,type Vector3} from './data/positions';
import {AU_KM,DATASET_VERSION} from './data/sources';
import type {MinorBody} from './minor-bodies';

export type GuideNavigation = {
  atUtcMs:number; positionAU:Vector3|null;
  basis:'linear-camera'|'navigation-estimate'|'unavailable';
  anchorId:string; note:string; selectedMinor:MinorBody|null;
};
export type GuideContext = ReturnType<typeof buildGuideContext>;
/** Copy a single request-time snapshot; never retain mutable camera references. */
export function buildGuideContext(selectedId:string, navigation:GuideNavigation){
  const selected=navigation.selectedMinor ?? getBody(selectedId) ?? null;
  const valid=Number.isFinite(navigation.atUtcMs);
  const center=navigation.positionAU?.every(Number.isFinite)?navigation.positionAU:null;
  const nearby=valid&&center?catalog.flatMap(body=>{
    const p=calculatePosition(body.id,navigation.atUtcMs);
    return p.status==='available'?[{id:body.id,name:body.name,distanceKm:Math.hypot(...p.value.map((v,i)=>v-center[i]))*AU_KM,quality:p.quality,sourceIds:p.sourceIds}]:[];
  }).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,5):[];
  return structuredClone({schemaVersion:1,datasetVersion:DATASET_VERSION,selected,
    navigation:{...navigation,positionAU:center},nearby,
    nearbyScope:'Nearest five among the core catalogue with available positions; excludes unrequested minor bodies and schematic region dots. Not a complete local census.',
    herePolicy:'Here means the selected object, not the spacecraft location. Selection does not imply arrival.'});
}
