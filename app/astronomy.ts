// Stable facts and the position model are independent from rendering.
export const AU = 149597870.7;
export const EPOCH = Date.UTC(2000,0,1,12);
export type Body = {id:string;name:string;kind:string;radius:number;gravity:number;day:number;year:number;au:number;color:string;texture:string;description:string;fact:string;atmosphere:string;source:string;elements?:number[][]};
const elements = [
[[.38709927,.20563593,7.00497902,252.25032350,77.45779628,48.33076593],[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]],
[[.72333566,.00677672,3.39467605,181.97909950,131.60246718,76.67984255],[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]],
[[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
[[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]],
[[5.202887,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]],
[[9.53667594,.05386179,2.48599187,49.95424423,92.59887831,113.66242448],[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]],
[[19.18916464,.04725744,.77263783,313.23810451,170.95427630,74.01692503],[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]],
[[30.06992276,.00859048,1.77004347,-55.12002969,44.96476227,131.78422574],[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]]
];
export const bodies:Body[] = [
{id:'sun',name:'Sun',kind:'Star',radius:695700,gravity:274,day:609.12,year:0,au:0,color:'#ffcf78',texture:'sun',description:'Our star. Its gravity holds the solar system together, while fusion in its core supplies the light and warmth that make life on Earth possible.',fact:'Sunlight takes about 8 minutes 20 seconds to travel one astronomical unit.',atmosphere:'Hydrogen and helium; a hot plasma, not a solid surface.',source:'https://science.nasa.gov/sun/facts/'},
{id:'mercury',name:'Mercury',kind:'Terrestrial planet',radius:2439.4,gravity:3.7,day:1407.6,year:.2408467,au:.387,color:'#b9b4ab',texture:'mercury',description:'A small, cratered world close to the Sun. Its nearly airless surface experiences extreme contrasts between day and night.',fact:'Mercury completes an orbit before it completes two rotations.',atmosphere:'An extremely thin exosphere.',source:'https://science.nasa.gov/mercury/facts/',elements:elements[0]},
{id:'venus',name:'Venus',kind:'Terrestrial planet',radius:6051.8,gravity:8.87,day:-5832.5,year:.61519726,au:.723,color:'#e6c595',texture:'venus_atmosphere',description:'Beneath bright clouds lies a rocky world with a crushing atmosphere. An intense greenhouse effect makes its surface hotter than Mercury’s.',fact:'Venus rotates in the opposite direction to most planets.',atmosphere:'Mostly carbon dioxide, with sulfuric acid clouds.',source:'https://science.nasa.gov/venus/facts/',elements:elements[1]},
{id:'earth',name:'Earth',kind:'Terrestrial planet',radius:6371.0084,gravity:9.8,day:23.9345,year:1.0000174,au:1,color:'#7ec9e9',texture:'earth_daymap',description:'An ocean world wrapped in a thin blue atmosphere. Our home is the only place where life has been confirmed, and the starting point for every journey we have made into space.',fact:'Liquid oceans cover about 71% of Earth’s surface.',atmosphere:'Mostly nitrogen and oxygen.',source:'https://science.nasa.gov/earth/facts/',elements:elements[2]},
{id:'moon',name:'Moon',kind:'Moon of Earth',radius:1737.4,gravity:1.62,day:655.72,year:27.3217/365.25,au:1,color:'#d0d2d6',texture:'moon',description:'Earth’s natural satellite preserves a record of ancient impacts. Dark volcanic plains contrast with bright, heavily cratered highlands.',fact:'Tidal locking keeps approximately the same side facing Earth.',atmosphere:'An extremely thin exosphere.',source:'https://science.nasa.gov/moon/facts/'},
{id:'mars',name:'Mars',kind:'Terrestrial planet',radius:3389.5,gravity:3.71,day:24.6229,year:1.8808476,au:1.524,color:'#d88e69',texture:'mars',description:'A cold desert with giant volcanoes, deep canyons and evidence of ancient rivers. Iron minerals give the landscape its rusty color.',fact:'Robotic missions study whether ancient Mars had environments suitable for life.',atmosphere:'Thin, mostly carbon dioxide.',source:'https://science.nasa.gov/mars/facts/',elements:elements[3]},
{id:'jupiter',name:'Jupiter',kind:'Gas giant',radius:69911,gravity:24.79,day:9.925,year:11.862615,au:5.203,color:'#d9b59b',texture:'jupiter',description:'The largest planet is a swirling world of cloud bands and powerful storms. Below the visible clouds, pressure rises deep into its hydrogen-rich interior.',fact:'The Great Red Spot is a long-lived storm, not a surface feature.',atmosphere:'Mostly hydrogen and helium.',source:'https://science.nasa.gov/jupiter/facts/',elements:elements[4]},
{id:'saturn',name:'Saturn',kind:'Gas giant',radius:58232,gravity:10.44,day:10.7,year:29.447498,au:9.537,color:'#e9cfa0',texture:'saturn',description:'A pale gas giant surrounded by a vast, delicate ring system. The rings consist of countless pieces of ice and rock, each following its own orbit.',fact:'Saturn has a lower average density than water.',atmosphere:'Mostly hydrogen and helium.',source:'https://science.nasa.gov/saturn/facts/',elements:elements[5]},
{id:'uranus',name:'Uranus',kind:'Ice giant',radius:25362,gravity:8.87,day:-17.24,year:84.016846,au:19.189,color:'#b4e1e0',texture:'uranus',description:'A cold ice giant that rotates almost on its side. Its unusual tilt produces extreme seasons during its long journey around the Sun.',fact:'Methane in the atmosphere absorbs red light, contributing to its blue-green appearance.',atmosphere:'Hydrogen, helium and methane.',source:'https://science.nasa.gov/uranus/facts/',elements:elements[6]},
{id:'neptune',name:'Neptune',kind:'Ice giant',radius:24622,gravity:11.15,day:16.11,year:164.79132,au:30.07,color:'#739add',texture:'neptune',description:'Far beyond Earth, Neptune is a cold, windy world. Its atmosphere contains changing clouds and storms above a dense interior.',fact:'Neptune was found after mathematical predictions pointed astronomers toward it.',atmosphere:'Hydrogen, helium and methane.',source:'https://science.nasa.gov/neptune/facts/',elements:elements[7]}
];
export function position(body:Body,time:number,anomaly?:number):[number,number,number]{
 if(body.id==='sun')return [0,0,0];
 if(body.id==='moon'){
 const e=position(bodies[3],time);const a=((time-EPOCH)/86400000/27.3217)*Math.PI*2;const r=384400/AU;
 return [e[0]+r*Math.cos(a),e[1]+r*Math.sin(a)*Math.sin(5.145*Math.PI/180),e[2]+r*Math.sin(a)*Math.cos(5.145*Math.PI/180)];
 }
 const t=(time-EPOCH)/86400000/36525;const v=body.elements![0].map((n,i)=>n+t*body.elements![1][i]);
 const [a,e]=v;const rad=Math.PI/180;const I=v[2]*rad,L=v[3]*rad,P=v[4]*rad,N=v[5]*rad;const M=anomaly??((L-P)%(Math.PI*2));
 let E=M;for(let i=0;i<12;i++)E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
 const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E),w=P-N;
 return [(Math.cos(w)*Math.cos(N)-Math.sin(w)*Math.sin(N)*Math.cos(I))*x+(-Math.sin(w)*Math.cos(N)-Math.cos(w)*Math.sin(N)*Math.cos(I))*y,
 Math.sin(w)*Math.sin(I)*x+Math.cos(w)*Math.sin(I)*y,
 -((Math.cos(w)*Math.sin(N)+Math.sin(w)*Math.cos(N)*Math.cos(I))*x+(-Math.sin(w)*Math.sin(N)+Math.cos(w)*Math.cos(N)*Math.cos(I))*y)];
}
export function distance(a:Body,b:Body,time:number){const p=position(a,time),q=position(b,time);return Math.hypot(...p.map((n,i)=>n-q[i]))*AU;}
export function formatKm(km:number){return km<1e6?Math.round(km).toLocaleString()+' km':(km/1e6).toLocaleString(undefined,{maximumFractionDigits:2})+' million km';}
