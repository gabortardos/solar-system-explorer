import {getBody} from '../../app/data/catalog';
import {answerContextGuide,renderExplanationSegments,validateExplanation,type ExplanationSegments,type GuideConversationContext,type GuideResponse} from '../../app/guide-assistant';
import {buildGuideContext,type GuideNavigation} from '../../app/guide-context';
import {detectSourceConflicts,retrieveAuthoritativeEvidence,type ExternalRetrieval} from './authoritative-sources';
import {appendConversationTurn,GUIDE_CONVERSATION_LIMITS,issueConversationToken,readConversationToken,type ConversationRead} from './conversation';
import {finishGuideRequest,hashViewer,LIVE_GUIDE_LIMITS,LIVE_GUIDE_MODEL,readGuideQuotaState,reserveGuideRequest,type GuideQuotaState,type GuideReservationPolicy,type LimitResult} from './limits';

export type GuideEnv={DB?:D1Database;OPENAI_API_KEY?:string;GUIDE_OWNER_EMAIL?:string;GUIDE_CONVERSATION_SECRET?:string};
type GuideRequestBody={requestId:string;question:string;selectedId:string;conversationToken?:string;navigation:{atUtcMs:number;positionAU:[number,number,number]|null;basis:GuideNavigation['basis'];anchorId:string;note?:string}};
type ProviderResult={output:unknown;usage:{inputTokens?:number;outputTokens?:number}};
type EndpointDependencies={fetchImpl?:typeof fetch;externalFetchImpl?:typeof fetch;now?:()=>number;timeoutMs?:number;reserve?:(db:D1Database,requestId:string,viewerHash:string,nowMs:number,policy?:GuideReservationPolicy)=>Promise<LimitResult>;retrieve?:(question:string,local:GuideResponse,fetchImpl:typeof fetch,nowMs:number)=>Promise<ExternalRetrieval>};

const explanationSchema={
  type:'object',additionalProperties:false,required:['segments','citationIds'],properties:{
    segments:{type:'array',minItems:1,maxItems:8,items:{anyOf:[
      {type:'object',additionalProperties:false,required:['text'],properties:{text:{type:'string',maxLength:800}}},
      {type:'object',additionalProperties:false,required:['evidenceId'],properties:{evidenceId:{type:'string'}}},
    ]}},
    citationIds:{type:'array',maxItems:4,items:{type:'string'}},
  },
};

