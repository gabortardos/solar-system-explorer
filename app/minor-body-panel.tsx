'use client';
import {useEffect,useState} from 'react';
import {minorCatalogue,minorPosition,MINOR_ACCURACY,type MinorBody,type MinorPage} from './minor-bodies';
import {calculatePosition} from './data/positions';
import {minorShapeProvenance,minorVisualDescription} from './minor-shapes';
export function MinorBodyPanel({time,onShow,onClear,initialBody=null}:{initialBody?:MinorBody|null;time:number;onShow:(body:MinorBody,travel:boolean)=>void;onClear:()=>void}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[page,setPage]=useState(0),[data,setData]=useState<MinorPage|null>(null),[body,setBody]=useState<MinorBody|null>(initialBody),[error,setError]=useState(''),[busy,setBusy]=useState(false),[nearby,setNearby]=useState(false),[stamp,setStamp]=useState(0),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{setBusy(true);setError('');const request=nearby?(async()=>{const earth=calculatePosition('earth',stamp);if(earth.status!=='available')throw new Error('Earth position unavailable');const r=await minorCatalogue.nearby(earth.value,stamp,1);if(active)setNotice(`${r.complete?'Complete within this sample':'Bounded, incomplete sample'} · within 1 AU of Earth · ${new Date(stamp).toISOString()}`);return {records:r.results.map(x=>x.body),total:r.results.length,next:null};})():query?minorCatalogue.search(query,page):minorCatalogue.browse(category,page);request.then(r=>{if(active)setData(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});},180);return()=>{active=false;clearTimeout(timer);};},[query,category,page,nearby,stamp]);
 const choose=async(id:string)=>{setError('');try{setBody(await minorCatalogue.detail(id));}catch(e){setError(e instanceof Error?e.message:'Unable to load object');}};
 const position=body?minorPosition(body,time):null;
 return <div className="minor-catalogue">
  <p>Explore a curated JPL sample. Only requested objects enter the scene; one selected object can use close-view shape detail.</p>
  <label>Find a small body<input value={query} placeholder="Bennu, Halley, 99942…" onChange={e=>{setQuery(e.target.value);setPage(0);setNearby(false);}}/></label>
  <label>Collection<select value={category} onChange={e=>{setCategory(e.target.value);setQuery('');setPage(0);setNearby(false);}}>{[['all','All small bodies'],['asteroid','Asteroids'],['neo','Near-Earth asteroids'],['pha','Potentially hazardous'],['comet','Comets'],['tno','Trans-Neptunian objects']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
  <div className="minor-actions"><button onClick={()=>{setNearby(true);setStamp(time);setQuery('');setPage(0);}}>Nearby Earth</button><button onClick={onClear}>Clear markers</button></div>
  {nearby&&<p>{notice}</p>}{error&&<p role="alert">{error}</p>}{busy?<p role="status">Loading catalogue…</p>:<ul>{data?.records.map(r=><li key={r.id}><button onClick={()=>choose(r.id)}><strong>{r.name}</strong><span>{r.context}{r.pha?' · PHA':r.neo?' · NEO':''}</span></button></li>)}</ul>}
  {!busy&&data?.records.length===0&&<p>No matches in the imported sample. Try a name or designation prefix.</p>}
  {!nearby&&<div className="minor-actions"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={data?.next==null} onClick={()=>setPage(data!.next!)}>Next</button></div>}
  {body&&<section aria-label="Small body information"><h3>{body.name}</h3><p>{body.context} · Orbits Sun</p>
   <p>{minorVisualDescription(body)}.</p>
   <div className="minor-actions"><button disabled={!position} onClick={()=>onShow(body,false)}>Show</button><button disabled={!position} onClick={()=>onShow(body,true)}>Travel to</button></div>
   <dl>{body.physical.filter(f=>f.value!==null).map(f=><div key={f.name}><dt>{f.title}</dt><dd>{f.value} {f.units}{f.sigma?` ± ${f.sigma}`:''}{f.ref&&<small>Reference: {f.ref}</small>}</dd></div>)}</dl>
   {position&&<p>Simulated heliocentric distance: {Math.hypot(...position).toFixed(3)} AU.</p>}
   <p>{MINOR_ACCURACY}</p><p>Orbital epoch: JD {body.orbit.epochJD} TDB. Missing physical properties are omitted. PHA is a catalogue classification, not a prediction of an impact.</p>
   <a href={body.source.url} target="_blank" rel="noreferrer">NASA/JPL orbit source snapshot</a>{minorShapeProvenance(body).source&&<><a href={minorShapeProvenance(body).source!} target="_blank" rel="noreferrer">Shape-model source</a><p>Shape credit: {minorShapeProvenance(body).credit}.</p></>}<p>Retrieved {body.source.retrievedAt.slice(0,10)}.</p>
  </section>}
 </div>;
}
