import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'vite';

const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
after(()=>vite.close());
const {handleGuideRequest}=await vite.ssrLoadModule('/worker/guide/endpoint.ts');
const {GUIDE_CONVERSATION_LIMITS,appendConversationTurn,issueConversationToken,readConversationToken}=await vite.ssrLoadModule('/worker/guide/conversation.ts');

const secret='conversation-test-secret-32-characters';
const db={prepare(){return {bind(){return this},async run(){return {success:true}},async first(){return null},async all(){return {results:[]}}}}};
const allowed=async()=>({allowed:true,reason:'reserved'});
const nav={atUtcMs:Date.UTC(2026,9,3),positionAU:[1,0,0],basis:'navigation-estimate',anchorId:'earth'};
let sequence=0;
function request(selectedId,question,conversationToken){
 sequence++;
 return new Request('https://example.test/api/guide',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'203.0.113.9'},body:JSON.stringify({requestId:`10000000-0000-4000-8000-${String(sequence).padStart(12,'0')}`,selectedId,question,conversationToken,navigation:nav})});
}
function provider(output={segments:[{text:'A concise grounded answer.'}],citationIds:[]},capture){
 return async(_url,options)=>{
  capture?.(JSON.parse(String(options.body)));
  return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}],usage:{input_tokens:480,output_tokens:38}}),{status:200,headers:{'content-type':'application/json'}});
 };
}
async function ask(selectedId,question,conversationToken,output,extra={}){
 const response=await handleGuideRequest(request(selectedId,question,conversationToken),{DB:db,OPENAI_API_KEY:'server-key',GUIDE_CONVERSATION_SECRET:secret},{fetchImpl:provider(output),reserve:allowed,...extra});
 assert.equal(response.status,200);
 return response.json();
}

test('signed conversation resolves Why and keeps the previous intent without trusting browser facts',async()=>{
 const first=await ask('mars','Could I survive there?',undefined,{segments:[{text:'Mars is hostile to an unprotected human.'}],citationIds:[]});
 assert.equal(first.resolution.subjectId,'mars');assert.equal(first.resolution.intent,'habitability');assert.ok(first.conversation.token);
 let providerBody;
 const secondResponse=await handleGuideRequest(request('mars','Why?',first.conversation.token),{DB:db,OPENAI_API_KEY:'server-key',GUIDE_CONVERSATION_SECRET:secret},{fetchImpl:provider({segments:[{text:'The environment lacks the conditions an unprotected human needs.'}],citationIds:[]},body=>{providerBody=JSON.parse(body.input[0].content[0].text)}),reserve:allowed});
 const second=await secondResponse.json();
 assert.equal(second.resolution.subjectId,'mars');assert.equal(second.resolution.intent,'habitability');assert.equal(second.resolution.usedConversation,true);
 assert.equal(providerBody.recentConversation.length,1);assert.equal(providerBody.conversationPolicy.includes('not scientific evidence'),true);
 assert.equal(second.conversation.turnCount,2);
});

test('pronouns, companions and comparisons follow the last resolved subject',async()=>{
 const first=await ask('earth','Why is Jupiter so massive?',undefined,{segments:[{text:'Jupiter accumulated a great deal of gas early in Solar System history.'}],citationIds:[]});
 assert.equal(first.resolution.subjectId,'jupiter');
 const moons=await ask('earth','What about its moons?',first.conversation.token,{segments:[{text:'Its moon system includes very different worlds.'}],citationIds:[]});
 assert.equal(moons.resolution.subjectId,'jupiter');assert.equal(moons.resolution.intent,'companions');assert.equal(moons.resolution.usedConversation,true);
 const comparison=await ask('earth','How does that compare with Earth?',moons.conversation.token,{segments:[{text:'They are fundamentally different kinds of worlds.'}],citationIds:[]});
 assert.equal(comparison.resolution.subjectId,'jupiter');assert.equal(comparison.resolution.comparisonId,'earth');assert.equal(comparison.resolution.intent,'comparison');
});

test('changing the selected object breaks stale pronouns and uses the new scene subject',async()=>{
 const first=await ask('jupiter','Could I survive there?',undefined,{segments:[{text:'Not without extraordinary protection.'}],citationIds:[]});
 const changed=await ask('mars','Could I survive there?',first.conversation.token,{segments:[{text:'Mars is also hostile without protection.'}],citationIds:[]});
 assert.equal(changed.resolution.selectedId,'mars');assert.equal(changed.resolution.subjectId,'mars');assert.equal(changed.resolution.usedConversation,false);
});

