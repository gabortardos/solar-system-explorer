import {physical} from './physical';
import {orbits,type OrbitRecord} from './orbits';
import {education} from './education';
import {SOURCES,DATASET_VERSION} from './sources';
import type {Identity,PhysicalProperties,EducationalEntry} from './schema';

export type CatalogBody=Identity & {physical:PhysicalProperties; orbit:OrbitRecord; education:EducationalEntry|null};
const names:Record<string,string>={sun:'Sun',mercury:'Mercury',venus:'Venus',earth:'Earth',moon:'Moon',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',ceres:'Ceres',pluto:'Pluto',phobos:'Phobos',deimos:'Deimos',io:'Io',europa:'Europa',ganymede:'Ganymede',callisto:'Callisto',mimas:'Mimas',enceladus:'Enceladus',tethys:'Tethys',dione:'Dione',rhea:'Rhea',titan:'Titan',iapetus:'Iapetus',miranda:'Miranda',ariel:'Ariel',umbriel:'Umbriel',titania:'Titania',oberon:'Oberon',triton:'Triton',charon:'Charon'};
// Common Latin alternatives and official numbered minor-planet designations.
// Empty arrays are intentional; names are never padded with invented synonyms.
const aliases:Record<string,readonly string[]>={sun:['Sol'],earth:['Terra'],moon:['Luna'],jupiter:['Jove'],ceres:['1 Ceres'],pluto:['134340 Pluto']};
export const catalog:readonly CatalogBody[]=Object.entries(names).map(([id,name])=>({id,name,aliases:aliases[id]??[],
 category:id==='sun'?'star':id==='ceres'||id==='pluto'?'dwarf-planet':orbits[id].parentId==='sun'?'planet':'moon',
 parentId:orbits[id].parentId,physical:physical[id],orbit:orbits[id],education:education[id]??null}));
const byId=new Map(catalog.map(body=>[body.id,body]));
export function getBody(id:string):CatalogBody|undefined{return byId.get(id);}
export const catalogMetadata={schemaVersion:1,datasetVersion:DATASET_VERSION,bodyCount:catalog.length,
 description:'Local reference data; 32 catalogued bodies, 29 scene destinations. Charon, Ceres and Pluto remain information-only. Unavailable fields are explicit. No runtime external API.'};

// Guard imported snapshots at build/test time. Never coerce null into zero.
export function validateCatalog(records:readonly CatalogBody[]=catalog):string[]{
 const errors:string[]=[],ids=new Set(records.map(b=>b.id));
 if(ids.size!==records.length)errors.push('Duplicate body ID');
 const identityKeys=new Map<string,string>();
 for(const b of records)for(const label of [b.name,...b.aliases]){
  const key=label.trim().toLocaleLowerCase(),owner=identityKeys.get(key);
  if(owner&&owner!==b.id)errors.push(`${b.id}: duplicate alias or name with ${owner}`);else identityKeys.set(key,b.id);
 }
 for(const b of records){
  if(b.parentId!==null&&!ids.has(b.parentId))errors.push(`${b.id}: missing parent`);
  if(new Set(b.aliases.map(alias=>alias.toLocaleLowerCase())).size!==b.aliases.length||b.aliases.some(alias=>!alias.trim()))errors.push(`${b.id}: invalid aliases`);
  const ancestors=new Set([b.id]);let parent=b.parentId;
  while(parent){if(ancestors.has(parent)){errors.push(`${b.id}: parent cycle`);break;}ancestors.add(parent);parent=records.find(r=>r.id===parent)?.parentId??null;}
  const fields={...b.physical,periodDays:b.orbit.periodDays,semimajorAxisKm:b.orbit.semimajorAxisKm,eccentricity:b.orbit.eccentricity,inclinationDeg:b.orbit.inclinationDeg,argumentPeriapsisDeg:b.orbit.argumentPeriapsisDeg,meanAnomalyDeg:b.orbit.meanAnomalyDeg,nodeDeg:b.orbit.nodeDeg};
  const units:Record<string,string>={radiusKm:'km',massKg:'kg',gmKm3S2:'km3/s2',gravityMS2:'m/s2',rotationHours:'h',periodDays:'d',semimajorAxisKm:'km',eccentricity:'1',inclinationDeg:'deg',argumentPeriapsisDeg:'deg',meanAnomalyDeg:'deg',nodeDeg:'deg'};
  for(const [key,f] of Object.entries(fields)){
   if(f.unit!==units[key])errors.push(`${b.id}.${key}: wrong unit`);
   if(f.value===null){if(!f.missingReason)errors.push(`${b.id}.${key}: missing reason`);}
   else {
    if(!Number.isFinite(f.value))errors.push(`${b.id}.${key}: nonfinite value`);
    if(!f.sourceIds.length||f.sourceIds.some(id=>!SOURCES[id]))errors.push(`${b.id}.${key}: unresolved source`);
    if(!f.reference)errors.push(`${b.id}.${key}: no source location`);
   }
   if(f.uncertainty!==null&&(!Number.isFinite(f.uncertainty)||f.uncertainty<0))errors.push(`${b.id}.${key}: invalid uncertainty`);
  }
  if(b.physical.radiusKm.value!==null&&b.physical.radiusKm.value<=0)errors.push(`${b.id}: nonpositive radius`);
  if(b.orbit.eccentricity.value!==null&&(b.orbit.eccentricity.value<0||b.orbit.eccentricity.value>=1))errors.push(`${b.id}: unsupported eccentricity`);
  if(b.orbit.periodDays.value!==null&&b.orbit.periodDays.value<=0)errors.push(`${b.id}: nonpositive period`);
  if(b.orbit.parentId!==b.parentId)errors.push(`${b.id}: inconsistent orbit parent`);
  if(b.orbit.sourceIds.some(id=>!SOURCES[id]))errors.push(`${b.id}: unresolved orbit source`);
  if(['jpl-table-1','satellite-mean-elements'].includes(b.orbit.model)&&(!b.orbit.epoch||!Number.isFinite(b.orbit.epoch.jd)||!b.orbit.frame))errors.push(`${b.id}: missing orbit epoch/frame`);
  if(b.orbit.elements&&b.orbit.elements.some(row=>row.length!==6||row.some(v=>!Number.isFinite(v))))errors.push(`${b.id}: invalid elements`);
 }
 return errors;
}
