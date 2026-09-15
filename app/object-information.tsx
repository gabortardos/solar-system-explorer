import {presentation} from './body-presentation';
import {getBody} from './data/catalog';
import {guide} from './data/guide-education';
import {objectEducation} from './data/object-education';
import type {ObjectCategory,Quantity} from './data/schema';

export type ObjectInfoField={label:string;value:string};
export type ObjectInfoNarrative={label:string;text:string};
export type ObjectInformationModel={
 id:string;name:string;category:ObjectCategory;type:string;parent?:string;description?:string;
 facts:ObjectInfoField[];narratives:ObjectInfoNarrative[];source?:string;
};

const categoryNames:Record<ObjectCategory,string>={star:'Star',planet:'Planet',moon:'Moon','dwarf-planet':'Dwarf planet',asteroid:'Asteroid',comet:'Comet',spacecraft:'Spacecraft'};
const superscript=(value:number)=>String(value).replace(/-/g,'⁻').replace(/0/g,'⁰').replace(/1/g,'¹').replace(/2/g,'²').replace(/3/g,'³').replace(/4/g,'⁴').replace(/5/g,'⁵').replace(/6/g,'⁶').replace(/7/g,'⁷').replace(/8/g,'⁸').replace(/9/g,'⁹');
const formatMass=(value:number)=>{const exponent=Math.floor(Math.log10(Math.abs(value))),coefficient=value/10**exponent;return `${coefficient.toFixed(4).replace(/\.0+$/,'')} × 10${superscript(exponent)} kg`;};
const available=(field:Quantity)=>field.value===null?null:field.value;
const formatPeriod=(days:number)=>days>=730?`${(days/365.25).toLocaleString(undefined,{maximumFractionDigits:2})} years`:`${days.toLocaleString(undefined,{maximumFractionDigits:3})} days`;
const formatRotation=(hours:number)=>`${Math.abs(hours)>=72?(Math.abs(hours)/24).toLocaleString(undefined,{maximumFractionDigits:3})+' days':Math.abs(hours).toLocaleString(undefined,{maximumFractionDigits:3})+' hours'}${hours<0?' · retrograde':''}`;

export function buildObjectInformation(id:string):ObjectInformationModel|null{
 const body=getBody(id);if(!body)return null;
 const visual=presentation[id as keyof typeof presentation];
 const profile=objectEducation[id],temperature=guide[id]?.temperature;
 const radius=available(body.physical.radiusKm),mass=available(body.physical.massKg),gravity=available(body.physical.gravityMS2),rotation=available(body.physical.rotationHours),period=available(body.orbit.periodDays);
 const parent=body.parentId?getBody(body.parentId):undefined;
 const facts:ObjectInfoField[]=[];
 if(radius!==null){facts.push({label:body.category==='star'?'Nominal radius':'Mean radius',value:`${radius.toLocaleString(undefined,{maximumSignificantDigits:9})} km`},{label:body.category==='star'?'Nominal diameter':'Mean diameter',value:`${(radius*2).toLocaleString(undefined,{maximumSignificantDigits:9})} km`});}
 if(mass!==null)facts.push({label:'Mass',value:formatMass(mass)});
 if(gravity!==null)facts.push({label:body.category==='moon'?'Spherical gravity estimate':'Reference-level gravity',value:`${gravity.toLocaleString(undefined,{maximumSignificantDigits:5})} m/s²`});
 if(period!==null)facts.push({label:parent?`Orbit around ${parent.name}`:'Orbital period',value:formatPeriod(period)});
 if(rotation!==null)facts.push({label:body.category==='star'?'Equatorial rotation (approx.)':'Sidereal rotation',value:formatRotation(rotation)});
 const narratives:ObjectInfoNarrative[]=[];
 if(body.education?.atmosphere)narratives.push({label:'Atmosphere',text:body.education.atmosphere});
 if(profile?.composition)narratives.push({label:'Composition',text:profile.composition});
 if(temperature)narratives.push({label:'Temperature',text:temperature});
 if(profile?.discovery)narratives.push({label:'Discovery',text:profile.discovery});
 if(profile?.scientificImportance)narratives.push({label:'Scientific importance',text:profile.scientificImportance});
 if(body.education?.fact)narratives.push({label:'Interesting fact',text:body.education.fact});
 return {id:body.id,name:body.name,category:body.category,type:visual?.kind??categoryNames[body.category],parent:parent?.name,description:body.education?.description,facts,narratives,source:body.education?.source};
}

export function ObjectInformation({model}:{model:ObjectInformationModel}){
 return <article className="object-information">
  <header className="object-info-header"><span className="eyebrow">{model.type}</span><h2>{model.name}</h2>{model.parent&&<p>Orbits {model.parent}</p>}</header>
  {model.description&&<p className="object-summary">{model.description}</p>}
  {model.facts.length>0&&<dl className="object-facts">{model.facts.map(field=><div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>}
  {model.narratives.length>0&&<div className="object-narratives">{model.narratives.map(item=><section key={item.label} className={item.label==='Interesting fact'?'object-highlight':''}><h3>{item.label}</h3><p>{item.text}</p></section>)}</div>}
 </article>;
}
