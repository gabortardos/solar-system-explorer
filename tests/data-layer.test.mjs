import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {catalog,getBody,validateCatalog}=await vite.ssrLoadModule('/app/data/catalog.ts');
const {calculatePosition,keplerCartesian,toSceneAxes,MODEL_START,MODEL_END}=await vite.ssrLoadModule('/app/data/positions.ts');
const {calculateDistance,dynamicValues}=await vite.ssrLoadModule('/app/data/dynamic.ts');
const {bodies,position}=await vite.ssrLoadModule('/app/astronomy.ts');
const {answerGuide}=await vite.ssrLoadModule('/app/guide.ts');
const {buildObjectInformation}=await vite.ssrLoadModule('/app/object-information.tsx');
const {buildDistanceComparison,distanceTargets}=await vite.ssrLoadModule('/app/distance-comparison.tsx');
const {catalogSearchProvider,normalizeSearchText}=await vite.ssrLoadModule('/app/search.ts');
const epoch=Date.UTC(2000,0,1,12);

test('32-body catalogue has valid units, provenance, missing reasons and parent relationships',()=>{
 assert.equal(catalog.length,32);
 assert.equal(catalog.filter(b=>b.category==='moon').length,21);
 assert.deepEqual(validateCatalog(),[]);
 assert.equal(getBody('charon').parentId,'pluto');
 assert.equal(getBody('ceres').category,'dwarf-planet');
 assert.equal(getBody('imaginary'),undefined);
 const invalid=structuredClone(catalog);
 invalid[0].physical.radiusKm.sourceIds=['invented-source'];
 assert.ok(validateCatalog(invalid).some(e=>e.includes('unresolved source')));
 const cycle=structuredClone(catalog);cycle.find(b=>b.id==='earth').parentId='moon';
 assert.ok(validateCatalog(cycle).some(e=>e.includes('parent cycle')));
 const duplicateAlias=structuredClone(catalog);duplicateAlias.find(b=>b.id==='mars').aliases=['Terra'];
 assert.ok(validateCatalog(duplicateAlias).some(e=>e.includes('duplicate alias')));
});
test('catalogue search ranks exact names and aliases and always returns bounded results',async()=>{
 assert.ok(getBody('sun').aliases.includes('Sol'));
 assert.equal(normalizeSearchText('  134340—PLUTO  '),'134340 pluto');
 const earth=await catalogSearchProvider.search('Earth');
 assert.equal(earth.results[0].id,'earth');
 assert.equal(earth.results[0].sceneAvailable,true);
 const luna=await catalogSearchProvider.search('luna');
 assert.equal(luna.results[0].id,'moon');
 assert.equal(luna.results[0].matchedAlias,'Luna');
 const jovianMoons=await catalogSearchProvider.search('moon jupiter');
 assert.ok(jovianMoons.results.some(result=>result.id==='io'));
 assert.ok(jovianMoons.results.every(result=>result.type==='Moon'&&result.context==='Orbits Jupiter'));
 const ceres=await catalogSearchProvider.search('1 Ceres');
 assert.equal(ceres.results[0].id,'ceres');
 assert.equal(ceres.results[0].sceneAvailable,false);
 const bounded=await catalogSearchProvider.search('',{limit:5});
 assert.equal(bounded.results.length,5);
 assert.equal(bounded.total,32);
 assert.equal(bounded.hasMore,true);
 const hardCapped=await catalogSearchProvider.search('',{limit:5000});
 assert.equal(hardCapped.results.length,32);
});
test('reference values retain source units, uncertainty and distinct conventions',()=>{
 assert.equal(getBody('ceres').physical.massKg.value,9.38416e20);
 assert.equal(getBody('pluto').physical.radiusKm.value,1188.3);
 assert.equal(getBody('pluto').physical.radiusKm.uncertainty,1.6);
 assert.equal(getBody('sun').physical.radiusKm.quality,'nominal');
 assert.equal(getBody('sun').orbit.periodDays.value,null);
 assert.equal(getBody('titan').physical.gmKm3S2.value,8978.13710);
 assert.equal(getBody('venus').physical.rotationHours.value,-243.018*24);
 assert.equal(getBody('saturn').physical.rotationHours.value,.44401*24);
 assert.equal(getBody('io').physical.rotationHours.value,null,'do not silently use orbital period as spin');
 assert.equal(getBody('ariel').orbit.frame,'parent-equatorial');
 assert.equal(getBody('triton').orbit.inclinationDeg.value,157.3);
});
test('missing positions and out-of-range dates fail explicitly, never as zero coordinates',()=>{
 for(const id of ['ceres','pluto','charon','invented']){
  const p=calculatePosition(id,epoch);assert.equal(p.status,'unavailable');assert.equal(p.value,null);assert.ok(p.reason);
  assert.equal(calculateDistance(id,'earth',epoch).value,null);
 }
 for(const time of [NaN,Infinity,MODEL_START-1,MODEL_END])assert.equal(calculatePosition('earth',time).status,'unavailable');
 assert.equal(calculatePosition('earth',MODEL_START).status,'available');
 assert.equal(calculatePosition('earth',MODEL_END-1).status,'available');
 assert.throws(()=>position(bodies.find(b=>b.id==='earth'),MODEL_END),RangeError);
});
test('Kepler solver and axis conversion obey independent geometric cases',()=>{
 const p=keplerCartesian(2,.5,0,0,0,0);
 assert.ok(Math.abs(p[0]-1)<1e-12);assert.ok(Math.hypot(p[1],p[2])<1e-12);
 assert.ok(Math.abs(keplerCartesian(2,.5,0,0,0,180)[0]+3)<1e-12);
 const polar=keplerCartesian(1,0,90,0,0,90);
 assert.ok(Math.abs(polar[2]-1)<1e-12);
 assert.deepEqual(toSceneAxes([1,2,3]),[1,3,-2]);
});
test('dynamic results stay local, timestamped, reproducible and distinct from live observations',()=>{
 const before=JSON.stringify(catalog),oldFetch=globalThis.fetch;
 globalThis.fetch=()=>{throw Error('Runtime astronomy API request');};
 try {
  const d=dynamicValues('moon',epoch);
  assert.equal(d.position.quality,'illustrative');
  assert.equal(d.position.atUtcMs,epoch);
  assert.equal(d.observations.value,null);
  assert.deepEqual(d,dynamicValues('moon',epoch));
  assert.notDeepEqual(d.position.value,dynamicValues('moon',epoch+86400000).position.value);
  const sunEarth=calculateDistance('sun','earth',epoch);
  assert.ok(sunEarth.value>147e6&&sunEarth.value<153e6);
  assert.equal(sunEarth.value,calculateDistance('earth','sun',epoch).value);
  assert.equal(JSON.stringify(catalog),before);
 } finally {globalThis.fetch=oldFetch;}
});
test('existing scene and guide consume canonical physical values and disclose approximations',()=>{
 assert.equal(bodies.length,29);
 for(const b of bodies){assert.equal(b.radius,getBody(b.id).physical.radiusKm.value);assert.equal(b.day,getBody(b.id).physical.rotationHours.value);}
 const sun=bodies.find(b=>b.id==='sun'),moon=bodies.find(b=>b.id==='moon'),venus=bodies.find(b=>b.id==='venus');
 assert.match(answerGuide(sun,'rotation',epoch).answer,/varies with latitude/);
 assert.match(answerGuide(moon,'distance',epoch).answer,/illustrative/);
 assert.match(answerGuide(venus,'rotation',epoch).source,/jpl/);
 assert.match(answerGuide(venus,'distance',MODEL_END).answer,/unavailable/i);
});
test('major moons retain parent-relative mean-orbit bounds and explicit illustrative quality',()=>{
 for(const id of ['phobos','deimos','io','europa','ganymede','callisto','mimas','enceladus','tethys','dione','rhea','titan','iapetus','miranda','ariel','umbriel','titania','oberon','triton']){
  const body=getBody(id),moon=calculatePosition(id,epoch),parent=calculatePosition(body.parentId,epoch);
  assert.equal(moon.status,'available');assert.equal(moon.quality,'illustrative');assert.match(moon.accuracyNote,/no validated position-error bound/i);
  const separation=Math.hypot(...moon.value.map((v,i)=>v-parent.value[i]))*149597870.7,a=body.orbit.semimajorAxisKm.value,e=body.orbit.eccentricity.value;
  assert.ok(separation>=a*(1-e)-1e-5&&separation<=a*(1+e)+1e-5,`${id} separation stays on its source ellipse`);
 }
 assert.equal(calculatePosition('charon',epoch).status,'unavailable','Charon waits for a Pluto parent position');
});
test('object information is type-aware and omits unavailable or meaningless fields',()=>{
 const earth=buildObjectInformation('earth'),moon=buildObjectInformation('moon'),sun=buildObjectInformation('sun'),uranus=buildObjectInformation('uranus');
 assert.equal(earth.type,'Terrestrial planet');
 assert.equal(earth.parent,'Sun');
 assert.ok(earth.facts.some(f=>f.label==='Mass'));
 assert.ok(earth.narratives.some(f=>f.label==='Scientific importance'));
 assert.equal(moon.parent,'Earth');
 assert.ok(moon.facts.some(f=>f.label==='Orbit around Earth'));
 assert.equal(sun.parent,undefined);
 assert.ok(sun.facts.some(f=>f.label==='Nominal radius'));
 assert.ok(!sun.facts.some(f=>f.label==='Mass'||f.label==='Orbital period'));
 assert.ok(!sun.narratives.some(f=>f.label==='Discovery'));
 assert.match(uranus.narratives.find(f=>f.label==='Discovery').text,/William Herschel.*1781/);
 for(const model of [earth,moon,sun,uranus])for(const field of [...model.facts,...model.narratives])assert.ok(field.value??field.text);
 assert.equal(buildObjectInformation('unknown'),null);
});
test('distance comparisons distinguish simulated, average and spacecraft values',()=>{
 const earthSun=buildDistanceComparison('earth','sun',epoch);
 assert.equal(earthSun.status,'available');assert.equal(earthSun.basis,'simulated-position');
 assert.match(earthSun.primary,/million km/);assert.match(earthSun.secondary,/km.*AU/);assert.match(earthSun.average,/million km/);
 const moonEarth=buildDistanceComparison('moon','earth',epoch);
 assert.equal(moonEarth.quality,'illustrative');assert.match(moonEarth.primary,/km/);assert.match(moonEarth.average,/km/);
 const spacecraft=buildDistanceComparison('mars','spacecraft',epoch,{valueKm:42000,atUtcMs:epoch,note:'Navigation estimate.'});
 assert.equal(spacecraft.basis,'spacecraft-estimate');assert.equal(spacecraft.primary,'42,000 km');assert.equal(spacecraft.average,undefined);
 const options=distanceTargets('moon');assert.equal(options[0].value,'earth');assert.match(options[0].label,/parent orbit/);assert.ok(options.some(option=>option.value==='spacecraft'));
 assert.equal(new Set(options.map(option=>option.value)).size,options.length);
});
