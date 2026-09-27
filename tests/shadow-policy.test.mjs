import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
test.after(()=>vite.close());
const {SATURN_RING_SHADOWS,surfaceShadowParticipation}=await vite.ssrLoadModule('/app/shadow-policy.ts');

test('illustrative moons cannot cast or receive enlarged eclipse shadows',()=>{
 for(const id of ['io','europa','ganymede','callisto','mimas','enceladus','titan'])
  assert.deepEqual(surfaceShadowParticipation(id,'moon'),{cast:false,receive:false});
});

test('major planet surfaces retain shadow casting without self or moon shadow reception',()=>{
 for(const id of ['earth','jupiter','saturn'])
  assert.deepEqual(surfaceShadowParticipation(id,'planet'),{cast:true,receive:false});
 assert.deepEqual(surfaceShadowParticipation('sun','star'),{cast:false,receive:false});
});

test('Saturn rings receive Saturn shadow but do not project the coarse alpha sheet onto Saturn',()=>{
 assert.deepEqual(SATURN_RING_SHADOWS,{cast:false,receive:true});
});
