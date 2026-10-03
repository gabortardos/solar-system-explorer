import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {readFile} from 'node:fs/promises';

const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
after(()=>vite.close());
const {buildGuideContext}=await vite.ssrLoadModule('/app/guide-context.ts');
const {answerContextGuide}=await vite.ssrLoadModule('/app/guide-assistant.ts');
const {guideHealth,handleGuideRequest}=await vite.ssrLoadModule('/worker/guide/endpoint.ts');
const {retrieveAuthoritativeEvidence}=await vite.ssrLoadModule('/worker/guide/authoritative-sources.ts');
const {LIVE_GUIDE_LIMITS,readGuideQuotaState,reserveGuideRequest}=await vite.ssrLoadModule('/worker/guide/limits.ts');

const nav={atUtcMs:Date.UTC(2026,8,21),positionAU:[1,0,0],basis:'navigation-estimate',anchorId:'earth',note:'untrusted client note',selectedMinor:null};
const allowed=async()=>({allowed:true,reason:'reserved'});
const db={prepare(){return {bind(){return this},async run(){return {success:true}},async first(){return null},async all(){return {results:[]}}}}};
let sequence=0;
function request(selectedId,question,extra={}){
 sequence++;
 return new Request('https://example.test/api/guide',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'203.0.113.7'},body:JSON.stringify({requestId:`00000000-0000-4000-8000-${String(sequence).padStart(12,'0')}`,selectedId,question,navigation:{...nav,...extra}})});
}
function provider(output={segments:[{text:'The structured evidence supports this answer.'},{evidenceId:'habitability'}],citationIds:[]}){
 const normalized={citationIds:[],...output};
 return async()=>new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(normalized)}]}],usage:{input_tokens:420,output_tokens:32}}),{status:200,headers:{'content-type':'application/json'}});
}
function quotaDb(stats,inserted=true){
 return {
  prepare(sql){return {
   bind(){return {
    async first(){
     if(sql.startsWith('SELECT request_id'))return null;
     if(sql.includes('AS viewer_minute'))return stats;
     if(sql.startsWith('INSERT INTO guide_requests'))return inserted?{request_id:'reserved'}:null;
     return null;
    },
   };},
  };},
 };
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
 assert.match(captured,/ordinary general scientific knowledge/);
});
test('authenticated owner bypasses request counts while public and monetary limits remain enforced',async()=>{
 assert.equal(LIVE_GUIDE_LIMITS.viewerPerMinute,10);assert.equal(LIVE_GUIDE_LIMITS.viewerPerDay,50);assert.equal(LIVE_GUIDE_LIMITS.globalPerMinute,10);
 assert.equal(LIVE_GUIDE_LIMITS.rolling31DayMicrousd,2_000_000);assert.equal(LIVE_GUIDE_LIMITS.lifetimeMicrousd,4_000_000);
 const saturated={viewer_minute:10,viewer_day:50,global_minute:10,global_day:100,global_month:1_000,rolling_cost:0,lifetime_cost:0};
 assert.equal((await reserveGuideRequest(quotaDb(saturated),'public-request','public-hash',Date.now())).reason,'viewer_minute');
 assert.equal((await reserveGuideRequest(quotaDb(saturated),'developer-request','developer:owner-hash',Date.now(),{bypassRequestCounts:true})).allowed,true);
 assert.equal((await reserveGuideRequest(quotaDb(saturated),'forged-bypass','public-hash',Date.now(),{bypassRequestCounts:true})).allowed,false);
 const budgetFull={...saturated,rolling_cost:LIVE_GUIDE_LIMITS.rolling31DayMicrousd};
 assert.equal((await reserveGuideRequest(quotaDb(budgetFull),'developer-budget','developer:owner-hash',Date.now(),{bypassRequestCounts:true})).reason,'rolling_budget');

 const ownerRequest=request('mars','Could I live here?');ownerRequest.headers.set('oai-authenticated-user-email','owner@example.com');
 let ownerPolicy,ownerViewerHash='';
 const response=await handleGuideRequest(ownerRequest,{DB:db,OPENAI_API_KEY:'server-secret',GUIDE_OWNER_EMAIL:'OWNER@example.com'},{fetchImpl:provider(),reserve:async(_db,_id,viewerHash,_now,policy)=>{ownerViewerHash=viewerHash;ownerPolicy=policy;return allowed();}});
 assert.equal((await response.json()).mode,'live');assert.match(ownerViewerHash,/^developer:/);assert.equal(ownerPolicy.bypassRequestCounts,true);
 const health=await guideHealth(ownerRequest,{DB:db,OPENAI_API_KEY:'server-secret',GUIDE_OWNER_EMAIL:'owner@example.com'});
 assert.equal((await health.json()).access.developer,true);
});
test('server quota state reports real rolling counts and reset times without identifiers',async()=>{
 const now=Date.UTC(2026,8,22,14,0),minuteOldest=now-25_000,dayOldest=now-3_600_000;
 const stats={viewer_minute:10,viewer_day:50,minute_oldest:minuteOldest,day_oldest:dayOldest,global_minute:0,global_day:0,global_month:0,rolling_cost:0,lifetime_cost:0};
 const refused=await reserveGuideRequest(quotaDb(stats),'quota-refusal','public-hash',now);
 assert.equal(refused.reason,'viewer_minute');assert.deepEqual(refused.quota.public,{minuteUsed:10,minuteLimit:10,rolling24HoursUsed:50,rolling24HoursLimit:50,minuteResetAt:minuteOldest+60_000,rolling24HoursResetAt:dayOldest+86_400_000});
 const current=await readGuideQuotaState(quotaDb(stats),'public-hash',now);
 assert.deepEqual(current,refused.quota);assert.doesNotMatch(JSON.stringify(current),/public-hash|viewer_hash|database/i);
 assert.deepEqual(await readGuideQuotaState(quotaDb(stats),'developer:owner',now,true),{developer:true,public:null});
});
test('natural qualitative answers work across the requested planet and moon examples',async()=>{
 const examples=[
  ['earth','Are there dogs on Earth?','Yes. Dogs live on Earth alongside people.','earth'],
  ['mars','Why is Mars red?','Mars looks red because iron-rich minerals in its surface dust have oxidized.','mars'],
  ['europa','Could humans live here?','Europa is hostile to unprotected humans because it is intensely cold, airless, and exposed to strong radiation.','europa'],
  ['jupiter','Why does this planet have so many moons?','Jupiter is massive, with strong gravity and a long history of gathering and retaining many different kinds of moons.','jupiter'],
  ['moon','What would happen if I jumped here?','You would rise higher and remain airborne longer than on Earth because the Moon has weaker gravity.','moon'],
 ];
 for(const [selectedId,question,answer,subjectId] of examples){
  const response=await handleGuideRequest(request(selectedId,question),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:answer}]}),reserve:allowed});
  const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.resolution.subjectId,subjectId);assert.equal(result.explanation,answer);assert.deepEqual(result.evidence,[]);
 }
});
test('current Mars distance remains structured and only cited evidence is returned',async()=>{
 const response=await handleGuideRequest(request('mars','How far is this planet from Earth right now?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:'At the captured simulation time, the modeled center-to-center distance is:'},{evidenceId:'body-distance'}]}),reserve:allowed});
 const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.resolution.subjectId,'mars');assert.equal(result.evidence.length,1);assert.equal(result.evidence[0].id,'body-distance');assert.match(result.explanation,/Distance from Earth: .* km/);
});
test('structured radius remains project-authoritative',async()=>{
 const response=await handleGuideRequest(request('mars',"What is Mars's radius?"),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:'The project value is:'},{evidenceId:'radius'}],citationIds:['radius']}),reserve:allowed});
 const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.evidence.length,1);assert.equal(result.evidence[0].id,'radius');assert.equal(result.evidence[0].sourceClass,'project-structured');assert.match(result.explanation,/Mars radius: .* km/);
});
test('current mission answers use retrieved authoritative evidence and actual citations',async()=>{
 let captured='';
 const external={id:'external-mars-official',label:'Current official information for Mars',value:'NASA lists Perseverance and Curiosity as active surface missions, with active orbiters supporting science and communications.',quality:'authoritative external snapshot',note:'Retrieved from NASA.',sources:[{title:'NASA Mars',url:'https://science.nasa.gov/mars/'}],sourceClass:'authoritative-external',retrievedAt:'2026-09-21T00:00:00.000Z'};
 const fetchImpl=async(_url,options)=>{captured=String(options.body);return provider({segments:[{text:'NASA currently identifies Perseverance and Curiosity as active Mars rovers, alongside active orbiters.'}],citationIds:[external.id]})(_url,options)};
 const response=await handleGuideRequest(request('mars','What is the latest active mission at Mars?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl,reserve:allowed,retrieve:async()=>({status:'retrieved',note:'Retrieved NASA.',retrievedAt:external.retrievedAt,evidence:[external]})});
 const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.external.status,'retrieved');assert.equal(result.evidence.length,1);assert.equal(result.evidence[0].sources[0].url,'https://science.nasa.gov/mars/');assert.match(captured,/project-structured.*authoritative-external.*model-general-knowledge/);
});
test('retrieval is bounded to the registered official source and records freshness',async()=>{
 const local=answerContextGuide(buildGuideContext('mars',nav),'What is the latest active mission at Mars?');
 let requested='';
 const result=await retrieveAuthoritativeEvidence('What is the latest active mission at Mars?',local,async url=>{requested=String(url);return new Response('<html><body><h2>How We Explore Mars</h2><p>Perseverance Mars Rover | Active Mission</p><p>Curiosity Mars Rover | Active Mission</p><p>Mars Reconnaissance Orbiter | Active Mission</p></body></html>',{status:200,headers:{'content-type':'text/html'}})},Date.UTC(2026,8,21));
 assert.equal(requested,'https://science.nasa.gov/mars/');assert.equal(result.status,'retrieved');assert.equal(result.evidence.length,1);assert.equal(result.evidence[0].sourceClass,'authoritative-external');assert.equal(result.evidence[0].retrievedAt,'2026-09-21T00:00:00.000Z');
});
test('unavailable current retrieval is disclosed instead of guessed from memory',async()=>{
 const response=await handleGuideRequest(request('mars','What missions are active at Mars now?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:'I could not verify current mission status from the authoritative source, so I will not guess.'}],citationIds:[]}),reserve:allowed,retrieve:async()=>({status:'unavailable',note:'Current authoritative information could not be retrieved.',evidence:[]})});
 const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.external.status,'unavailable');assert.match(result.explanation,/could not verify/i);assert.deepEqual(result.evidence,[]);
});
test('source conflicts are explicit and project data remains authoritative',async()=>{
 const external={id:'external-radius',label:'External Mars radius',value:'9999 km',quality:'authoritative external snapshot',note:'Synthetic conflict fixture.',sources:[{title:'NASA Mars',url:'https://science.nasa.gov/mars/'}],sourceClass:'authoritative-external',retrievedAt:'2026-09-21T00:00:00.000Z',claimKey:'radius'};
 const response=await handleGuideRequest(request('mars','What is the current radius of Mars?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:'The external snapshot differs, so the application preserves its reviewed project value:'},{evidenceId:'radius'}],citationIds:['radius','external-radius']}),reserve:allowed,retrieve:async()=>({status:'retrieved',note:'Synthetic conflict fixture.',retrievedAt:external.retrievedAt,evidence:[external]})});
 const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.sourceConflicts.length,1);assert.equal(result.sourceConflicts[0].projectEvidenceId,'radius');assert.match(result.explanation,/Mars radius: (?!9999)/);
});
test('scientific uncertainty remains explicit in natural prose',async()=>{
 const answer='Scientists do not yet know whether life exists beneath Europa’s ice; the ocean is a promising environment, not evidence of life.';
 const response=await handleGuideRequest(request('europa','Do scientists know whether life exists in Europa’s ocean?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:answer}],citationIds:[]}),reserve:allowed});
 const result=await response.json();assert.equal(result.mode,'live');assert.equal(result.explanation,answer);assert.match(result.explanation,/do not yet know/);
});
test('invented external citation IDs fail closed to the Local guide',async()=>{
 const response=await handleGuideRequest(request('mars','What is the latest active mission at Mars?'),{DB:db,OPENAI_API_KEY:'server-secret'},{fetchImpl:provider({segments:[{text:'A mission is active.'}],citationIds:['https://made-up.example/source']}),reserve:allowed,retrieve:async()=>({status:'unavailable',note:'Unavailable.',evidence:[]})});
 const result=await response.json();assert.equal(result.mode,'local');assert.equal(result.fallbackReason,'invalid_model_output');
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
test('guide UI keeps the answer primary and grounds details in an expandable section',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 assert.match(page,/guide-answer-copy/);assert.match(page,/<details className="guide-grounding">/);assert.match(page,/Sources &amp; data/);
 assert.ok(page.indexOf('guide-answer-copy')<page.indexOf('<details className="guide-grounding">'));
});
test('guide UI uses server quota state, clear reset messages, and local-only preset routing',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 assert.match(page,/Live AI.*rolling24HoursUsed.*rolling24HoursLimit/);
 assert.match(page,/Developer access · request-count bypass/);
 assert.match(page,/Live AI limit reached.*requests in the last 24 hours/);
 assert.match(page,/temporarily rate-limited.*seconds/);
 assert.match(page,/localGuidePresets\.map/);
 assert.match(page,/onClick=\{\(\) => askLocalPreset\(q\)\}/);
 const localPresetBody=page.slice(page.indexOf('const askLocalPreset'),page.indexOf('const touchMove'));
 assert.match(localPresetBody,/answerContextGuide/);assert.doesNotMatch(localPresetBody,/requestGuide|fetch\(/);
});