const jsonHeaders={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const authenticatedEmailHeader='oai-authenticated-user-email';

function json(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:jsonHeaders});}
function requestError(message:string,status:number){return json({error:message},status);}
function normalizedEmail(value:string|undefined|null){return value?.trim().toLowerCase()??'';}
export function isGuideDeveloper(request:Request,env:GuideEnv):boolean{
  const configured=normalizedEmail(env.GUIDE_OWNER_EMAIL);
  return Boolean(configured)&&normalizedEmail(request.headers.get(authenticatedEmailHeader))===configured;
}
async function developerViewerHash(request:Request):Promise<string>{
  const email=normalizedEmail(request.headers.get(authenticatedEmailHeader));
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`solar-guide-developer-v1:${email}`));
  return `developer:${[...new Uint8Array(bytes)].slice(0,16).map(value=>value.toString(16).padStart(2,'0')).join('')}`;
}
function canonicalNavigation(value:GuideRequestBody['navigation']):GuideNavigation|null{
  if(!value||!Number.isFinite(value.atUtcMs)||value.atUtcMs<Date.UTC(1800,0,1)||value.atUtcMs>=Date.UTC(2050,0,1))return null;
  if(!['linear-camera','navigation-estimate','unavailable'].includes(value.basis))return null;
  const position=value.positionAU===null?null:Array.isArray(value.positionAU)&&value.positionAU.length===3&&value.positionAU.every(item=>Number.isFinite(item)&&Math.abs(item)<1_000)?value.positionAU:null;
  if(value.positionAU!==null&&!position)return null;
  const note=value.basis==='linear-camera'?'Scientific Scale: linear camera conversion; not a physical spacecraft trajectory.':value.basis==='navigation-estimate'?'Exploration Scale: focused-body-local navigation estimate, not a globally physical position.':'Spacecraft coordinates are unavailable for this scene snapshot.';
  return {atUtcMs:value.atUtcMs,positionAU:position,basis:value.basis,anchorId:typeof value.anchorId==='string'?value.anchorId.slice(0,64):'',note,selectedMinor:null};
}
function parseBody(raw:string):GuideRequestBody|null{
  let value:unknown;
  try{value=JSON.parse(raw);}catch{return null;}
  if(!value||typeof value!=='object')return null;
  const body=value as Partial<GuideRequestBody>;
  if(typeof body.requestId!=='string'||!uuidPattern.test(body.requestId)||typeof body.question!=='string'||typeof body.selectedId!=='string'||!body.navigation)return null;
  const navigation=canonicalNavigation(body.navigation);
  if(!navigation)return null;
  if(body.conversationToken!==undefined&&(typeof body.conversationToken!=='string'||body.conversationToken.length>GUIDE_CONVERSATION_LIMITS.tokenCharacters))return null;
  return {requestId:body.requestId,question:body.question,selectedId:body.selectedId,conversationToken:body.conversationToken,navigation};
}
function fallback(local:GuideResponse,reason:string,quota?:GuideQuotaState):GuideResponse{
  return {...local,evidence:local.evidence.filter(item=>item.sourceClass!=='authoritative-external'),mode:'local',fallbackReason:reason,quota,contextNote:`${local.contextNote} Live AI was unavailable, so this answer used the deterministic Local guide.`};
}
function providerText(value:unknown):string|null{
  if(!value||typeof value!=='object')return null;
  const payload=value as {output_text?:unknown;output?:unknown};
  if(typeof payload.output_text==='string')return payload.output_text;
  if(!Array.isArray(payload.output))return null;
  for(const rawItem of payload.output){
    if(!rawItem||typeof rawItem!=='object')continue;
    const item=rawItem as {type?:unknown;content?:unknown};
    if(item.type!=='message'||!Array.isArray(item.content))continue;
    for(const rawContent of item.content){
      if(!rawContent||typeof rawContent!=='object')continue;
      const content=rawContent as {type?:unknown;text?:unknown};
      if(content.type==='output_text'&&typeof content.text==='string')return content.text;
    }
  }
  return null;
}

async function callOpenAI(apiKey:string,question:string,local:GuideResponse,conversation:GuideConversationContext,fetchImpl:typeof fetch,timeoutMs:number):Promise<ProviderResult>{
  const providerEvidence=local.resolution.comparisonId?
    local.evidence.filter(item=>item.sourceClass==='authoritative-external'||/-(radius|gravity|rotation)$/.test(item.id)):
    local.evidence;
  const evidence=providerEvidence.map(({id,label,value,quality,note,sourceClass,retrievedAt})=>({id,label,value,quality,note,sourceClass,retrievedAt}));
  const input=JSON.stringify({question,resolution:local.resolution,simulationTime:new Date(local.atUtcMs).toISOString(),recentConversation:conversation.turns,conversationPolicy:'Signed server-verified continuity only. It helps interpret follow-ups but is not scientific evidence.',sourceHierarchy:['project-structured','authoritative-external','model-general-knowledge'],projectCuratedContext:'Supporting qualitative context; not current authoritative data.',externalRetrieval:local.external,sourceConflicts:local.sourceConflicts??[],evidence});
  if(Math.ceil(input.length/4)>LIVE_GUIDE_LIMITS.estimatedInputTokens)throw new Error('input_budget');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetchImpl('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},
      body:JSON.stringify({
        model:LIVE_GUIDE_MODEL,
        store:false,
        max_output_tokens:LIVE_GUIDE_LIMITS.outputTokens,
        instructions:'You are the Solar System Explorer Astronomy Guide. Answer directly, naturally, and conversationally. recentConversation is signed, bounded continuity for interpreting follow-ups, but it is not scientific evidence and must never override the current resolution or evidence. Apply this hierarchy: project-structured evidence is authoritative for application measurements, calculations, scene state, simulation time, orbital and physical values; authoritative-external evidence is a bounded current snapshot from an actual allowlisted scientific source; model general knowledge is only for qualitative explanation. Project-curated evidence is supporting editorial context, not current authoritative status. Never silently replace or contradict project-structured evidence. If sourceConflicts is non-empty, explain the discrepancy and preserve the project value. Use an evidenceId segment whenever an exact numerical or application-owned value is stated. Use citationIds to cite only supplied evidence that materially supports prose claims; citationIds create the source cards and must never be invented. Never write a URL. When externalRetrieval says unavailable or unsupported, do not guess current mission status, discoveries, or classifications from memory—state that current information could not be verified. Clearly communicate meaningful uncertainty, approximations, illustrative positions, incomplete evidence, or scientific disagreement without turning the answer into a technical report. You may freely compose concise qualitative explanations and ordinary general scientific knowledge. Do not include numbers in text segments. Keep the answer relevant to the solar system and safe. Return only the required JSON object.',
        input:[{role:'user',content:[{type:'input_text',text:input}]}],
        text:{format:{type:'json_schema',name:'astronomy_guide_answer',strict:true,schema:explanationSchema}},
      }),
      signal:controller.signal,
    });
    const raw=await response.text();
    if(raw.length>100_000)throw new Error('provider_response_too_large');
    if(!response.ok)throw new Error(`provider_http_${response.status}`);
    const payload=JSON.parse(raw);
    const text=providerText(payload);
    if(!text)throw new Error('provider_missing_output');
    return {output:JSON.parse(text),usage:{inputTokens:Number(payload?.usage?.input_tokens)||undefined,outputTokens:Number(payload?.usage?.output_tokens)||undefined}};
  }catch(error){
    if(error instanceof DOMException&&error.name==='AbortError')throw new Error('provider_timeout');
    throw error;
  }finally{clearTimeout(timer);}
}

