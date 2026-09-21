export const LIVE_GUIDE_MODEL='gpt-5.6-luna';
export const LIVE_GUIDE_LIMITS={
  requestBytes:6_000,
  questionCharacters:600,
  estimatedInputTokens:2_000,
  outputTokens:400,
  timeoutMs:10_000,
  reservationMicrousd:2_000,
  viewerPerMinute:2,
  viewerPerDay:10,
  globalPerMinute:5,
  globalPerDay:100,
  globalPer31Days:1_000,
  rolling31DayMicrousd:2_000_000,
  lifetimeMicrousd:4_000_000,
} as const;

export type LimitReason='reserved'|'duplicate_request'|'viewer_minute'|'viewer_day'|'global_minute'|'global_day'|'global_month'|'rolling_budget'|'lifetime_budget'|'database_unavailable';
export type LimitResult={allowed:boolean;reason:LimitReason};

type QuotaStats={viewer_minute:number;viewer_day:number;global_minute:number;global_day:number;global_month:number;rolling_cost:number;lifetime_cost:number};

function numberValue(value:unknown){const result=Number(value);return Number.isFinite(result)?result:0;}

export async function hashViewer(request:Request):Promise<string>{
  const address=request.headers.get('cf-connecting-ip')??request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??'unknown';
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`solar-guide-v1:${address}`));
  return [...new Uint8Array(bytes)].slice(0,16).map(value=>value.toString(16).padStart(2,'0')).join('');
}

export async function reserveGuideRequest(db:D1Database,requestId:string,viewerHash:string,nowMs:number):Promise<LimitResult>{
  const minute=nowMs-60_000,day=nowMs-86_400_000,month=nowMs-31*86_400_000;
  try{
    const duplicate=await db.prepare('SELECT request_id FROM guide_requests WHERE request_id = ? LIMIT 1').bind(requestId).first();
    if(duplicate)return {allowed:false,reason:'duplicate_request'};
    const row=await db.prepare(`SELECT
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS viewer_minute,
      (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) AS viewer_day,
      (SELECT COUNT(*) FROM guide_requests WHERE created_at >= ?) AS global_minute,
      (SELECT COUNT(*) FROM guide_requests WHERE created_at >= ?) AS global_day,
      (SELECT COUNT(*) FROM guide_requests WHERE created_at >= ?) AS global_month,
      (SELECT COALESCE(SUM(reserved_microusd), 0) FROM guide_requests WHERE created_at >= ?) AS rolling_cost,
      (SELECT COALESCE(reserved_microusd, 0) FROM guide_budget_totals WHERE scope = 'lifetime') AS lifetime_cost`).bind(viewerHash,minute,viewerHash,day,minute,day,month,month).first<QuotaStats>();
    const stats={viewer_minute:numberValue(row?.viewer_minute),viewer_day:numberValue(row?.viewer_day),global_minute:numberValue(row?.global_minute),global_day:numberValue(row?.global_day),global_month:numberValue(row?.global_month),rolling_cost:numberValue(row?.rolling_cost),lifetime_cost:numberValue(row?.lifetime_cost)};
    const l=LIVE_GUIDE_LIMITS;
    if(stats.viewer_minute>=l.viewerPerMinute)return {allowed:false,reason:'viewer_minute'};
    if(stats.viewer_day>=l.viewerPerDay)return {allowed:false,reason:'viewer_day'};
    if(stats.global_minute>=l.globalPerMinute)return {allowed:false,reason:'global_minute'};
    if(stats.global_day>=l.globalPerDay)return {allowed:false,reason:'global_day'};
    if(stats.global_month>=l.globalPer31Days)return {allowed:false,reason:'global_month'};
    if(stats.rolling_cost+l.reservationMicrousd>l.rolling31DayMicrousd)return {allowed:false,reason:'rolling_budget'};
    if(stats.lifetime_cost+l.reservationMicrousd>l.lifetimeMicrousd)return {allowed:false,reason:'lifetime_budget'};

    const inserted=await db.prepare(`INSERT INTO guide_requests
      (request_id, viewer_hash, created_at, reserved_microusd, status, model)
      SELECT ?, ?, ?, ?, 'reserved', ?
      WHERE (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) < ?
        AND (SELECT COUNT(*) FROM guide_requests WHERE viewer_hash = ? AND created_at >= ?) < ?
        AND (SELECT COUNT(*) FROM guide_requests WHERE created_at >= ?) < ?
        AND (SELECT COUNT(*) FROM guide_requests WHERE created_at >= ?) < ?
        AND (SELECT COUNT(*) FROM guide_requests WHERE created_at >= ?) < ?
        AND (SELECT COALESCE(SUM(reserved_microusd), 0) FROM guide_requests WHERE created_at >= ?) + ? <= ?
        AND (SELECT COALESCE(MAX(reserved_microusd), 0) FROM guide_budget_totals WHERE scope = 'lifetime') + ? <= ?
      RETURNING request_id`).bind(
        requestId,viewerHash,nowMs,l.reservationMicrousd,LIVE_GUIDE_MODEL,
        viewerHash,minute,l.viewerPerMinute,viewerHash,day,l.viewerPerDay,
        minute,l.globalPerMinute,day,l.globalPerDay,month,l.globalPer31Days,
        month,l.reservationMicrousd,l.rolling31DayMicrousd,l.reservationMicrousd,l.lifetimeMicrousd,
      ).first();
    return inserted?{allowed:true,reason:'reserved'}:{allowed:false,reason:'global_minute'};
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
