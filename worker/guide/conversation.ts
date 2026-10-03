import {getBody} from '../../app/data/catalog';
import type {GuideConversationContext,GuideConversationTurn,GuideIntent,GuideResolution} from '../../app/guide-assistant';

export const GUIDE_CONVERSATION_LIMITS={
  retainedTurns:3,
  questionCharacters:160,
  answerCharacters:280,
  tokenCharacters:6_000,
  ttlMs:2*60*60*1_000,
} as const;

const intents=new Set<GuideIntent>(['overview','habitability','temperature','water','missions','companions','atmosphere','physical','distance','comparison','time','location','nearby']);
type ConversationPayload={v:1;issuedAt:number;expiresAt:number;turnCount:number;turns:GuideConversationTurn[]};
export type ConversationRead={context:GuideConversationContext;turnCount:number;reset:boolean};

function utf8(value:string){return new TextEncoder().encode(value);}
function base64Url(bytes:Uint8Array){
  let binary='';
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeBase64Url(value:string){
  const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  const binary=atob(padded),bytes=new Uint8Array(binary.length);
  for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
  return bytes;
}
function safeText(value:unknown,max:number){return typeof value==='string'?value.replace(/\s+/g,' ').trim().slice(0,max):'';}
function safeId(value:unknown){return typeof value==='string'&&getBody(value)?value:null;}
function validTurn(value:unknown):GuideConversationTurn|null{
  if(!value||typeof value!=='object')return null;
  const turn=value as Partial<GuideConversationTurn>;
  const question=safeText(turn.question,GUIDE_CONVERSATION_LIMITS.questionCharacters);
  const answer=safeText(turn.answer,GUIDE_CONVERSATION_LIMITS.answerCharacters);
  if(!question||!answer||!turn.intent||!intents.has(turn.intent))return null;
  const selectedId=safeId(turn.selectedId),subjectId=safeId(turn.subjectId),comparisonId=safeId(turn.comparisonId);
  if(turn.selectedId!==null&&!selectedId||turn.subjectId!==null&&!subjectId||turn.comparisonId!==null&&!comparisonId)return null;
  return {question,answer,selectedId,subjectId,comparisonId,intent:turn.intent};
}
async function signingKey(secret:string,usage:KeyUsage[]){
  return crypto.subtle.importKey('raw',utf8(secret),{name:'HMAC',hash:'SHA-256'},false,usage);
}
async function signature(payload:string,secret:string){
  const key=await signingKey(secret,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,utf8(payload)));
}
function equalBytes(left:Uint8Array,right:Uint8Array){
  if(left.length!==right.length)return false;
  let difference=0;
  for(let index=0;index<left.length;index++)difference|=left[index]^right[index];
  return difference===0;
}
function empty(reset=false):ConversationRead{return {context:{turns:[]},turnCount:0,reset};}

/** Verify the opaque browser token before any conversational reference is trusted. */
export async function readConversationToken(token:string|undefined,secret:string|undefined,nowMs:number):Promise<ConversationRead>{
  if(!token)return empty(false);
  if(!secret||secret.length<16||token.length>GUIDE_CONVERSATION_LIMITS.tokenCharacters)return empty(true);
  try{
    const [encoded,provided,...extra]=token.split('.');
    if(!encoded||!provided||extra.length)return empty(true);
    const expected=await signature(encoded,secret);
    if(!equalBytes(expected,decodeBase64Url(provided)))return empty(true);
    const payload=JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded))) as Partial<ConversationPayload>;
    if(payload.v!==1||!Number.isFinite(payload.issuedAt)||!Number.isFinite(payload.expiresAt)||payload.issuedAt!>nowMs+60_000||payload.expiresAt!<=nowMs||payload.expiresAt!>nowMs+GUIDE_CONVERSATION_LIMITS.ttlMs+60_000||!Number.isInteger(payload.turnCount)||payload.turnCount!<0||!Array.isArray(payload.turns)||payload.turns.length>GUIDE_CONVERSATION_LIMITS.retainedTurns)return empty(true);
    const turns=payload.turns.map(validTurn);
    if(turns.some(turn=>!turn))return empty(true);
    return {context:{turns:turns as GuideConversationTurn[]},turnCount:payload.turnCount!,reset:false};
  }catch{return empty(true);}
}

export function appendConversationTurn(current:ConversationRead,question:string,answer:string,resolution:GuideResolution):ConversationRead{
  const turn:GuideConversationTurn={
    question:safeText(question,GUIDE_CONVERSATION_LIMITS.questionCharacters),
    answer:safeText(answer,GUIDE_CONVERSATION_LIMITS.answerCharacters),
    selectedId:resolution.selectedId,
    subjectId:resolution.subjectId,
    comparisonId:resolution.comparisonId,
    intent:resolution.intent,
  };
  return {context:{turns:[...current.context.turns,turn].slice(-GUIDE_CONVERSATION_LIMITS.retainedTurns)},turnCount:Math.min(1_000_000,current.turnCount+1),reset:current.reset};
}

export async function issueConversationToken(current:ConversationRead,secret:string|undefined,nowMs:number){
  if(!secret||secret.length<16)return undefined;
  const payload:ConversationPayload={v:1,issuedAt:nowMs,expiresAt:nowMs+GUIDE_CONVERSATION_LIMITS.ttlMs,turnCount:current.turnCount,turns:current.context.turns};
  const encoded=base64Url(utf8(JSON.stringify(payload)));
  const token=`${encoded}.${base64Url(await signature(encoded,secret))}`;
  if(token.length>GUIDE_CONVERSATION_LIMITS.tokenCharacters)throw new Error('conversation_token_too_large');
  return {token,turnCount:current.turnCount,retainedTurns:current.context.turns.length,expiresAt:payload.expiresAt,reset:current.reset};
}
