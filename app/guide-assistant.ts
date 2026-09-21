import {catalog,getBody,type CatalogBody} from './data/catalog';
import {calculateDistance} from './data/dynamic';
import {calculatePosition} from './data/positions';
import {AU_KM,SOURCES} from './data/sources';
import {guide} from './data/guide-education';
import type {Quantity} from './data/schema';
import type {GuideContext} from './guide-context';

export type GuideEvidence={id:string;label:string;value:string;quality:string;note:string;sources:{title:string;url:string}[]};
export type GuideResolution={selectedId:string|null;subjectId:string|null;subjectName:string;comparisonId:string|null;interpretation:string};
export type GuideResponse={subject:string;atUtcMs:number;explanation:string;evidence:GuideEvidence[];contextNote:string;mode:'local'|'live';resolution:GuideResolution;model?:string;fallbackReason?:string};
export const GUIDE_LIMITS={questionCharacters:600,evidenceItems:12,nearby:5,paidEnabled:true} as const;
export type ExplanationSegments={segments:({text:string}|{evidenceId:string})[]};

export interface GuideExplanationProvider {
  explain(input:{question:string;subject:string;evidence:GuideEvidence[]},signal:AbortSignal):Promise<ExplanationSegments>;
}

/** Reject numerical prose, URLs, unknown evidence references and oversized output. */
export function validateExplanation(value:unknown,evidence:GuideEvidence[]):value is ExplanationSegments{
  if(!value||typeof value!=='object'||!('segments' in value)||!Array.isArray(value.segments)||value.segments.length<1||value.segments.length>20)return false;
  return value.segments.every(s=>s&&typeof s==='object'&&Object.keys(s).length===1&&
    ('evidenceId' in s?typeof s.evidenceId==='string'&&evidence.some(e=>e.id===s.evidenceId):
      'text' in s&&typeof s.text==='string'&&s.text.length<=800&&!/[\d０-９]|https?:|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion)\b/i.test(s.text)));
}

export function renderExplanationSegments(value:ExplanationSegments,evidence:GuideEvidence[]):string{
  const byId=new Map(evidence.map(item=>[item.id,item]));
  return value.segments.map(segment=>{
    if('text' in segment)return segment.text.trim();
    const item=byId.get(segment.evidenceId);
    return item?`${item.label}: ${item.value}.`:'';
  }).filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
}

