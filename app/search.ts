import {presentation} from './body-presentation';
import {catalog,getBody} from './data/catalog';
import type {ObjectCategory} from './data/schema';

export type SearchResult={id:string;name:string;aliases:readonly string[];type:string;context:string;sceneAvailable:boolean;matchedAlias?:string};
export type SearchResponse={results:SearchResult[];total:number;hasMore:boolean};
export interface CatalogSearchProvider{search(query:string,options?:{limit?:number}):Promise<SearchResponse>}

const categoryNames:Record<ObjectCategory,string>={star:'Star',planet:'Planet',moon:'Moon','dwarf-planet':'Dwarf planet',asteroid:'Asteroid',comet:'Comet',spacecraft:'Spacecraft'};
const activeIds=new Set(Object.keys(presentation));
export const normalizeSearchText=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const records=catalog.map(body=>{
 const parent=body.parentId?getBody(body.parentId):undefined,aliases=body.aliases.map(alias=>({display:alias,key:normalizeSearchText(alias)}));
 const context=body.category==='star'?'Solar System center':parent?`Orbits ${parent.name}`:'Solar System catalogue';
 return {body,nameKey:normalizeSearchText(body.name),aliases,context,contextKey:normalizeSearchText(`${categoryNames[body.category]} ${context}`),sceneAvailable:activeIds.has(body.id)};
});

function score(record:typeof records[number],query:string){
 if(!query)return record.sceneAvailable?20:30;
 if(record.nameKey===query)return 0;
 const exactAlias=record.aliases.find(alias=>alias.key===query);if(exactAlias)return 1;
 if(record.nameKey.startsWith(query))return 2;
 if(record.aliases.some(alias=>alias.key.startsWith(query)))return 3;
 const terms=query.split(' '),haystack=[record.nameKey,...record.aliases.map(alias=>alias.key),record.contextKey].join(' ');
 if(!terms.every(term=>haystack.includes(term)))return null;
 return record.nameKey.includes(query)?4:record.aliases.some(alias=>alias.key.includes(query))?5:6;
}

export class LocalCatalogSearchProvider implements CatalogSearchProvider{
 async search(query:string,options?:{limit?:number}):Promise<SearchResponse>{
  const normalized=normalizeSearchText(query),limit=Math.max(1,Math.min(options?.limit??20,50));
  const matches=records.map(record=>({record,score:score(record,normalized)})).filter((entry):entry is {record:typeof records[number];score:number}=>entry.score!==null).sort((a,b)=>a.score-b.score||a.record.body.name.localeCompare(b.record.body.name));
  return {results:matches.slice(0,limit).map(({record})=>({id:record.body.id,name:record.body.name,aliases:record.body.aliases,type:categoryNames[record.body.category],context:record.context,sceneAvailable:record.sceneAvailable,matchedAlias:record.aliases.find(alias=>alias.key===normalized)?.display})),total:matches.length,hasMore:matches.length>limit};
 }
}

// The UI depends only on this bounded asynchronous contract. A future server-side
// indexed provider can replace the 32-record local adapter without shipping the
// complete minor-body catalogue to the browser.
export const catalogSearchProvider:CatalogSearchProvider=new LocalCatalogSearchProvider();
