#!/usr/bin/env node
// Convert authoritative source meshes into a compact, normalized runtime format.
// Usage: node scripts/import-shape-models.mjs <download-directory>
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const input=process.argv[2];
if(!input)throw new Error('Pass the directory containing the reviewed source assets.');
const output=path.resolve('public/shapes');fs.mkdirSync(output,{recursive:true});

function glb(file){
 const bytes=fs.readFileSync(file),jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 const binHeader=20+jsonLength,binStart=binHeader+8,primitive=json.meshes[0].primitives[0];
 const accessor=(index)=>{const a=json.accessors[index],v=json.bufferViews[a.bufferView],start=binStart+(v.byteOffset??0)+(a.byteOffset??0);return {a,start};};
 const p=accessor(primitive.attributes.POSITION),positions=new Float32Array(p.a.count*3);
 for(let i=0;i<positions.length;i++)positions[i]=bytes.readFloatLE(p.start+i*4);
 const q=accessor(primitive.indices),indices=new Uint32Array(q.a.count),size=q.a.componentType===5123?2:4;
 for(let i=0;i<indices.length;i++)indices[i]=size===2?bytes.readUInt16LE(q.start+i*2):bytes.readUInt32LE(q.start+i*4);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));return geometry;
}
function positionsOnly(geometry,tolerance=1e-5){for(const name of Object.keys(geometry.attributes))if(name!=='position')geometry.deleteAttribute(name);return mergeVertices(geometry,tolerance);}
function obj(file){let result;new OBJLoader().parse(fs.readFileSync(file,'utf8')).traverse(o=>{if(o.isMesh&&!result)result=o.geometry.clone();});if(!result)throw new Error(`No mesh in ${file}`);return positionsOnly(result);}
function stl(file){const b=fs.readFileSync(file);return positionsOnly(new STLLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)));}
function halley(file){
 const rows=fs.readFileSync(file,'utf8').trim().split(/\n/).map(line=>line.trim().split(/\s+/).map(Number));
 const lons=[...new Set(rows.map(r=>r[0]))].filter(n=>n<360).sort((a,b)=>a-b),lats=[...new Set(rows.map(r=>r[1]))].sort((a,b)=>a-b),radius=new Map(rows.map(([lon,lat,r])=>[`${lon===360?0:lon},${lat}`,r]));
 const positions=[];for(const lon of lons)for(const lat of lats){const L=lon*Math.PI/180,B=lat*Math.PI/180,r=radius.get(`${lon},${lat}`);positions.push(r*Math.cos(B)*Math.cos(L),r*Math.sin(B),r*Math.cos(B)*Math.sin(L));}
 const indices=[],h=lats.length;for(let x=0;x<lons.length;x++)for(let y=0;y<h-1;y++){const nx=(x+1)%lons.length,a=x*h+y,b=nx*h+y,c=nx*h+y+1,d=x*h+y+1;indices.push(a,b,d,b,c,d);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);return mergeVertices(geometry,1e-4);
}
function write(name,geometry){
 geometry.computeBoundingBox();const center=new THREE.Vector3();geometry.boundingBox.getCenter(center);const positions=geometry.attributes.position.array;
 let radius=0;for(let i=0;i<positions.length;i+=3){positions[i]-=center.x;positions[i+1]-=center.y;positions[i+2]-=center.z;radius=Math.max(radius,Math.hypot(positions[i],positions[i+1],positions[i+2]));}
 for(let i=0;i<positions.length;i++)positions[i]/=radius;
 if(!geometry.index)geometry=mergeVertices(geometry,1e-5);
 const index=geometry.index.array,header=Buffer.alloc(16);header.write('SSE1');header.writeUInt32LE(positions.length/3,4);header.writeUInt32LE(index.length,8);header.writeUInt32LE(2,12);
 const body=Buffer.concat([header,Buffer.from(positions.buffer,positions.byteOffset,positions.byteLength),Buffer.from(new Uint16Array(index).buffer)]);
 fs.writeFileSync(path.join(output,`${name}.shape`),body);console.log(`${name}: ${positions.length/3} vertices, ${index.length/3} triangles, ${body.length} bytes`);
}

write('bennu',stl(path.join(input,'bennu-nasa.stl')));
write('ryugu',obj(path.join(input,'ryugu-jaxa.obj')));
write('itokawa',glb(path.join(input,'itokawa-nasa.glb')));
write('eros',glb(path.join(input,'eros-nasa.glb')));
write('vesta',glb(path.join(input,'vesta-nasa.glb')));
write('halley',halley(path.join(input,'halley-pds.tab')));
write('67p',obj(path.join(input,'67p-esa-k006.obj')));
