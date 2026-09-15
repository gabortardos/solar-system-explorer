import {catalog,getBody} from './data/catalog';
import {calculateDistance} from './data/dynamic';
import {SOURCES} from './data/sources';
import {guide} from './data/guide-education';
import type {Quantity} from './data/schema';
import type {GuideContext} from './guide-context';

export type GuideEvidence={id:string;label:string;value:string;quality:string;note:string;sources:{title:string;url:string}[]};
export type GuideResponse={subject:string;atUtcMs:number;explanation:string;evidence:GuideEvidence[];contextNote:string;mode:'local';};
export const GUIDE_LIMITS={questionCharacters:600,evidenceItems:12,nearby:5,paidEnabled:false} as const;
/** Future server-only provider: explanation never owns numbers or source URLs. */
export interface GuideExplanationProvider {
  explain(input:{question:string;subject:string;evidence:GuideEvidence[]},signal:AbortSignal):Promise<{segments:({text:string}|{evidenceId:string})[]}>;
}
/** Fail closed: reject numerical prose, unknown references and oversized output.
 * This is a format guard, not proof of factual entailment; paid use stays disabled. */
export function validateExplanation(value:unknown,evidence:GuideEvidence[]):boolean{
  if(!value||typeof value!=='object'||!('segments' in value)||!Array.isArray(value.segments)||value.segments.length>20)return false;
  return value.segments.every(s=>s&&typeof s==='object'&&
    (Object.keys(s).length===1)&&('evidenceId' in s?typeof s.evidenceId==='string'&&evidence.some(e=>e.id===s.evidenceId):
      typeof s.text==='string'&&s.text.length<=800&&!/[\d０-９]|https?:|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion)\b/i.test(s.text)));
}
export function answerContextGuide(context:GuideContext,question:string):GuideResponse{
  if(!question.trim()||question.length>GUIDE_LIMITS.questionCharacters)throw new Error('Please ask a question of up to 600 characters.');
  const selected=context.selected,q=question.toLowerCase(),evidence:GuideEvidence[]=[];
  let explanation='This local prototype can explain habitability, atmosphere, water, missions, physical facts, modeled distance from Earth, spacecraft location, nearby objects and simulation time. No live LLM is connected.';
  const add=(id:string,label:string,field:Quantity)=>{evidence.push({id,label,value:field.value===null?'Unavailable':`${field.value} ${field.unit}`,quality:field.quality,note:field.value===null?field.missingReason??'Not imported':field.note,sources:field.sourceIds.flatMap(id=>SOURCES[id]?[SOURCES[id]]:[])});};
  const subject=selected?.name??'No selected object';
  const science=selected?getBody(selected.id):undefined;
  const contextNote=`“Here” means ${subject}, the selected object—not a claim that the spacecraft has arrived. ${context.navigation.note}`;
  const named=catalog.filter(b=>b.id!==selected?.id&&b.id!=='earth'&&b.name.toLowerCase()!=='moon'&&new RegExp(`\\b${b.name.toLowerCase()}\\b`).test(q));
  if(named.length)return {subject,atUtcMs:context.navigation.atUtcMs,explanation:`You mentioned ${named.map(b=>b.name).join(', ')} while ${subject} is selected. Please select the world you want to ask about; named-world comparisons are not supported by this local prototype.`,evidence:[],contextNote,mode:'local'};
  if(/nearby|nearest|near me/.test(q)){
    explanation=context.nearbyScope+' Distances are center-to-center and inherit the spacecraft coordinate limitation.';
    context.nearby.forEach(item=>evidence.push({id:`near-${item.id}`,label:item.name,value:`${item.distanceKm.toPrecision(5)} km`,quality:context.navigation.basis==='navigation-estimate'?'navigation-estimate':item.quality,note:'Computed at the captured simulation time.',sources:item.sourceIds.flatMap(id=>SOURCES[id]?[SOURCES[id]]:[])}));
    if(!context.nearby.length)explanation+=' Spacecraft position is unavailable.';
  }else if(/where am i|spacecraft position|my position|location/.test(q)){
    explanation=context.navigation.note;
    evidence.push({id:'craft',label:'Spacecraft coordinates [X, Y, Z]',value:context.navigation.positionAU?context.navigation.positionAU.map(v=>v.toPrecision(6)).join(', ')+' AU':'Unavailable',quality:context.navigation.basis,note:'Heliocentric ecliptic J2000; converted camera coordinates, not a spacecraft ephemeris.',sources:[]});
  }else if(/date|time|when/.test(q)&&!/travel/.test(q)){
    explanation='This is the simulation timestamp captured when you asked, not an observation timestamp.';
  }else if(!selected){explanation='Select an object before asking about “here”.';
  }else if(!science){
    explanation=`${subject} is the selected minor body. Its sourced physical fields are available below; a reviewed habitability or mission explanation has not been imported. No planet answer is substituted.`;
    if('physical' in selected&&Array.isArray(selected.physical))selected.physical.slice(0,12).forEach((f,i)=>evidence.push({id:`minor-${i}`,label:f.title,value:f.value===null?'Unavailable':`${f.value} ${f.units??''}`,quality:'JPL snapshot',note:f.ref??'',sources:[{title:'JPL small-body snapshot',url:context.navigation.selectedMinor!.source.url}]}));
  }else if(/distance|far/.test(q)){
    const d=calculateDistance(science.id,'earth',context.navigation.atUtcMs);
    explanation='Simultaneous modeled center separation from Earth, not a flight path, travel duration or live observation.';
    evidence.push({id:'earth-distance',label:'Distance from Earth',value:d.status==='available'?`${d.value.toPrecision(6)} km`:'Unavailable',quality:d.status==='available'?d.quality:'unavailable',note:d.status==='unavailable'?d.reason:'Earth uses the Earth–Moon barycenter approximation; satellite positions are illustrative.',sources:d.status==='available'?d.sourceIds.flatMap(id=>SOURCES[id]?[SOURCES[id]]:[]):[]});
  }else if(/radius|diameter|size|big|gravity|mass|weigh|rotation|spin|day|year|period|orbit|facts/.test(q)){
    explanation='These values come directly from the local scientific dataset. Missing values remain unavailable; rotation and orbital periods are separate.';
    add('radius','Mean / nominal radius',science.physical.radiusKm);add('gravity','Reference / derived gravity',science.physical.gravityMS2);add('mass','Mass',science.physical.massKg);add('rotation','Sidereal rotation',science.physical.rotationHours);add('period','Orbit period',science.orbit.periodDays);
  }else{
    const topic=/live|life|survive|habit|stand/.test(q)?'habitability':/temperature|hot|cold/.test(q)?'temperature':/water|ice|ocean/.test(q)?'water':/mission|probe/.test(q)?'missions':/moon|ring/.test(q)?'companions':null;
    if(topic){const entry=guide[science.id];explanation=entry?.[topic]??`A reviewed ${topic} answer has not been imported for ${subject}. Please use its available scientific facts; I will not infer habitability from missing data.`;
      if(entry)evidence.push({id:'curated',label:'Curated educational explanation',value:'Legacy-curated; not live or newly verified',quality:'legacy-curated',note:'Numerical prose in this older topic pack is not a structured reference measurement.',sources:science.education?[{title:`NASA ${subject} — further reading`,url:science.education.source}]:[]});
    }else if(/atmosphere|air|breath/.test(q)){explanation=science.education?.atmosphere??'Atmosphere data unavailable.';if(science.education)evidence.push({id:'atmosphere',label:'Educational source',value:science.education.reviewStatus,quality:science.education.reviewStatus,note:'Educational description, not a measured atmospheric profile.',sources:[{title:`NASA ${subject}`,url:science.education.source}]});}
  }
  return {subject,atUtcMs:context.navigation.atUtcMs,explanation,evidence,contextNote,mode:'local'};
}
