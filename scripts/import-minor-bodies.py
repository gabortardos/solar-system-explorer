"""Offline JPL snapshot importer. Serial requests only; normal builds never call JPL.
Run with --refresh to download, otherwise rebuild indexes from committed raw data.
"""
import json, pathlib, urllib.request, urllib.parse, sys, hashlib, datetime
ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data-source/minor-bodies'
OUT = ROOT / 'public/catalogue/v1'
SAMPLE = ['4','2','10','433','25143','101955','162173','99942','65803','29075','1P','2P','67P','1995 O1','136199','136472','136108','90377','486958']
RAW.mkdir(parents=True, exist_ok=True)
def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, separators=(',', ':'), ensure_ascii=False)+'\n')
def norm(s):
    import re, unicodedata
    return re.sub('[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s).lower()).strip()
records=[]
for priority, designation in enumerate(SAMPLE):
    path=RAW/(designation.replace(' ','_')+'.json')
    url='https://ssd-api.jpl.nasa.gov/sbdb.api?'+urllib.parse.urlencode({'des':designation,'phys-par':1,'full-prec':1,'alt-des':1})
    if '--refresh' in sys.argv or not path.exists():
        with urllib.request.urlopen(url, timeout=60) as response: raw=json.load(response)
        if raw.get('signature',{}).get('version')!='1.3' or 'object' not in raw: raise ValueError(raw)
        write(path, {'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':url,'data':raw})
    envelope=json.loads(path.read_text()); raw=envelope['data']; obj=raw['object']; orbit=raw['orbit']
    if orbit.get('equinox')!='J2000': raise ValueError('Unsupported reference frame')
    elements={e['name']:e for e in orbit['elements']}
    def number(key):
        v=elements.get(key,{}).get('value'); return float(v) if v is not None else None
    aliases=[obj['fullname'],obj['des']]
    aliases += [v for x in obj.get('des_alt',[]) for v in x.values() if isinstance(v,str)]
    record={'id':'sb-'+obj['spkid'],'name':obj.get('shortname',obj['fullname']).strip(),'aliases':list(dict.fromkeys(aliases)),
      'kind':'comet' if obj['kind'].startswith('c') else 'asteroid','context':obj['orbit_class']['name'],'neo':obj['neo'],'pha':obj['pha'],
      'importance':100-priority,'physical':raw.get('phys_par',[]),'orbit':{'epochJD':float(orbit['epoch']),'frame':'heliocentric-ecliptic-J2000','timeScale':'TDB','elements':elements,'solutionDate':orbit.get('soln_date'),'conditionCode':orbit.get('condition_code')},
      'source':{'url':envelope['url'],'retrievedAt':envelope['retrievedAt'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},
      'education':None}
    a,e=number('a'),number('e')
    record['boundsAU']=[a*(1-e),a*(1+e)] if a and e is not None and 0<=e<1 else None
    write(OUT/'objects'/f"{record['id']}.json",record); records.append(record)
# Prefix postings contain bounded compact records, not full catalogue physics.
# Pages permit external-memory ingestion later without changing browser contracts.
search={}; shells={}; browse={}
def compact(r): return {k:r[k] for k in ['id','name','aliases','kind','context','neo','pha','importance']}
for r in records:
    terms=set()
    for name in [r['name'],*r['aliases'],r['context'],r['kind'],*(['near earth'] if r['neo'] else []),*(['potentially hazardous'] if r['pha'] else [])]:
        n=norm(name)
        for token in [n,*n.split()]:
            for size in range(1,len(token)+1): terms.add(token[:size])
    for term in terms: search.setdefault(term,[]).append(compact(r))
    for category in ['all',r['kind'],*(['neo'] if r['neo'] and r['kind']=='asteroid' else []),*(['pha'] if r['pha'] else []),*(['tno'] if r['context']=='TransNeptunian Object' else [])]: browse.setdefault(category,[]).append(compact(r))
    if r['boundsAU']:
        import math
        low,high=r['boundsAU']
        for shell in range(-8,13):
            if low<=2**(shell+1) and high>=2**shell: shells.setdefault(str(shell),[]).append(compact(r))
def pages(folder, index):
    for key,items in index.items():
        items.sort(key=lambda r:(-r['importance'],r['id']))
        for start in range(0,len(items),32):
            write(OUT/folder/key.replace(' ','_')/f'{start//32}.json',{'records':items[start:start+32],'total':len(items),'next':start//32+1 if start+32<len(items) else None})
pages('search',search); pages('browse',browse); pages('shells',shells)
write(OUT/'manifest.json',{'version':1,'count':len(records),'pageSize':32,'shellMin':-8,'shellMax':12,'source':'NASA/JPL SBDB','positionModel':'illustrative two-body osculating ellipse; not an ephemeris'})
print(f'Built {len(records)} real bodies and bounded static indexes')
