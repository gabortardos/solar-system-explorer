import {AU,bodies,formatKm,type Body} from './astronomy';
import {getBody} from './data/catalog';
import {calculateDistance} from './data/dynamic';
import {SOURCES} from './data/sources';

import {guide} from './data/guide-education';

export function answerGuide(body:Body,question:string,time:number){
 const q=question.toLowerCase(),entry=guide[body.id],science=getBody(body.id);
 if(!science)return {answer:"Educational information for this body is not yet available.",source:"https://ssd.jpl.nasa.gov/"};
 if(!entry){
  if(/distance|far|compare|size|big|diameter|gravity|weigh|day|rotation|spin|year|orbit|fact|interesting|tell|special|atmosphere|air|gas/.test(q)){
   if(/atmosphere|air|gas/.test(q))return {answer:`${body.name}: ${body.atmosphere}`,source:body.source};
   if(/fact|interesting|tell|special/.test(q))return {answer:body.fact,source:body.source};
  }else return {answer:`A source-reviewed answer for that topic has not yet been added for ${body.name}. The information panel contains the currently verified physical, orbital and educational fields.`,source:body.source};
 }
 const year=body.year;
 let answer:string,source=body.source;
 if(/live|life|stand|survive|habit/.test(q))answer=entry.habitability;
 else if(/distance|far|light|long.*(get|travel)/.test(q)){
  const result=calculateDistance(body.id,'earth',time);
  if(result.status==='unavailable')return {answer:`Distance unavailable: ${result.reason}`,source:SOURCES['jpl-planets'].url};
  const km=result.value;
  answer=body.id==='earth'?'Earth is the reference point. Choose another world to compare its current modeled distance with Earth.':`At the displayed date, the model places ${body.name} about ${formatKm(km)} from Earth (${(km/AU).toFixed(3)} AU). Light crosses that straight-line distance in about ${(km/299792.458/60).toFixed(1)} minutes. A real spacecraft follows a curved transfer orbit, so its journey is much longer than this visual flight.`;
  if(result.quality==='illustrative')answer+=' The lunar model is illustrative and has no validated position-error bound.';
  source=SOURCES[body.id==='moon'?'jpl-sat-elements':'jpl-planets'].url;
 }else if(/compare|size|big|diameter|gravity|weigh/.test(q)){source=SOURCES[science.physical.radiusKm.sourceIds[0]].url;answer=`${body.name} has a ${body.id==='sun'?'nominal':'mean'} diameter of about ${Math.round(body.radius*2).toLocaleString()} km, ${(body.radius/bodies.find(b=>b.id==='earth')!.radius).toFixed(2)} times Earth’s diameter. Its listed gravity is ${body.gravity.toFixed(2)} m/s², so a 70 kg Earth mass would feel like roughly ${(70*body.gravity/9.80665).toFixed(0)} kg of Earth weight at the reference level. ${science.physical.gravityMS2.note}`;}
 else if(/atmosphere|air|breath|gas/.test(q))answer=`${body.name}: ${body.atmosphere} ${entry.habitability}`;
 else if(/temperature|hot|cold|heat/.test(q))answer=entry.temperature;
 else if(/day|rotation|spin/.test(q)){if(body.day===null)return {answer:`A source-backed rotation period for ${body.name} has not yet been imported. Its orbital period is not silently reused as a rotation period.`,source:body.source};source=SOURCES[science.physical.rotationHours.sourceIds[0]].url;answer=body.id==='sun'?'Solar rotation varies with latitude: about 25 Earth days at the equator and 36 at the poles. The Sun has no single rigid rotation period.':`One sidereal rotation takes about ${Math.abs(body.day).toLocaleString()} hours${body.day<0?', in the retrograde direction':''}. A solar day can differ because ${body.name} is moving along its orbit while it rotates.`;}
 else if(/year|orbit|season/.test(q)){source=SOURCES[science.orbit.periodDays.sourceIds[0]??'nasa-sun'].url;answer=body.id==='sun'?'The Sun orbits the center of the Milky Way in roughly 230 million years; the planetary “year” field does not apply to it.':body.category==='moon'?`${body.name} completes one mean orbit around ${getBody(body.parentId!)?.name??body.parentId} in about ${science.orbit.periodDays.value!.toLocaleString()} Earth days. The displayed satellite path is illustrative rather than a precision ephemeris.`:year===null?'Orbital period is unavailable.':`A ${body.name} year lasts about ${year<1?(year*365.25).toFixed(1)+' Earth days':year.toFixed(2)+' Earth years'}. The displayed path uses an approximate Keplerian orbit whose speed naturally varies along the ellipse.`;}
 else if(/moon|ring|satellite/.test(q))answer=entry.companions;
 else if(/mission|spacecraft|probe|explor/.test(q))answer=entry.missions;
 else if(/water|ice|ocean/.test(q))answer=entry.water;
 else if(/fact|interesting|tell|special/.test(q))answer=body.fact;
 else answer=`I can answer curated questions about ${body.name}’s temperature, atmosphere, water, moons or rings, missions, rotation, year, size, gravity, habitability and modeled distance from Earth.`;
 return {answer,source};
}
