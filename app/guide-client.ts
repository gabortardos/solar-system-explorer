import {answerContextGuide,type GuideResponse} from './guide-assistant';
import type {GuideContext} from './guide-context';

const CLIENT_TIMEOUT_MS=12_000;

function isGuideResponse(value:unknown):value is GuideResponse{
  if(!value||typeof value!=='object')return false;
  const item=value as Partial<GuideResponse>;
  return typeof item.subject==='string'&&typeof item.explanation==='string'&&Array.isArray(item.evidence)&&
    (item.mode==='live'||item.mode==='local')&&!!item.resolution&&typeof item.contextNote==='string';
}

function fallback(context:GuideContext,question:string,reason:string):GuideResponse{
  const response=answerContextGuide(context,question);
  return {...response,fallbackReason:reason,contextNote:`${response.contextNote} Live AI was unavailable, so this answer used the deterministic Local guide.`};
}

export async function requestGuide(context:GuideContext,question:string,fetchImpl:typeof fetch=fetch):Promise<GuideResponse>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),CLIENT_TIMEOUT_MS);
  try{
    const selectedId=context.selected&&'id' in context.selected?context.selected.id:'';
    const response=await fetchImpl('/api/guide',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        requestId:crypto.randomUUID(),
        question,
        selectedId,
        navigation:{
          atUtcMs:context.navigation.atUtcMs,
          positionAU:context.navigation.positionAU,
          basis:context.navigation.basis,
          anchorId:context.navigation.anchorId,
          note:context.navigation.note,
        },
      }),
      signal:controller.signal,
    });
    if(!response.ok){
      const detail=await response.json().catch(()=>null) as {error?:string}|null;
      if(response.status===413||response.status===400)throw new Error(detail?.error??'The guide request was rejected.');
      return fallback(context,question,detail?.error??`server_${response.status}`);
    }
    const result:unknown=await response.json();
    return isGuideResponse(result)?result:fallback(context,question,'invalid_server_response');
  }catch(error){
    if(error instanceof Error&&/up to 600 characters|rejected/.test(error.message))throw error;
    return fallback(context,question,error instanceof DOMException&&error.name==='AbortError'?'client_timeout':'network_failure');
  }finally{
    clearTimeout(timer);
  }
}
