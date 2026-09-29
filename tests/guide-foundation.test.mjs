import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {readFile} from 'node:fs/promises';
const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
after(()=>vite.close());
const {buildGuideContext}=await vite.ssrLoadModule('/app/guide-context.ts');
const {answerContextGuide,validateExplanation}=await vite.ssrLoadModule('/app/guide-assistant.ts');
const nav={atUtcMs:Date.UTC(2026,8,15),positionAU:[1,0,0],basis:'navigation-estimate',anchorId:'earth',note:'Navigation estimate',selectedMinor:null};
test('here binds to selected world and answer retains request timestamp',()=>{
 const c=buildGuideContext('mars',nav),a=answerContextGuide(c,'Could I live here?');
 assert.equal(a.subject,'Mars');assert.match(a.explanation,/pressurized habitats/);assert.match(a.contextNote,/not.*arrived/);
 nav.positionAU[0]=2;assert.equal(c.navigation.positionAU[0],1);assert.equal(a.atUtcMs,Date.UTC(2026,8,15));
});
test('nearby is bounded, ordered, incomplete and inherits navigation-estimate quality',()=>{
 const c=buildGuideContext('earth',nav),a=answerContextGuide(c,'What is nearby?');
 assert.equal(c.nearby.length,5);assert.ok(c.nearby.every((v,i)=>!i||v.distanceKm>=c.nearby[i-1].distanceKm));assert.match(a.explanation,/Not a complete/);assert.ok(a.evidence.every(f=>f.quality==='navigation-estimate'));
});
test('reference values preserve sources and missing mass is never invented',()=>{
 const a=answerContextGuide(buildGuideContext('phobos',nav),'What are its facts?');
 assert.equal(a.evidence.find(f=>f.id==='mass').value,'Unavailable');assert.ok(a.evidence.find(f=>f.id==='radius').sources.length);
});
test('new destination position and unsupported subject are explicit',()=>{
 assert.notEqual(answerContextGuide(buildGuideContext('pluto',nav),'How far from Earth?').evidence[0].value,'Unavailable');
 assert.match(answerContextGuide(buildGuideContext('absent',nav),'Could I live here?').explanation,/Select an object/);
 assert.equal(buildGuideContext('earth',{...nav,positionAU:null}).nearby.length,0);
});
test('provider output allows natural prose but refuses unsupported exact values and fabricated citations',()=>{
 const evidence=answerContextGuide(buildGuideContext('earth',nav),'gravity').evidence;
 assert.equal(validateExplanation({segments:[{evidenceId:'radius'}],citationIds:['radius']},evidence),true);
 assert.equal(validateExplanation({segments:[{text:'Yes. Dogs live on Earth alongside people, and they have done so for a very long time.'}],citationIds:[]},evidence),true);
 assert.equal(validateExplanation({segments:[{text:'One reason Mars looks red is iron-rich dust on its surface.'}],citationIds:[]},evidence),true);
 for(const segments of [[{text:'Radius is 42 km'}],[{text:'forty million miles'}],[{text:'Jupiter has ninety moons.'}],[{evidenceId:'invented'}]])assert.equal(validateExplanation({segments,citationIds:[]},evidence),false);
 assert.equal(validateExplanation({segments:[{text:'A made-up source says so.'}],citationIds:['invented']},evidence),false);
 const external={id:'external-mars',label:'NASA Mars status',value:'NASA has four active missions at Mars.',quality:'authoritative external snapshot',note:'Retrieved.',sources:[{title:'NASA Mars',url:'https://science.nasa.gov/mars/'}],sourceClass:'authoritative-external'};
 assert.equal(validateExplanation({segments:[{text:'NASA reports four active missions at Mars.'}],citationIds:['external-mars']},[...evidence,external]),true);
 assert.equal(validateExplanation({segments:[{text:'NASA reports five active missions at Mars.'}],citationIds:['external-mars']},[...evidence,external]),false);
 assert.throws(()=>answerContextGuide(buildGuideContext('earth',nav),'x'.repeat(601)));
});
test('explicit named world resolves without answering for the wrong selection',()=>{
 const answer=answerContextGuide(buildGuideContext('earth',nav),'Could I live on Mars?');
 assert.equal(answer.subject,'Mars');assert.equal(answer.resolution.subjectId,'mars');
});
test('minor selection cannot silently receive an Earth answer',()=>{
 const c=buildGuideContext('earth',{...nav,selectedMinor:{id:'sb-test',name:'Test minor',physical:[],source:{url:'https://ssd.jpl.nasa.gov/'}}});
 const a=answerContextGuide(c,'Could I live here?');assert.equal(a.subject,'Test minor');assert.match(a.explanation,/No planet answer/);
});
test('page no longer calls removed legacy guide state setters',async()=>{
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(page,/setAnswer\(|setGuideSource\(/);
});
