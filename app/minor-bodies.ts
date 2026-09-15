import {toSceneAxes, type Vector3} from './data/positions';
export type MinorSummary={id:string;name:string;aliases:string[];kind:string;context:string;neo:boolean;pha:boolean;importance:number};
type Field={name:string;title:string;value:string|null;units:string|null;sigma:string|null;ref?:string};
export type MinorBody=MinorSummary & {physical:Field[];orbit:{epochJD:number;frame:string;timeScale:string;elements:Record<string,Field>;solutionDate:string|null;conditionCode:string|null};source:{url:string;retrievedAt:string;sha256:string};boundsAU:[number,number]|null;education:null};
export type MinorPage={records:MinorSummary[];total:number;next:number|null};
export const MINOR_BUDGET={page:32,cache:64,candidates:64,visible:12,labels:1};
export const MINOR_ACCURACY='Illustrative two-body orbit from JPL osculating elements. UTC approximates TDB; perturbations, comet outgassing and light time omitted. No validated error bound; not an impact prediction.';
export const normalizeMinorQuery=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().slice(0,80);
// Bounded LRU; no manifest of every object and no eager physics imports.
export class MinorCatalogue {
 private cache=new Map<string,unknown>();
 constructor(private request:typeof fetch=(...args)=>fetch(...args)){}
 async read<T>(path:string):Promise<T>{
  if(this.cache.has(path)){const v=this.cache.get(path);this.cache.delete(path);this.cache.set(path,v);return v as T;}
  const response=await this.request(`/catalogue/v1/${path}.json`);
  if(response.status===404 && !path.startsWith('objects/'))return {records:[],total:0,next:null} as T;
  if(!response.ok)throw new Error('Catalogue could not be loaded. Please retry.');
  const raw=await response.text();if(raw.length>131072)throw new Error('Catalogue shard exceeds its transfer budget.');
  const value=JSON.parse(raw);if(value.records && value.records.length>MINOR_BUDGET.page)throw new Error('Invalid catalogue page');
  this.cache.set(path,value);while(this.cache.size>MINOR_BUDGET.cache)this.cache.delete(this.cache.keys().next().value!);return value;
 }
 search(query:string,page=0){if(!Number.isSafeInteger(page)||page<0)throw new Error('Invalid cursor');const q=normalizeMinorQuery(query);return this.read<MinorPage>(q?`search/${q.replaceAll(' ','_')}/${page}`:`browse/all/${page}`);}
 browse(category:string,page=0){if(!['all','asteroid','comet','neo','pha','tno'].includes(category)||!Number.isSafeInteger(page)||page<0)throw new Error('Invalid category or cursor');return this.read<MinorPage>(`browse/${category}/${page}`);}
 detail(id:string){if(!/^sb-\d+$/.test(id))throw new Error('Invalid minor-body ID');return this.read<MinorBody>(`objects/${id}`);}
 async nearby(center:Vector3,time:number,radiusAU:number){
  if(!center.every(Number.isFinite)||!Number.isFinite(radiusAU)||radiusAU<=0)throw new Error('Invalid spatial query');
  const r=Math.hypot(...center),low=Math.max(0,r-radiusAU),high=r+radiusAU;
  const candidates=new Map<string,MinorSummary>();let complete=low>=2**-8 && high<=2**13;
  // Conservative perihelion/aphelion shells apply to the fixed ellipse at every phase.
  // First pages only; dense shells explicitly report incomplete, never false completeness.
  for(let shell=-8;shell<=12;shell++)if(low<=2**(shell+1)&&high>=2**shell){
   const page=await this.read<MinorPage>(`shells/${shell}/0`);if(page.next!==null)complete=false;
   for(const record of page.records){if(candidates.size<MINOR_BUDGET.candidates)candidates.set(record.id,record);else complete=false;}
  }
  const found: {body:MinorBody;distanceAU:number}[]=[];
  for(const record of candidates.values()){const body=await this.detail(record.id),p=minorPosition(body,time);if(!p){complete=false;continue;}const distanceAU=Math.hypot(...p.map((v,i)=>v-center[i]));if(distanceAU<=radiusAU)found.push({body,distanceAU});}
  return {results:found.sort((a,b)=>a.distanceAU-b.distanceAU).slice(0,MINOR_BUDGET.page),complete:complete&&found.length<=MINOR_BUDGET.page};
 }
}
export const minorCatalogue=new MinorCatalogue();
// Safeguarded bisection solves high-eccentricity ellipses, including Halley/Hale-Bopp.
export function minorPosition(body:MinorBody,time:number):Vector3|null{
 const get=(name:string)=>{const v=body.orbit.elements[name]?.value;return v==null?NaN:Number(v);};
 const a=get('a'),e=get('e'),i=get('i')*Math.PI/180,w=get('w')*Math.PI/180,node=get('om')*Math.PI/180,n=get('n'),m0=get('ma');
 if(![time,a,e,i,w,node,n,m0,body.orbit.epochJD].every(Number.isFinite)||a<=0||e<0||e>=1||n<=0||body.orbit.frame!=='heliocentric-ecliptic-J2000')return null;
 const days=time/86400000+2440587.5-body.orbit.epochJD;
 const m=((m0+n*days)%360+360)%360*Math.PI/180;
 let lo=0,hi=2*Math.PI;for(let j=0;j<52;j++){const mid=(lo+hi)/2;if(mid-e*Math.sin(mid)<m)lo=mid;else hi=mid;}
 const E=(lo+hi)/2,x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
 return [(Math.cos(w)*Math.cos(node)-Math.sin(w)*Math.sin(node)*Math.cos(i))*x+(-Math.sin(w)*Math.cos(node)-Math.cos(w)*Math.sin(node)*Math.cos(i))*y,(Math.cos(w)*Math.sin(node)+Math.sin(w)*Math.cos(node)*Math.cos(i))*x+(-Math.sin(w)*Math.sin(node)+Math.cos(w)*Math.cos(node)*Math.cos(i))*y,Math.sin(w)*Math.sin(i)*x+Math.cos(w)*Math.sin(i)*y];
}
export function minorScenePosition(body:MinorBody,time:number){const p=minorPosition(body,time);return p?toSceneAxes(p):null;}
// Pixel/horizon policy is presentation-only; selection uses an enlarged marker.
export function minorLOD(distance:number,selected:boolean){if(!Number.isFinite(distance)||distance>1000000)return 'hidden';return selected?'selected':distance<160?'marker':'hidden';}