test('tampered or reset context cannot steer reference resolution',async()=>{
 const first=await ask('mars','Could I survive there?',undefined,{segments:[{text:'Mars is hostile without protection.'}],citationIds:[]});
 const tampered=first.conversation.token.slice(0,-1)+(first.conversation.token.endsWith('a')?'b':'a');
 const reset=await ask('earth','Why?',tampered,{segments:[{text:'The question begins a new Earth conversation.'}],citationIds:[]});
 assert.equal(reset.resolution.subjectId,'earth');assert.equal(reset.resolution.intent,'overview');assert.equal(reset.resolution.usedConversation,false);assert.equal(reset.conversation.reset,true);
 const fresh=await ask('earth','Why?',undefined,{segments:[{text:'This is also a fresh Earth conversation.'}],citationIds:[]});
 assert.equal(fresh.resolution.subjectId,'earth');assert.equal(fresh.conversation.turnCount,1);assert.equal(fresh.conversation.reset,false);
});

test('conversation tokens retain only the bounded recent window and expire',async()=>{
 let state={context:{turns:[]},turnCount:0,reset:false};
 const resolution={selectedId:'mars',subjectId:'mars',subjectName:'Mars',comparisonId:null,intent:'overview',usedConversation:false,interpretation:'fixture'};
 for(let index=0;index<8;index++)state=appendConversationTurn(state,`Question ${index}`,'Bounded answer.',resolution);
 assert.equal(state.context.turns.length,GUIDE_CONVERSATION_LIMITS.retainedTurns);assert.equal(state.turnCount,8);
 const now=Date.UTC(2026,9,3);
 const issued=await issueConversationToken(state,secret,now);assert.ok(issued.token.length<GUIDE_CONVERSATION_LIMITS.tokenCharacters);
 const valid=await readConversationToken(issued.token,secret,now+1_000);assert.equal(valid.context.turns.length,3);assert.equal(valid.turnCount,8);
 const expired=await readConversationToken(issued.token,secret,now+GUIDE_CONVERSATION_LIMITS.ttlMs+1);assert.equal(expired.context.turns.length,0);assert.equal(expired.reset,true);
});

test('quota refusal and provider failure still return Local guide without extra calls and keep bounded continuity',async()=>{
 const first=await ask('mars','Could I survive there?',undefined,{segments:[{text:'Mars is hostile without protection.'}],citationIds:[]});
 let calls=0;
 const refused=await handleGuideRequest(request('mars','Why?',first.conversation.token),{DB:db,OPENAI_API_KEY:'server-key',GUIDE_CONVERSATION_SECRET:secret},{fetchImpl:async()=>{calls++;return provider()()},reserve:async()=>({allowed:false,reason:'viewer_minute'})});
 const local=await refused.json();assert.equal(calls,0);assert.equal(local.mode,'local');assert.equal(local.fallbackReason,'viewer_minute');assert.equal(local.resolution.intent,'habitability');assert.equal(local.conversation.turnCount,2);
 const failed=await handleGuideRequest(request('mars','Tell me more.',local.conversation.token),{DB:db,OPENAI_API_KEY:'server-key',GUIDE_CONVERSATION_SECRET:secret},{fetchImpl:async()=>{calls++;return new Response('{}',{status:503})},reserve:allowed});
 const failure=await failed.json();assert.equal(calls,1);assert.equal(failure.mode,'local');assert.equal(failure.fallbackReason,'provider_http_503');assert.equal(failure.conversation.turnCount,3);
});

test('current mission follow-up keeps retrieval and citation validation on the resolved subject',async()=>{
 const first=await ask('earth','Tell me about Mars.',undefined,{segments:[{text:'Mars is a rocky planet.'}],citationIds:[]});
 const external={id:'external-mars-official',label:'Current official information for Mars',value:'NASA describes current Mars exploration missions.',quality:'authoritative external snapshot',note:'Retrieved from NASA.',sources:[{title:'NASA Mars',url:'https://science.nasa.gov/mars/'}],sourceClass:'authoritative-external',retrievedAt:'2026-10-03T00:00:00.000Z'};
 const follow=await ask('earth','What mission discovered that?',first.conversation.token,{segments:[{text:'The current official source describes Mars exploration.'}],citationIds:[external.id]},{retrieve:async()=>({status:'retrieved',note:'Retrieved NASA.',retrievedAt:external.retrievedAt,evidence:[external]})});
 assert.equal(follow.resolution.subjectId,'mars');assert.equal(follow.resolution.intent,'missions');assert.equal(follow.evidence.length,1);assert.equal(follow.evidence[0].sources[0].url,'https://science.nasa.gov/mars/');
});

test('chat UI exposes reset and keeps Local presets outside the signed server conversation',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 assert.match(page,/New conversation/);assert.match(page,/resetGuideConversation/);assert.match(page,/guideConversationToken/);assert.match(page,/guideTranscript\.map/);
 const localPresetBody=page.slice(page.indexOf('const askLocalPreset'),page.indexOf('const touchMove'));
 assert.match(localPresetBody,/setGuideTranscript/);assert.doesNotMatch(localPresetBody,/guideConversationToken|setGuideConversationToken|requestGuide|fetch\(/);
});
