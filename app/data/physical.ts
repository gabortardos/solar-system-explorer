import {missing, quantity as q, type PhysicalProperties} from './schema';

// JPL physical table snapshot: id, mean radius km, radius uncertainty km,
// mass kg, mass uncertainty kg, signed sidereal rotation d, orbital period y, gravity m/s².
// Keep source precision; conversions into h/d/kg below are exact unit conversions.
export const planetPhysicalRows: [string,number,number|null,number,number,number,number,number][] = [
  ['mercury',2439.4,.1,3.30103e23,2.1e19,58.6462,.2408467,3.70],
  ['venus',6051.8,1,4.86731e24,2.3e20,-243.018,.61519726,8.87],
  ['earth',6371.0084,.0001,5.97217e24,2.8e20,.99726968,1.0000174,9.80],
  ['mars',3389.50,.2,6.41691e23,3e19,1.02595676,1.8808476,3.71],
  ['jupiter',69911,6,1.898125e27,8.8e22,.41354,11.862615,24.79],
  ['saturn',58232,6,5.68317e26,2.6e22,.44401,29.447498,10.44],
  ['uranus',25362,7,8.68099e25,4e21,-.71833,84.016846,8.87],
  ['neptune',24622,19,1.024092e26,4.8e21,.67125,164.79132,11.15],
  ['ceres',469.7,null,9.38416e20,1.3e16,.37809042,4.61,.27],
  ['pluto',1188.3,1.6,1.30246e22,6e18,-6.3872,247.92065,.62],
];
const massRefs:Record<string,string> = {mercury:'F',venus:'G',earth:'H',mars:'I',jupiter:'J',saturn:'K',uranus:'L',neptune:'M',ceres:'O',pluto:'N'};
export const physical: Record<string,PhysicalProperties> = Object.fromEntries(planetPhysicalRows.map(([id,r,dr,m,dm,rotation,,g])=>[id,{
  radiusKm:q(r,'km','jpl-physical',`${id}: mean radius, ref ${id==='ceres'?'O':'D'}`,dr),
  massKg:q(m,'kg','jpl-physical',`${id}: mass, ref ${massRefs[id]}`,dm),
  gmKm3S2:missing('km3/s2','Body-specific GM not imported; do not substitute planetary-system GM.'),
  gravityMS2:q(g,'m/s2','jpl-physical',`${id}: equatorial gravity, ref *`,null,'derived','Source-derived gravity at equatorial/reference level; not GM divided by mean-radius squared.'),
  rotationHours:q(rotation*24,'h','jpl-physical',`${id}: sidereal rotation, ref ${id==='ceres'?'Q':id==='earth'?'B':'C'}`,null,'reference','Negative denotes retrograde; gas/ice giant values are reference rotation conventions, not a solid surface.'),
}]));

// JPL satellite physical table: id, radius ± uncertainty km, GM ± uncertainty km³/s², GM reference.
export const satellitePhysicalRows:[string,number,number,number,number,string][] = [
  ['moon',1737.4,.1,4902.800,.001,'DE440'],
  ['phobos',11.08,.04,.0007087,.0000006,'MAR097'],
  ['deimos',6.2,.24,.0000962,.0000028,'MAR097'],
  ['io',1821.49,.50,5959.91547,.00135,'JUP365'],
  ['europa',1560.80,.30,3202.71210,.00181,'JUP365'],
  ['ganymede',2631.20,1.70,9887.83275,.00247,'JUP365'],
  ['callisto',2410.30,1.50,7179.28340,.00324,'JUP365'],
  ['mimas',198.20,.40,2.50349,.00014,'SAT441'],
  ['enceladus',252.10,.20,7.21037,.00009,'SAT441'],
  ['tethys',531.10,.60,41.21353,.00031,'SAT441'],
  ['dione',561.40,.40,73.11607,.00005,'SAT441'],
  ['rhea',763.50,.60,153.94175,.00041,'SAT441'],
  ['titan',2574.76,.02,8978.13710,.00025,'SAT441'],
  ['iapetus',734.30,2.80,120.51511,.00242,'SAT441'],
  ['miranda',235.8,.7,4.3,.2,'URA111'],
  ['ariel',578.9,.6,83.5,1.4,'URA111'],
  ['umbriel',584.7,2.8,85.1,1.9,'URA111'],
  ['titania',788.9,1.8,226.9,4.1,'URA111'],
  ['oberon',761.4,2.6,205.3,5.8,'URA111'],
  ['triton',1352.60,2.40,1428.49546,.61603,'NEP097'],
  ['charon',606.0,.5,106.1,.3,'PLU060'],
];
for (const [id,r,dr,gm,dgm,ref] of satellitePhysicalRows) physical[id]={
  radiusKm:q(r,'km','jpl-sat-physical',`${id}: mean radius, ref ${id==='charon'?'2 (Nimmo 2017)':'1 (Archinal 2018)'}`,dr),
  massKg:missing('kg','Not imported; fitted GM is provided instead. No assumed G conversion.'),
  gmKm3S2:q(gm,'km3/s2','jpl-sat-physical',`${id}: ${ref}`,dgm),
  gravityMS2:q(gm/r**2*1000,'m/s2','jpl-sat-physical',`${id}: GM / mean radius² × 1000`,null,'derived','Spherical nonrotating estimate; neglects shape and centrifugal acceleration. Uncertainty not propagated.'),
  rotationHours:missing('h','Rotation not imported. An orbital period is not automatically a measured rotation period.'),
};
// NASA establishes synchronous rotation; use the JPL mean orbital period as an explicitly derived approximation.
physical.moon.rotationHours={...q(27.322*24,'h','jpl-sat-elements','Moon mean P; synchronous rotation described by NASA',null,'derived','Approximate mean synchronous period; not a lunar orientation solution.'),sourceIds:['jpl-sat-elements','nasa-moon']};
physical.sun={
  radiusKm:q(695700,'km','iau-nominal','Resolution B3, nominal solar radius',null,'nominal','Exact conversion constant, not a measured photospheric radius.'),
  massKg:missing('kg','Solar GM supplied instead; no assumed G conversion.'),
  gmKm3S2:q(1.32712440041279419e11,'km3/s2','jpl-constants','DE440 solar GM',null),
  gravityMS2:{...q(1.32712440041279419e11/695700**2*1000,'m/s2','jpl-constants','GM / nominal radius² × 1000',null,'derived','At nominal photospheric radius; uncertainty not propagated.'),sourceIds:['jpl-constants','iau-nominal']},
  rotationHours:q(25*24,'h','nasa-sun','Equatorial rotation',null,'approximate','Equator about 25 days; poles about 36 days. There is no single rigid solar rotation period.'),
};
