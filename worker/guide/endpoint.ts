import {getBody} from '../../app/data/catalog';
import {answerContextGuide,renderExplanationSegments,validateExplanation,type GuideResponse} from '../../app/guide-assistant';
import {buildGuideContext,type GuideNavigation} from '../../app/guide-context';
import {finishGuideRequest,hashViewer,LIVE_GUIDE_LIMITS,LIVE_GUIDE_MODEL,reserveGuideRequest,type LimitResult} from './limits';

export type GuideEnv={DB?:D1Database;OPENAI_API_KEY?:string};
type GuideRequestBody={requestId:string;question:string;selectedId:string;navigation:{atUtcMs:number;positionAU:[number,number,number]|null;basis:GuideNavigation['basis'];anchorId:string;note?:string}};
type ProviderResult={output:unknown;usage:{inputTokens?:number;outputTokens?:number}};
type EndpointDependencies={fetchImpl?:typeof fetch;now?:()=>number;timeoutMs?:number;reserve?:(db:D1Database,requestId:string,viewerHash:string,nowMs:number)=>Promise<LimitResult>};

const explanationSchema={
  type:'object',additionalProperties:false,required:['segments'],properties:{
    segments:{type:'array',minItems:1,maxItems:8,items:{anyOf:[
      {type:'object',additionalProperties:false,required:['text'],properties:{text:{type:'string',maxLength:800}}},
      {type:'object',additionalProperties:false,required:['evidenceId'],properties:{evidenceId:{type:'string'}}},
    ]}},
  },
};

const jsonHeaders={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:jsonHeaders});}
function requestError(message:string,status:number){return json({error:message},status);}
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
  return {requestId:body.requestId,question:body.question,selectedId:body.selectedId,navigation};
}
function fallback(local:GuideResponse,reason:string):GuideResponse{
  return {...local,mode:'local',fallbackReason:reason,contextNote:`${local.contextNote} Live AI was unavailable, so this answer used the deterministic Local guide.`};
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

async function callOpenAI(apiKey:string,question:string,local:GuideResponse,fetchImpl:typeof fetch,timeoutMs:number):Promise<ProviderResult>{
  const providerEvidence=local.resolution.comparisonId?
    local.evidence.filter(item=>/-(radius|gravity|rotation)$/.test(item.id)):
    local.evidence;
  const evidence=providerEvidence.map(({id,label,value,quality,note})=>({id,label,value,quality,note}));
  const input=JSON.stringify({question,resolution:local.resolution,simulationTime:new Date(local.atUtcMs).toISOString(),evidence});
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
        instructions:'You are the Solar System Explorer Astronomy Guide. Answer the user directly, naturally, and conversationally about the solar system. There are two information classes. First, supplied structured application evidence is authoritative for exact measurements, calculated distances, spacecraft position, simulation time, orbital values, physical values, and other app-owned facts. Whenever an exact or numerical claim is needed, use an evidenceId segment instead of writing the value yourself. If the required verified value is absent, say the app does not currently have verified data for it and do not estimate. Second, you may freely compose concise qualitative explanations and ordinary general scientific or common knowledge in text segments, including everyday contextual questions and well-established mission context. Do not imply that this general-knowledge prose is verified application data. Never invent citations, exact values, dates, or scene state. Do not include numbers or URLs in text segments. Keep the answer relevant to the solar system and do not provide harmful instructions. Use only evidence that materially supports the answer, with at most three evidenceId segments, and do not enumerate every supplied field. Return only the required JSON object.',
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

export async function guideHealth(env:GuideEnv):Promise<Response>{
  let tables=false,trigger=false;
  if(env.DB){
    try{
      const result=await env.DB.prepare("SELECT name, type FROM sqlite_schema WHERE name IN ('guide_requests','guide_budget_totals','guide_requests_budget_insert') ORDER BY name").all<{name:string;type:string}>();
      const records=result.results??[];
      tables=['guide_requests','guide_budget_totals'].every(name=>records.some(row=>row.name===name&&row.type==='table'));
      trigger=records.some(row=>row.name==='guide_requests_budget_insert'&&row.type==='trigger');
    }catch{/* Report unavailable without exposing diagnostics or secrets. */}
  }
  return json({service:'astronomy-guide',status:env.OPENAI_API_KEY&&tables&&trigger?'ready':'local-only',model:LIVE_GUIDE_MODEL,providerConfigured:Boolean(env.OPENAI_API_KEY),database:{binding:'DB',tables,trigger}});
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

  const context=buildGuideContext(body.selectedId,body.navigation);
  const local=answerContextGuide(context,question);
  if(!local.evidence.length)return json(fallback(local,'insufficient_structured_evidence'));
  if(!env.OPENAI_API_KEY)return json(fallback(local,'provider_not_configured'));
  if(!env.DB)return json(fallback(local,'database_unavailable'));

  const viewerHash=await hashViewer(request);
  const reserve=deps.reserve??reserveGuideRequest;
  const limit=await reserve(env.DB,body.requestId,viewerHash,(deps.now??Date.now)());
  if(!limit.allowed)return json(fallback(local,limit.reason));

  try{
    const provider=await callOpenAI(env.OPENAI_API_KEY,question,local,deps.fetchImpl??fetch,deps.timeoutMs??LIVE_GUIDE_LIMITS.timeoutMs);
    if(!validateExplanation(provider.output,local.evidence)){
      await finishGuideRequest(env.DB,body.requestId,'invalid_output',provider.usage,'invalid_output');
      return json(fallback(local,'invalid_model_output'));
    }
    const explanation=renderExplanationSegments(provider.output,local.evidence);
    if(!explanation){
      await finishGuideRequest(env.DB,body.requestId,'invalid_output',provider.usage,'empty_output');
      return json(fallback(local,'invalid_model_output'));
    }
    const usedEvidenceIds=new Set(provider.output.segments.flatMap(segment=>'evidenceId' in segment?[segment.evidenceId]:[]));
    await finishGuideRequest(env.DB,body.requestId,'succeeded',provider.usage);
    return json({...local,explanation,evidence:local.evidence.filter(item=>usedEvidenceIds.has(item.id)),mode:'live',model:LIVE_GUIDE_MODEL});
  }catch(error){
    const code=error instanceof Error?error.message:'provider_error';
    await finishGuideRequest(env.DB,body.requestId,code==='provider_timeout'?'timeout':'provider_error',undefined,code.slice(0,80));
    return json(fallback(local,code));
  }
}
