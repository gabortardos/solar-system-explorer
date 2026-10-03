export const LIVE_GUIDE_MODEL='gpt-5.6-luna';
export const LIVE_GUIDE_LIMITS={
  requestBytes:12_000,
  questionCharacters:600,
  estimatedInputTokens:2_000,
  outputTokens:400,
  timeoutMs:10_000,
  reservationMicrousd:2_000,
  viewerPerMinute:10,
  viewerPerDay:50,
  globalPerMinute:10,
  globalPerDay:100,
  globalPer31Days:1_000,
  rolling31DayMicrousd:2_000_000,
  lifetimeMicrousd:4_000_000,
} as const;

export type LimitReason='reserved'|'duplicate_request'|'viewer_minute'|'viewer_day'|'global_minute'|'global_day'|'global_month'|'rolling_budget'|'lifetime_budget'|'database_unavailable';
export type GuideQuotaState={developer:boolean;public:{minuteUsed:number;minuteLimit:number;rolling24HoursUsed:number;rolling24HoursLimit:number;minuteResetAt:number|null;rolling24HoursResetAt:number|null}|null};
export type LimitResult={allowed:boolean;reason:LimitReason;quota?:GuideQuotaState};
export type GuideReservationPolicy={bypassRequestCounts?:boolean};

type QuotaStats={viewer_minute:number;viewer_day:number;minute_oldest:number|null;day_oldest:number|null;global_minute:number;global_day:number;global_month:number;rolling_cost:number;lifetime_cost:number};

function numberValue(value:unknown){const result=Number(value);return Number.isFinite(result)?result:0;}
function nullableNumber(value:unknown){const result=Number(value);return value===null||value===undefined||!Number.isFinite(result)?null:result;}

function publicQuota(stats:Pick<QuotaStats,'viewer_minute'|'viewer_day'|'minute_oldest'|'day_oldest'>,nowMs:number,includeCurrent=false):GuideQuotaState{
  const minuteUsed=stats.viewer_minute+(includeCurrent?1:0),rolling24HoursUsed=stats.viewer_day+(includeCurrent?1:0);
  const minuteOldest=stats.minute_oldest??(includeCurrent?nowMs:null),dayOldest=stats.day_oldest??(includeCurrent?nowMs:null);
  return {developer:false,public:{minuteUsed,minuteLimit:LIVE_GUIDE_LIMITS.viewerPerMinute,rolling24HoursUsed,rolling24HoursLimit:LIVE_GUIDE_LIMITS.viewerPerDay,minuteResetAt:minuteOldest===null?null:minuteOldest+60_000,rolling24HoursResetAt:dayOldest===null?null:dayOldest+86_400_000}};
}

