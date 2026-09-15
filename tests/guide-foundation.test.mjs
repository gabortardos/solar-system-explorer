import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
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
test('missing position and unsupported subject are explicit',()=>{
 assert.equal(answerContextGuide(buildGuideContext('pluto',nav),'How far from Earth?').evidence[0].value,'Unavailable');
 assert.match(answerContextGuide(buildGuideContext('absent',nav),'Could I live here?').explanation,/Select an object/);
 assert.equal(buildGuideContext('earth',{...nav,positionAU:null}).nearby.length,0);
});
test('provider output refuses numerical prose and fabricated citations',()=>{
 const evidence=answerContextGuide(buildGuideContext('earth',nav),'gravity').evidence;
 assert.equal(validateExplanation({segments:[{evidenceId:'radius'}]},evidence),true);
 for(const segments of [[{text:'Radius is 42 km'}],[{text:'forty million miles'}],[{evidenceId:'invented'}]])assert.equal(validateExplanation({segments},evidence),false);
 assert.throws(()=>answerContextGuide(buildGuideContext('earth',nav),'x'.repeat(601)));
});
test('explicit other-world question requests a selection instead of answering the wrong world',()=>{
 assert.match(answerContextGuide(buildGuideContext('earth',nav),'Could I live on Mars?').explanation,/Please select/);
});
test('minor selection cannot silently receive an Earth answer',()=>{
 const c=buildGuideContext('earth',{...nav,selectedMinor:{id:'sb-test',name:'Test minor',physical:[],source:{url:'https://ssd.jpl.nasa.gov/'}}});
 const a=answerContextGuide(c,'Could I live here?');assert.equal(a.subject,'Test minor');assert.match(a.explanation,/No planet answer/);
});
