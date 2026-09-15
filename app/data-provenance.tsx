import {getBody} from './data/catalog';
import {SOURCES,DATASET_VERSION} from './data/sources';

export function DataProvenance({id}:{id:string}){
 const body=getBody(id);
 if(!body)return <p className="fineprint">No catalogue record is available.</p>;
 const fields=([['Radius',body.physical.radiusKm],['Gravity',body.physical.gravityMS2],['Rotation',body.physical.rotationHours],['Orbital period',body.orbit.periodDays]] as const).filter(([,field])=>field.value!==null);
 return <details className="data-provenance"><summary>Data sources and reliability</summary>
 <p className="fineprint">Local reference dataset {DATASET_VERSION}. These facts are separate from simulated positions and visual scale.</p>
 {fields.map(([label,f])=><div key={label}><strong>{label} · {f.quality}</strong>
 <p className="fineprint">{f.value!.toLocaleString(undefined,{maximumSignificantDigits:9})} {f.unit}{f.uncertainty===null?' · uncertainty not supplied':` ± ${f.uncertainty} ${f.unit}`}. {f.note}</p>
 {f.sourceIds.map(sourceId=><a className="source-link" key={sourceId} href={SOURCES[sourceId].url} target="_blank" rel="noreferrer">{SOURCES[sourceId].title}</a>)}</div>)}
 <p className="fineprint">Descriptions are curated educational summaries. They are not live observations. Fields that do not apply or have not been imported are omitted.</p>
 </details>;
}