export async function guideHealth(request:Request,env:GuideEnv):Promise<Response>{
  let tables=false,trigger=false;
  if(env.DB){
    try{
      const result=await env.DB.prepare("SELECT name, type FROM sqlite_schema WHERE name IN ('guide_requests','guide_budget_totals','guide_requests_budget_insert') ORDER BY name").all<{name:string;type:string}>();
      const records=result.results??[];
      tables=['guide_requests','guide_budget_totals'].every(name=>records.some(row=>row.name===name&&row.type==='table'));
      trigger=records.some(row=>row.name==='guide_requests_budget_insert'&&row.type==='trigger');
    }catch{/* Report unavailable without exposing diagnostics or secrets. */}
  }
  const authenticated=Boolean(request.headers.get(authenticatedEmailHeader));
  const developer=isGuideDeveloper(request,env);
  let quota:GuideQuotaState|undefined;
  if(env.DB&&tables){
    try{quota=await readGuideQuotaState(env.DB,developer?await developerViewerHash(request):await hashViewer(request),Date.now(),developer);}catch{/* Keep health safe and useful if quota telemetry is temporarily unavailable. */}
  }
  return json({service:'astronomy-guide',status:env.OPENAI_API_KEY&&tables&&trigger?'ready':'local-only',model:LIVE_GUIDE_MODEL,providerConfigured:Boolean(env.OPENAI_API_KEY),database:{binding:'DB',tables,trigger},access:{authenticated,developer},quota,limits:{public:{perMinute:LIVE_GUIDE_LIMITS.viewerPerMinute,rolling24Hours:LIVE_GUIDE_LIMITS.viewerPerDay},developerRequestCountBypass:true},conversation:{enabled:Boolean(env.GUIDE_CONVERSATION_SECRET&&env.GUIDE_CONVERSATION_SECRET.length>=16),retainedTurns:GUIDE_CONVERSATION_LIMITS.retainedTurns,ttlMs:GUIDE_CONVERSATION_LIMITS.ttlMs},externalRetrieval:{mode:'allowlisted-authoritative-only',maxSourcesPerQuestion:1}});
}

async function withConversation(response:GuideResponse,current:ConversationRead,question:string,env:GuideEnv,nowMs:number):Promise<GuideResponse>{
  const next=appendConversationTurn(current,question,response.explanation,response.resolution);
  const conversation=await issueConversationToken(next,env.GUIDE_CONVERSATION_SECRET,nowMs);
  return conversation?{...response,conversation}:response;
}

