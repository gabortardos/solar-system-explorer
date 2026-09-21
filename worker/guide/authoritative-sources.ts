import {getBody} from '../../app/data/catalog';
import type {GuideEvidence,GuideExternalStatus,GuideResponse,GuideSourceConflict} from '../../app/guide-assistant';

export const EXTERNAL_RETRIEVAL_LIMITS={timeoutMs:4_000,maxResponseBytes:1_000_000,maxExcerptCharacters:3_500,maxSources:1} as const;
const trustedHosts=new Set(['science.nasa.gov','www.nasa.gov','nasa.gov','solarsystem.nasa.gov','ssd.jpl.nasa.gov','www.jpl.nasa.gov','jpl.nasa.gov','www.esa.int','esa.int','www.usgs.gov','usgs.gov']);
const nasaMainPages:Record<string,string>={sun:'https://science.nasa.gov/sun/',mercury:'https://science.nasa.gov/mercury/',venus:'https://science.nasa.gov/venus/',earth:'https://science.nasa.gov/earth/',moon:'https://science.nasa.gov/moon/',mars:'https://science.nasa.gov/mars/',jupiter:'https://science.nasa.gov/jupiter/',saturn:'https://science.nasa.gov/saturn/',uranus:'https://science.nasa.gov/uranus/',neptune:'https://science.nasa.gov/neptune/'};

export type ExternalRetrieval={status:GuideExternalStatus;note:string;evidence:GuideEvidence[];retrievedAt?:string};

export function needsAuthoritativeRetrieval(question:string):boolean{
  if(/\b(distance|far|radius|diameter|gravity|mass|rotation|orbital period|simulation time|simulated time|spacecraft position|where am i)\b/i.test(question))return false;
  return /\b(latest|current|currently|active|recent|recently|today|now|status|still operating|new discovery|newly discovered|classification)\b/i.test(question)||/\b(mission|missions|spacecraft|probe|rover|orbiter)\b/i.test(question);
}

function trustedUrl(raw:string|undefined):string|null{
  if(!raw)return null;
  try{const url=new URL(raw);return url.protocol==='https:'&&trustedHosts.has(url.hostname.toLowerCase())?url.toString():null;}catch{return null;}
}

function sourceFor(local:GuideResponse):{id:string;title:string;url:string}|null{
  const subjectId=local.resolution.subjectId;
  if(!subjectId)return null;
  const body=getBody(subjectId);
  const url=trustedUrl(nasaMainPages[subjectId]??body?.education?.source);
  return url?{id:`external-${subjectId}-official`,title:`NASA ${local.resolution.subjectName}`,url}:null;
}

function decodeHtml(value:string){return value.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&ndash;|&mdash;/gi,'—').replace(/&minus;/gi,'−').replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16))).replace(/&#(\d+);/g,(_,decimal)=>String.fromCodePoint(Number(decimal)));}
function linesFromHtml(html:string):string[]{
  const text=html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi,' ').replace(/<\/(?:p|div|section|article|h[1-6]|li|tr|br)>/gi,'\n').replace(/<[^>]+>/g,' ');
  return decodeHtml(text).split(/\n+/).map(line=>line.replace(/\s+/g,' ').trim()).filter(line=>line.length>=24&&line.length<=900);
}
function relevantExcerpt(html:string,question:string,subject:string):string{
  const stop=new Set(['what','which','when','where','does','this','that','there','about','from','with','have','latest','current','currently','active','right']);
  const terms=[...new Set(`${question} ${subject}`.toLowerCase().match(/[a-z]{4,}/g)?.filter(word=>!stop.has(word))??[])];
  if(/mission|spacecraft|probe|rover|orbiter/i.test(question))terms.push('mission','rover','orbiter','spacecraft','status','perseverance','curiosity');
  const lines=linesFromHtml(html);
  const ranked=lines.map((line,index)=>({line,index,score:terms.reduce((score,term)=>score+(line.toLowerCase().includes(term)?1:0),0)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,14).sort((a,b)=>a.index-b.index);
  const excerpt=ranked.map(item=>item.line).filter((line,index,array)=>array.indexOf(line)===index).join(' ');
  return excerpt.slice(0,EXTERNAL_RETRIEVAL_LIMITS.maxExcerptCharacters).trim();
}

export async function retrieveAuthoritativeEvidence(question:string,local:GuideResponse,fetchImpl:typeof fetch=fetch,nowMs=Date.now()):Promise<ExternalRetrieval>{
  if(!needsAuthoritativeRetrieval(question))return {status:'not-needed',note:'No current external verification was needed for this question.',evidence:[]};
  const source=sourceFor(local);
  if(!source)return {status:'unsupported',note:'No allowlisted authoritative source is registered for this subject.',evidence:[]};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),EXTERNAL_RETRIEVAL_LIMITS.timeoutMs);
  try{
    const response=await fetchImpl(source.url,{headers:{accept:'text/html,application/json;q=0.9,text/plain;q=0.8'},redirect:'follow',signal:controller.signal});
    const finalUrl=trustedUrl(response.url||source.url);
    const contentType=response.headers.get('content-type')??'';
    const declared=Number(response.headers.get('content-length')??0);
    if(!response.ok||!finalUrl||(!/text\/(?:html|plain)|application\/json/i.test(contentType))||(declared&&declared>EXTERNAL_RETRIEVAL_LIMITS.maxResponseBytes))throw new Error('external_source_rejected');
    const raw=await response.text();
    if(new TextEncoder().encode(raw).byteLength>EXTERNAL_RETRIEVAL_LIMITS.maxResponseBytes)throw new Error('external_source_too_large');
    const excerpt=relevantExcerpt(raw,question,local.resolution.subjectName);
    if(excerpt.length<40)throw new Error('external_source_empty');
    const retrievedAt=new Date(nowMs).toISOString();
    return {status:'retrieved',retrievedAt,note:`Retrieved one allowlisted authoritative source on ${retrievedAt.slice(0,10)}.`,evidence:[{id:source.id,label:`Current official information for ${local.resolution.subjectName}`,value:excerpt,quality:'authoritative external snapshot',note:`Retrieved from the official source on ${retrievedAt}. This snapshot does not modify the project dataset.`,sources:[{title:source.title,url:finalUrl}],sourceClass:'authoritative-external',retrievedAt}]};
  }catch{
    return {status:'unavailable',note:'Current authoritative information could not be retrieved, so the guide must not guess current status.',evidence:[]};
  }finally{clearTimeout(timer);}
}

export function detectSourceConflicts(projectEvidence:GuideEvidence[],externalEvidence:GuideEvidence[]):GuideSourceConflict[]{
  const projectByClaim=new Map(projectEvidence.filter(item=>item.claimKey&&item.sourceClass==='project-structured').map(item=>[item.claimKey!,item]));
  return externalEvidence.flatMap(item=>{
    if(!item.claimKey)return [];
    const project=projectByClaim.get(item.claimKey);
    if(!project||project.value.trim().toLowerCase()===item.value.trim().toLowerCase())return [];
    return [{claimKey:item.claimKey,projectEvidenceId:project.id,externalEvidenceId:item.id,note:`The external snapshot differs from project data for ${item.claimKey}. The application keeps ${project.label} as authoritative until a separate data review.`}];
  });
}