export async function readGuideQuotaState(db:D1Database,viewerHash:string,nowMs:number,developer=false):Promise<GuideQuotaState>{
  if(developer)return {developer:true,public:null};
  const minute=nowMs-60_000,day=nowMs-86_400_000;
  const row=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS viewer_minute,
    (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS viewer_day,
    (SELECT MIN(created_at) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS minute_oldest,
    (SELECT MIN(created_at) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS day_oldest`).bind(viewerHash,minute,viewerHash,day,viewerHash,minute,viewerHash,day).first<QuotaStats>();
  return publicQuota({viewer_minute:numberValue(row?.viewer_minute),viewer_day:numberValue(row?.viewer_day),minute_oldest:nullableNumber(row?.minute_oldest),day_oldest:nullableNumber(row?.day_oldest)},nowMs);
}

export async function hashViewer(request:Request):Promise<string>{
  const address=request.headers.get('cf-connecting-ip')??request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`solar-guide-v1:${address}`));
  return [...new Uint8Array(bytes)].slice(0,16).map(value=>value.toString(16).padStart(2,'0')).join('');
}

export async function reserveGuideRequest(db:D1Database,requestId:string,viewerHash:string,nowMs:number,policy:GuideReservationPolicy={}):Promise<LimitResult>{
  const minute=nowMs-60_000,day=nowMs-86_400_000,month=nowMs-31*86_400_000;
  const bypassRequestCounts=policy.bypassRequestCounts===true&&viewerHash.startsWith('developer:');
  try{
    const duplicate=await db.prepare('SELECT request_id FROM guide_requests WHERE request_id = ? LIMIT 1').bind(requestId).first();
    if(duplicate)return {allowed:false,reason:'duplicate_request'};
    const row=await db.prepare(`SELECT
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS viewer_minute,
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS viewer_day,
      (SELECT MIN(created_at) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS minute_oldest,
      (SELECT MIN(created_at) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS day_oldest,
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash NOT LIKE 'developer:%' AND created_at >= ?) AS global_minute,
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash NOT LIKE 'developer:%' AND created_at >= ?) AS global_day,
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash NOT LIKE 'developer:%' AND created_at >= ?) AS global_month,
      (SELECT COALESCE(SUM(reserved_microusd), 0) FROM guide_requests WHERE created_at >= ?) AS rolling_cost,
      (SELECT COALESCE(reserved_microusd, 0) FROM guide_budget_totals WHERE scope = 'lifetime') AS lifetime_cost`).bind(viewerHash,minute,viewerHash,day,viewerHash,minute,viewerHash,day,minute,day,month,month).first<QuotaStats>();
    const stats={viewer_minute:numberValue(row?.viewer_minute),viewer_day:numberValue(row?.viewer_day),minute_oldest:nullableNumber(row?.minute_oldest),day_oldest:nullableNumber(row?.day_oldest),global_minute:numberValue(row?.global_minute),global_day:numberValue(row?.global_day),global_month:numberValue(row?.global_month),rolling_cost:numberValue(row?.rolling_cost),lifetime_cost:numberValue(row?.lifetime_cost)};
    const quota:GuideQuotaState=bypassRequestCounts?{developer:true,public:null}:publicQuota(stats,nowMs);
    const l=LIVE_GUIDE_LIMITS;
    if(!bypassRequestCounts&&stats.viewer_minute>=l.viewerPerMinute)return {allowed:false,reason:'viewer_minute',quota};
    if(!bypassRequestCounts&&stats.viewer_day>=l.viewerPerDay)return {allowed:false,reason:'viewer_day',quota};
    if(!bypassRequestCounts&&stats.global_minute>=l.globalPerMinute)return {allowed:false,reason:'global_minute',quota};
    if(!bypassRequestCounts&&stats.global_day>=l.globalPerDay)return {allowed:false,reason:'global_day',quota};
    if(!bypassRequestCounts&&stats.global_month>=l.globalPer31Days)return {allowed:false,reason:'global_month',quota};
    if(stats.rolling_cost+l.reservationMicrousd>l.rolling31DayMicrousd)return {allowed:false,reason:'rolling_budget',quota};
    if(stats.lifetime_cost+l.reservationMicrousd>l.lifetimeMicrousd)return {allowed:false,reason:'lifetime_budget',quota};

    const inserted=await db.prepare(`INSERT INTO guide_requests
      (request_id, viewer_hash, created_at, reserved_microusd, status, model)
      SELECT ?, ?, ?, ?, 'reserved', ?
      WHERE (? = 1 OR (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) < ?)
        AND (? = 1 OR (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) < ?)
        AND (? = 1 OR (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash NOT LIKE 'developer:%' AND created_at >= ?) < ?)
        AND (? = 1 OR (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash NOT LIKE 'developer:%' AND created_at >= ?) < ?)
        AND (? = 1 OR (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash NOT LIKE 'developer:%' AND created_at >= ?) < ?)
        AND (SELECT COALESCE(SUM(reserved_microusd), 0) FROM guide_requests WHERE created_at >= ?) + ? <= ?
        AND (SELECT COALESCE(MAX(reserved_microusd), 0) FROM guide_budget_totals WHERE scope = 'lifetime') + ? <= ?
      RETURNING request_id`).bind(
        requestId,viewerHash,nowMs,l.reservationMicrousd,LIVE_GUIDE_MODEL,
        bypassRequestCounts?1:0,viewerHash,minute,l.viewerPerMinute,bypassRequestCounts?1:0,viewerHash,day,l.viewerPerDay,
        bypassRequestCounts?1:0,minute,l.globalPerMinute,bypassRequestCounts?1:0,day,l.globalPerDay,bypassRequestCounts?1:0,month,l.globalPer31Days,
        month,l.reservationMicrousd,l.rolling31DayMicrousd,l.reservationMicrousd,l.lifetimeMicrousd,
      ).first();
    return inserted?{allowed:true,reason:'reserved',quota:bypassRequestCounts?quota:publicQuota(stats,nowMs,true)}:{allowed:false,reason:'global_minute',quota};
  }catch(error){
    if(error instanceof Error&&/UNIQUE|constraint.*request_id/i.test(error.message))return {allowed:false,reason:'duplicate_request'};
    return {allowed:false,reason:'database_unavailable'};
  }
}

export async function finishGuideRequest(db:D1Database,requestId:string,status:'succeeded'|'provider_error'|'timeout'|'invalid_output',usage?:{inputTokens?:number;outputTokens?:number},errorCode?:string){
  try{
    await db.prepare('UPDATE guide_requests SET status = ?, input_tokens = ?, output_tokens = ?, error_code = ? WHERE request_id = ?')
      .bind(status,usage?.inputTokens??null,usage?.outputTokens??null,errorCode??null,requestId).run();
  }catch{
    // The worst-case reservation remains charged even when telemetry cannot update.
  }
}