export async function handleGuideRequest(request:Request,env:GuideEnv,deps:EndpointDependencies={}):Promise<Response>{
  const declared=Number(request.headers.get('content-length')??0);
  if(declared>LIVE_GUIDE_LIMITS.requestBytes)return requestError('The guide request is too large.',413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>LIVE_GUIDE_LIMITS.requestBytes)return requestError('The guide request is too large.',413);
  const body=parseBody(raw);
  if(!body)return requestError('Malformed guide request.',400);
  const question=body.question.trim();
  if(!question||question.length>LIVE_GUIDE_LIMITS.questionCharacters)return requestError('Please ask a question of up to 600 characters.',413);
  if(!getBody(body.selectedId))return requestError('The selected object is not available to the Live guide.',422);

  const nowMs=(deps.now??Date.now)();
  const conversation=await readConversationToken(body.conversationToken,env.GUIDE_CONVERSATION_SECRET,nowMs);
  const context=buildGuideContext(body.selectedId,body.navigation);
  const local=answerContextGuide(context,question,conversation.context);
  if(!local.evidence.length)return json(await withConversation(fallback(local,'insufficient_structured_evidence'),conversation,question,env,nowMs));
  if(!env.OPENAI_API_KEY)return json(await withConversation(fallback(local,'provider_not_configured'),conversation,question,env,nowMs));
  if(!env.DB)return json(await withConversation(fallback(local,'database_unavailable'),conversation,question,env,nowMs));

  const developer=isGuideDeveloper(request,env);
  const viewerHash=developer?await developerViewerHash(request):await hashViewer(request);
  const reserve=deps.reserve??reserveGuideRequest;
  const limit=await reserve(env.DB,body.requestId,viewerHash,nowMs,{bypassRequestCounts:developer});
  if(!limit.allowed)return json(await withConversation(fallback(local,limit.reason,limit.quota),conversation,question,env,nowMs));

  try{
    const retrieval=await (deps.retrieve??retrieveAuthoritativeEvidence)(question,local,deps.externalFetchImpl??fetch,nowMs);
    const sourceConflicts=detectSourceConflicts(local.evidence,retrieval.evidence);
    const grounded:GuideResponse={...local,evidence:[...local.evidence,...retrieval.evidence],external:{status:retrieval.status,note:retrieval.note,retrievedAt:retrieval.retrievedAt},sourceConflicts};
    const provider=await callOpenAI(env.OPENAI_API_KEY,question,grounded,conversation.context,deps.fetchImpl??fetch,deps.timeoutMs??LIVE_GUIDE_LIMITS.timeoutMs);
    if(!validateExplanation(provider.output,grounded.evidence)){
      await finishGuideRequest(env.DB,body.requestId,'invalid_output',provider.usage,'invalid_output');
      return json(await withConversation(fallback(grounded,'invalid_model_output',limit.quota),conversation,question,env,nowMs));
    }
    const validated=provider.output as ExplanationSegments;
    const explanation=renderExplanationSegments(validated,grounded.evidence);
    if(!explanation){
      await finishGuideRequest(env.DB,body.requestId,'invalid_output',provider.usage,'empty_output');
      return json(await withConversation(fallback(grounded,'invalid_model_output',limit.quota),conversation,question,env,nowMs));
    }
    const usedEvidenceIds=new Set([...validated.citationIds,...validated.segments.flatMap(segment=>'evidenceId' in segment?[segment.evidenceId]:[])]);
    await finishGuideRequest(env.DB,body.requestId,'succeeded',provider.usage);
    return json(await withConversation({...grounded,explanation,evidence:grounded.evidence.filter(item=>usedEvidenceIds.has(item.id)),mode:'live',model:LIVE_GUIDE_MODEL,quota:limit.quota},conversation,question,env,nowMs));
  }catch(error){
    const code=error instanceof Error?error.message:'provider_error';
    await finishGuideRequest(env.DB,body.requestId,code==='provider_timeout'?'timeout':'provider_error',undefined,code.slice(0,80));
    return json(await withConversation(fallback(local,code,limit.quota),conversation,question,env,nowMs));
  }
}
