import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {readFile} from 'node:fs/promises';

const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
after(()=>vite.close());
const {buildGuideContext}=await vite.ssrLoadModule('/app/guide-context.ts');
const {answerContextGuide}=await vite.ssrLoadModule('/app/guide-assistant.ts');
const {handleGuideRequest}=await vite.ssrLoadModule('/worker/guide/endpoint.ts');

const nav={atUtcMs:Date.UTC(2026,8,21),positionAU:[1,0,0],basis:'navigation-estimate',anchorId:'earth',note:'untrusted client note',selectedMinor:null};
const allowed=async()=>({allowed:true,reason:'reserved'});
const db={prepare(){return {bind(){return this},async run(){return {success:true}},async first(){return null},async all(){return {results:[]}}}}};
let sequence=0;
function request(selectedId,question,extra={}){
 sequence++;
 return new Request('https://example.test/api/guide',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'203.0.113.7'},body:JSON.stringify({requestId:`00000000-0000-4000-8000-${String(sequence).padStart(12,'0')}`,selectedId,question,navigation:{...nav,...extra}})});
}
function provider(output={segments:[{text:'The structured evidence supports this answer.'},{evidenceId:'habitability'}]}){
 return async()=>new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}],usage:{input_tokens:420,output_tokens:32}}),{status:200,headers:{'content-type':'application/json'}});
}

test('here resolves to the captured selected planet',()=>{
 const answer=answerContextGuide(buildGuideContext('mars',nav),'Could I live here?');
 assert.equal(answer.resolution.subjectId,'mars');assert.match(answer.resolution.interpretation,/Here.*Mars/);
});
test('this moon resolves to the captured selected moon',()=>{
 const answer=answerContextGuide(buildGuideContext('europa',nav),'What about this moon?');
 assert.equal(answer.resolution.subjectId,'europa');assert.equal(answer.subject,'Europa');assert.ok(answer.evidence.length);
});
test('this planet and that planet resolve from a selected moon to its parent',()=>{
 for(const question of ['Compare this planet with Earth.','What missions visited that planet?']){
  const answer=answerContextGuide(buildGuideContext('europa',nav),question);
  assert.equal(answer.resolution.subjectId,'jupiter');
 }
});
test('comparison uses structured evidence for both objects',()=>{
 const answer=answerContextGuide(buildGuideContext('jupiter',nav),'Compare this planet with Earth.');
 assert.equal(answer.resolution.comparisonId,'earth');assert.ok(answer.evidence.some(item=>item.id.startsWith('jupiter-')));assert.ok(answer.evidence.some(item=>item.id.startsWith('earth-')));
});
test('named comparison resolves Mars while preserving selected subject',()=>{
 const answer=answerContextGuide(buildGuideContext('earth',nav),'How does this compare with Mars?');
 assert.equal(answer.resolution.subjectId,'earth');assert.equal(answer.resolution.comparisonId,'mars');
});
test('spacecraft distance to selected moon uses the request-time scene snapshot',()=>{
 const answer=answerContextGuide(buildGuideContext('moon',nav),'How far am I from this moon?');
 assert.equal(answer.resolution.subjectId,'moon');assert.equal(answer.evidence[0].id,'spacecraft-distance');assert.match(answer.evidence[0].value,/km$/);
});
test('live endpoint calls Responses API once without sending the API key in its body',async()=>{
 let calls=0,captured='';
 const fetchImpl=async(_url,options)=>{calls++;captured=String(options.body);return provider()(null,options)};
 const response=await handleGuideRequest(request('mars','Could I live here?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl,reserve:allowed});
 const result=await response.json();
 assert.equal(response.status,200);assert.equal(result.mode,'live');assert.equal(result.model,'gpt-5.6-luna');assert.equal(calls,1);assert.doesNotMatch(captured,/server-secret/);
});
test('provider failure returns deterministic Local guide without retry',async()=>{
 let calls=0;
 const response=await handleGuideRequest(request('mars','Could I live here?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:async()=>{calls++;return new Response('{}',{status:503})},reserve:allowed});
 const result=await response.json();assert.equal(calls,1);assert.equal(result.mode,'local');assert.equal(result.fallbackReason,'provider_http_503');
});
test('malformed or model-invalid output is rejected to Local guide',async()=>{
 const response=await handleGuideRequest(request('mars','Could I live here?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:'Mars has 42 lakes.'}]}),reserve:allowed});
 const result=await response.json();assert.equal(result.mode,'local');assert.equal(result.fallbackReason,'invalid_model_output');
});
test('provider timeout returns Local guide and does not retry',async()=>{
 let calls=0;
 const fetchImpl=(_url,{signal})=>new Promise((_,reject)=>{calls++;signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true})});
 const response=await handleGuideRequest(request('mars','Could I live here?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl,reserve:allowed,timeoutMs:5});
 const result=await response.json();assert.equal(calls,1);assert.equal(result.mode,'local');assert.equal(result.fallbackReason,'provider_timeout');
});
test('oversized and malformed requests are rejected before paid work',async()=>{
 const oversized=request('mars','x'.repeat(601));assert.equal((await handleGuideRequest(oversized,{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider(),reserve:allowed})).status,413);
 const malformed=new Request('https://example.test/api/guide',{method:'POST',body:'{'});assert.equal((await handleGuideRequest(malformed,{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider(),reserve:allowed})).status,400);
});
test('rate limiting refuses paid generation and serves Local guide',async()=>{
 let called=false;
 const response=await handleGuideRequest(request('mars','Could I live here?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:async()=>{called=true;return provider()()},reserve:async()=>({allowed:false,reason:'viewer_minute'})});
 const result=await response.json();assert.equal(called,false);assert.equal(result.mode,'local');assert.equal(result.fallbackReason,'viewer_minute');
});
test('application budget refusal serves Local guide and migration contains quota trigger',async()=>{
 const response=await handleGuideRequest(request('mars','Could I live here?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider(),reserve:async()=>({allowed:false,reason:'lifetime_budget'})});
 const result=await response.json();assert.equal(result.mode,'local');assert.equal(result.fallbackReason,'lifetime_budget');
 const sql=await readFile(new URL('../drizzle/0000_guide_limits.sql',import.meta.url),'utf8');
 assert.match(sql,/guide_requests/);assert.match(sql,/guide_budget_totals/);assert.match(sql,/CREATE TRIGGER `guide_requests_budget_insert`/);
});