function escapeRegex(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function mentionedBodies(question:string):CatalogBody[]{
  const q=question.toLocaleLowerCase();
  return catalog.filter(body=>{
    const labels=[body.name,...body.aliases].filter(label=>body.id!=='moon'||label.toLocaleLowerCase()!=='moon'||/\b(?:the|earth(?:'s|’s)) moon\b/i.test(question));
    return labels.some(label=>new RegExp(`\\b${escapeRegex(label.toLocaleLowerCase())}\\b`,'i').test(q));
  });
}

export function resolveGuideReferences(context:GuideContext,question:string):GuideResolution{
  const selected=context.selected&&'id' in context.selected?getBody(context.selected.id)??null:null;
  const q=question.toLocaleLowerCase();
  const named=mentionedBodies(question);
  const comparisonIntent=/\b(compare|comparison|versus|vs\.?|than)\b|how does .* compare/.test(q);
  const planetReference=/\b(?:this|that) planet\b/.test(q);
  const moonReference=/\b(?:this|that) moon\b/.test(q);
  let subject=selected;
  let unresolved:string|null=null;

  if(planetReference&&selected?.category==='moon')subject=getBody(selected.parentId??'')??selected;
  if(moonReference&&selected?.category!=='moon'){
    const namedMoon=named.find(body=>body.category==='moon');
    const children=selected?catalog.filter(body=>body.category==='moon'&&body.parentId===selected.id):[];
    if(namedMoon)subject=namedMoon;
    else if(children.length===1)subject=children[0];
    else unresolved='The moon reference is ambiguous for the selected object.';
  }

  if(!comparisonIntent&&named.length===1&&!/\b(here|this|that|it)\b/.test(q)&&!/distance|far/.test(q))subject=named[0];
  if(comparisonIntent&&named.length>=2&&!named.some(body=>body.id===subject?.id))subject=named[0];

  let comparison:CatalogBody|null=null;
  if(comparisonIntent){
    comparison=named.find(body=>body.id!==subject?.id)??null;
    if(!comparison&&subject?.id!=='earth'&&/\bearth\b/.test(q))comparison=getBody('earth')??null;
    if(!comparison)unresolved='The comparison object could not be resolved from the question.';
  }

  const subjectName=subject?.name??(context.selected?.name??'No selected object');
  const interpretation=unresolved??(comparison?
    `The selected scene context resolves the question to ${subjectName}, compared with ${comparison.name}.`:
    planetReference?`“${/that planet/.test(q)?'That':'This'} planet” resolves to ${subjectName} from the selected scene context.`:
    moonReference?`“${/that moon/.test(q)?'That':'This'} moon” resolves to ${subjectName} from the selected scene context.`:
    /\bhere\b/.test(q)?`“Here” resolves to ${subjectName}, the selected object; it does not claim the spacecraft has arrived.`:
    `The question resolves to ${subjectName}, the selected object.`);
  return {selectedId:selected?.id??null,subjectId:subject?.id??null,subjectName,comparisonId:comparison?.id??null,interpretation};
}

function sourceList(ids:string[]){return ids.flatMap(id=>SOURCES[id]?[SOURCES[id]]:[]).map(({title,url})=>({title,url}));}
function quantityEvidence(id:string,label:string,field:Quantity):GuideEvidence{
  return {id,label,value:field.value===null?'Unavailable':`${field.value} ${field.unit}`,quality:field.value===null?'unavailable':field.quality,note:field.value===null?field.missingReason??'Not imported':field.note,sources:sourceList(field.sourceIds)};
}
function educationEvidence(id:string,label:string,value:string,body:CatalogBody):GuideEvidence{
  return {id,label,value,quality:body.education?.reviewStatus??'legacy-curated',note:body.education?.reviewedAt?`Reviewed ${body.education.reviewedAt}.`:'Retained educational summary; not a live observation.',sources:body.education?[{title:`NASA ${body.name}`,url:body.education.source}]:[]};
}
function addPhysicalEvidence(evidence:GuideEvidence[],body:CatalogBody,prefix=''){
  const id=(field:string)=>prefix?`${prefix}-${field}`:field;
  evidence.push(quantityEvidence(id('radius'),`${body.name} radius`,body.physical.radiusKm),quantityEvidence(id('gravity'),`${body.name} gravity`,body.physical.gravityMS2),quantityEvidence(id('mass'),`${body.name} mass`,body.physical.massKg),quantityEvidence(id('rotation'),`${body.name} rotation`,body.physical.rotationHours),quantityEvidence(id('period'),`${body.name} orbital period`,body.orbit.periodDays));
}

export function answerContextGuide(context:GuideContext,question:string):GuideResponse{
  if(!question.trim()||question.length>GUIDE_LIMITS.questionCharacters)throw new Error('Please ask a question of up to 600 characters.');
  const q=question.toLocaleLowerCase();
  const resolution=resolveGuideReferences(context,question);
  const subject=resolution.subjectId?getBody(resolution.subjectId):undefined;
  const comparison=resolution.comparisonId?getBody(resolution.comparisonId):undefined;
  const evidence:GuideEvidence[]=[];
  let explanation='This guide can explain habitability, atmosphere, water, missions, physical facts, modeled distances, spacecraft location, nearby objects and simulation time.';
  const contextNote=`${resolution.interpretation} ${context.navigation.note}`;

  if(/nearby|nearest|near me/.test(q)){
    explanation=context.nearbyScope+' Distances are center-to-center and inherit the spacecraft coordinate limitation.';
    context.nearby.forEach(item=>evidence.push({id:`near-${item.id}`,label:item.name,value:`${item.distanceKm.toPrecision(5)} km`,quality:context.navigation.basis==='navigation-estimate'?'navigation-estimate':item.quality,note:'Computed at the captured simulation time.',sources:sourceList(item.sourceIds)}));
    if(!context.nearby.length)explanation+=' Spacecraft position is unavailable.';
  }else if(/where am i|spacecraft position|my position|location/.test(q)&&!/distance|far/.test(q)){
    explanation=context.navigation.note;
    evidence.push({id:'craft',label:'Spacecraft coordinates [X, Y, Z]',value:context.navigation.positionAU?context.navigation.positionAU.map(v=>v.toPrecision(6)).join(', ')+' AU':'Unavailable',quality:context.navigation.basis,note:'Heliocentric ecliptic J2000; converted camera coordinates, not a spacecraft ephemeris.',sources:[]});
  }else if(/date|time|when/.test(q)&&!/travel/.test(q)){
    explanation='This is the simulation timestamp captured when you asked, not an observation timestamp.';
  }else if(!subject&&context.navigation.selectedMinor){
    const minor=context.navigation.selectedMinor;
    explanation=`${minor.name} is the selected minor body. Its sourced physical fields are shown where available. No planet answer is substituted.`;
    minor.physical.slice(0,GUIDE_LIMITS.evidenceItems).forEach((field,index)=>evidence.push({id:`minor-${index}`,label:field.title,value:field.value===null?'Unavailable':`${field.value} ${field.units??''}`,quality:'JPL snapshot',note:field.ref??'',sources:[{title:'JPL small-body snapshot',url:minor.source.url}]}));
  }else if(!subject){
    explanation='Select an object before asking about “here”.';
  }else if(resolution.interpretation.startsWith('The moon reference is ambiguous')||resolution.interpretation.startsWith('The comparison object could not')){
    explanation=resolution.interpretation;
  }else if(comparison){
    explanation=`This comparison uses the same local structured fields for ${subject.name} and ${comparison.name}. Unavailable values stay unavailable.`;
    addPhysicalEvidence(evidence,subject,subject.id);
    addPhysicalEvidence(evidence,comparison,comparison.id);
    if(subject.education)evidence.push(educationEvidence(`${subject.id}-conditions`,`${subject.name} conditions`,`${subject.education.description} ${subject.education.atmosphere}`,subject));
    if(comparison.education)evidence.push(educationEvidence(`${comparison.id}-conditions`,`${comparison.name} conditions`,`${comparison.education.description} ${comparison.education.atmosphere}`,comparison));
  }else if(/distance|far/.test(q)){
    const fromSpacecraft=/\b(am i|me|my spacecraft|spacecraft)\b/.test(q);
    if(fromSpacecraft){
      const position=calculatePosition(subject.id,context.navigation.atUtcMs);
      const available=context.navigation.positionAU&&position.status==='available';
      const value=available?Math.hypot(...position.value.map((v,i)=>v-context.navigation.positionAU![i]))*AU_KM:null;
      explanation=`Spacecraft-to-${subject.name} distance uses the captured request-time scene position. ${context.navigation.note}`;
      evidence.push({id:'spacecraft-distance',label:`Distance from spacecraft to ${subject.name}`,value:value===null?'Unavailable':`${value.toPrecision(6)} km`,quality:value===null?'unavailable':context.navigation.basis,note:value===null?'The spacecraft or object position is unavailable.':'Center-to-center navigation estimate at the captured simulation time.',sources:position.status==='available'?sourceList(position.sourceIds):[]});
    }else{
      const reference=mentionedBodies(question).find(body=>body.id!==subject.id)??getBody('earth')!;
      const distance=calculateDistance(subject.id,reference.id,context.navigation.atUtcMs);
      explanation=`Simultaneous modeled center separation between ${subject.name} and ${reference.name}; this is not a flight path, travel duration or live observation.`;
      evidence.push({id:'body-distance',label:`Distance from ${reference.name}`,value:distance.status==='available'?`${distance.value.toPrecision(6)} km`:'Unavailable',quality:distance.status==='available'?distance.quality:'unavailable',note:distance.status==='unavailable'?distance.reason:'Positions use the local dataset and captured simulation time.',sources:distance.status==='available'?sourceList(distance.sourceIds):[]});
    }
  }else if(/radius|diameter|size|big|gravity|mass|weigh|rotation|spin|day|year|period|orbit|facts?/.test(q)){
    explanation='These values come directly from the local scientific dataset. Missing values remain unavailable; rotation and orbital periods are separate.';
    addPhysicalEvidence(evidence,subject);
  }else{
    const topic=/live|life|survive|habit/.test(q)?'habitability':/temperature|hot|cold/.test(q)?'temperature':/water|ice|ocean/.test(q)?'water':/mission|spacecraft|probe|explor/.test(q)?'missions':/moon|ring/.test(q)?'companions':null;
    const entry=guide[subject.id];
    if(topic&&entry){
      explanation=entry[topic];
      evidence.push(educationEvidence(topic,`${subject.name} ${topic}`,entry[topic],subject));
    }else if(topic==='habitability'){
      explanation=subject.id==='earth'?'Earth is the only world in this catalogue where life is confirmed.':`A reviewed habitability summary has not been imported for ${subject.name}. Its sourced environment and physical fields are shown without inventing missing conditions.`;
      if(subject.education)evidence.push(educationEvidence('environment',`${subject.name} environment`,`${subject.education.description} ${subject.education.atmosphere}`,subject));
      evidence.push(quantityEvidence('gravity',`${subject.name} gravity`,subject.physical.gravityMS2));
    }else if(topic==='water'){
      explanation=`The source-reviewed description for ${subject.name} is the available local evidence about water or ice; this guide does not infer more than that source states.`;
      if(subject.education)evidence.push(educationEvidence('water-evidence',`${subject.name} water and surface evidence`,`${subject.education.description} ${subject.education.fact}`,subject));
    }else if(topic==='missions'){
      explanation=`A reviewed mission summary has not been imported for ${subject.name}. The guide will not invent a visit list.`;
      if(subject.education)evidence.push(educationEvidence('further-reading',`${subject.name} NASA overview`,'Mission-specific evidence unavailable in the local structured dataset.',subject));
    }else if(/atmosphere|air|breath/.test(q)){
      explanation=subject.education?.atmosphere??'Atmosphere data unavailable.';
      if(subject.education)evidence.push(educationEvidence('atmosphere',`${subject.name} atmosphere`,subject.education.atmosphere,subject));
    }else{
      explanation=`The local guide has resolved ${subject.name}. Its reviewed overview and core physical evidence are shown; ask a more specific question for distance, habitability, water, missions or a comparison.`;
      if(subject.education)evidence.push(educationEvidence('overview',`${subject.name} overview`,`${subject.education.description} ${subject.education.fact}`,subject));
      evidence.push(quantityEvidence('radius',`${subject.name} radius`,subject.physical.radiusKm));
    }
  }

  return {subject:resolution.subjectName,atUtcMs:context.navigation.atUtcMs,explanation,evidence:evidence.slice(0,GUIDE_LIMITS.evidenceItems),contextNote,mode:'local',resolution};
}
