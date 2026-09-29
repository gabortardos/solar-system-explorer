import * as THREE from 'three';
import type {MinorBody} from './minor-bodies';

export type ShapeProvenance={key:string;kind:'measured'|'approximate';label:string;source:string|null;credit:string|null;path:string|null;color:string};
const measured:Record<string,ShapeProvenance>={
 'sb-20101955':{key:'bennu',kind:'measured',label:'NASA mission-derived shape model',source:'https://science.nasa.gov/3d-resources/asteroid-101955-bennu/',credit:'NASA/Goddard/University of Arizona',path:'/shapes/bennu.shape',color:'#4b4842'},
 'sb-20162173':{key:'ryugu',kind:'measured',label:'Hayabusa2 stereo-photoclinometry shape model',source:'https://darts.isas.jaxa.jp/en/datasets/darts:hyb2-00100',credit:'JAXA/University of Aizu/Kobe University',path:'/shapes/ryugu.shape',color:'#4d4942'},
 'sb-20025143':{key:'itokawa',kind:'measured',label:'NASA mission-derived shape model',source:'https://science.nasa.gov/resource/asteroid-itokawa-3d-model/',credit:'NASA/JAXA',path:'/shapes/itokawa.shape',color:'#81756b'},
 'sb-20000433':{key:'eros',kind:'measured',label:'NASA mission-derived shape model',source:'https://science.nasa.gov/resource/eros-3d-model/',credit:'NASA/JHUAPL',path:'/shapes/eros.shape',color:'#89776a'},
 'sb-20000004':{key:'vesta',kind:'measured',label:'NASA Dawn shape model',source:'https://science.nasa.gov/resource/vesta-3d-model/',credit:'NASA/JPL-Caltech/UCLA/MPS/DLR/IDA',path:'/shapes/vesta.shape',color:'#aaa39b'},
 'sb-1000036':{key:'halley',kind:'measured',label:'PDS mission-image shape model',source:'https://sbn.psi.edu/pds/resource/doi/stkshape_1.0.html',credit:'Abergel and Stooke / NASA PDS',path:'/shapes/halley.shape',color:'#413d39'},
 'sb-1000012':{key:'67p',kind:'measured',label:'Rosetta/OSIRIS-derived shape model',source:'https://sci.esa.int/web/rosetta/-/54728-shape-model-of-comet-67p',credit:'ESA/Rosetta/OSIRIS',path:'/shapes/67p.shape',color:'#46413b'},
};
export function minorShapeProvenance(body:MinorBody):ShapeProvenance{return measured[body.id]??{key:body.id,kind:'approximate',label:'Restrained procedural irregular visualization',source:null,credit:null,path:null,color:body.kind==='comet'?'#45403a':body.context==='Trans-Neptunian Object'?'#79685e':'#82786e'};}
export function minorVisualDescription(body:MinorBody){return minorShapeProvenance(body).kind==='measured'?'Source-based shape · illustrative orbit':'Approximate irregular shape · illustrative orbit';}

function approximate(body:MinorBody,radius:number){
 const geometry=new THREE.IcosahedronGeometry(radius,3),p=geometry.attributes.position;
 let seed=2166136261;for(const c of body.id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const stretch=.72+(seed%19)/100,phase=(seed%628)/100;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const length=Math.hypot(x,y,z),nx=x/length,ny=y/length,nz=z/length,variation=1+.055*Math.sin(nx*7+phase)*Math.sin(ny*6-phase)+.035*Math.sin(nz*11+phase*.5);x*=stretch*variation;y*=variation;z*=(.88+(seed%11)/100)*variation;p.setXYZ(i,x,y,z);}
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

/** One compact source mesh is fetched only for the selected object. */
export async function loadMinorShape(body:MinorBody,radius:number,signal:AbortSignal){
 const profile=minorShapeProvenance(body);if(!profile.path)return approximate(body,radius);
 const response=await fetch(profile.path,{signal});if(!response.ok)throw new Error('Shape model unavailable');
 const data=await response.arrayBuffer();if(signal.aborted)throw new DOMException('Aborted','AbortError');
 const view=new DataView(data);if(data.byteLength<16||String.fromCharCode(...new Uint8Array(data,0,4))!=='SSE1')throw new Error('Invalid shape model');
 const vertices=view.getUint32(4,true),indices=view.getUint32(8,true),indexBytes=view.getUint32(12,true),expected=16+vertices*12+indices*indexBytes;
 if(vertices<4||vertices>30000||indices<12||indices>180000||indexBytes!==2||expected!==data.byteLength)throw new Error('Shape model exceeds its runtime budget');
 const source=new Float32Array(data,16,vertices*3),positions=new Float32Array(source.length);for(let i=0;i<source.length;i++)positions[i]=source[i]*radius;
 const index=new Uint16Array(data,16+vertices*12,indices),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(index),1));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
