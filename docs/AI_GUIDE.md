# Step 17 — Live Astronomy Guide

Status: **complete and published** on 2026-09-21. Production uses `gpt-5.6-luna` through the OpenAI Responses API with a deterministic Local guide fallback.

## Request and trust boundary

1. The browser captures one immutable request-time snapshot: selected object, simulation timestamp, spacecraft/navigation estimate, coordinate basis and scene anchor.
2. The browser sends only the question, selected object ID, bounded navigation snapshot and a unique request ID to `POST /api/guide`.
3. The Worker validates the body and rebuilds the astronomy context and evidence from the server-bundled canonical catalogue. Browser-supplied facts, source URLs and explanations are never trusted.
4. The Worker resolves contextual references and creates at most 12 structured evidence records before any provider call.
5. After an atomic D1 quota reservation, the Worker makes one non-streaming Responses API call with `store: false`, no tools, no web search, a 400-token output ceiling and a 10-second timeout. Failed calls are not retried automatically.
6. Strict JSON output may contain natural qualitative text segments plus references to supplied evidence IDs. The model may use ordinary scientific and common knowledge for explanatory prose, but exact measurements and scene-dependent values must use structured evidence references. The server rejects unsupported numerical model prose, URLs, unknown evidence IDs, malformed JSON and oversized output.
7. The browser receives the answer and only the structured evidence records materially referenced by that answer, never `OPENAI_API_KEY`. A visible badge identifies `Live AI` or `Local guide`.

`GET /api/guide` is a non-paid health check. It reports the model, provider configuration state and whether the required D1 tables and trigger exist; it never returns the secret.

## Contextual-reference policy

- “Here” means the selected object, not the spacecraft location and not an implicit arrival.
- “This moon” resolves to the selected moon. If a planet is selected, it resolves only when the moon is uniquely determined or explicitly named.
- “This planet” and “that planet” resolve to the selected planet, or to the parent planet when a moon is selected.
- Explicit named objects may become the subject when the question is not a comparison.
- Comparisons retain the resolved selected subject and use structured evidence for both objects.
- “How far am I from this moon?” uses the captured spacecraft/navigation snapshot and the selected moon position at the captured simulation time.

The response retains `resolution.selectedId`, `subjectId`, `comparisonId` and a plain-language interpretation so the UI and tests can verify what each phrase meant.

## Two-class answer policy

Trusted structured application data remains authoritative for exact measurements, calculated distances, spacecraft position, simulation time, orbital values and physical values. Exact values are rendered server-side from evidence IDs; the model cannot supply or alter those values. If verified structured data is absent, the Live guide must say so rather than estimate a precise value.

AI explanatory/general knowledge may be used for qualitative astronomy explanations, ordinary science, common-knowledge questions, well-established mission context and conversational follow-ups. This permits direct answers to questions such as whether dogs live on Earth, why Mars looks red, how a jump on the Moon would feel, or why Jupiter has many moons. Such prose is not labelled as verified application data and does not receive an evidence card unless structured data actually supports it.

The answer is the primary UI content. The `Live AI` / `Local guide` badge remains visible, while request-time snapshot details, context resolution, data quality and materially relevant evidence cards are grouped under the collapsed **Sources & data** disclosure.

## Evidence coverage

The live boundary supports selected planets and moons, habitability, atmosphere, water/ice, missions, physical facts, spacecraft-to-object distance, body-to-body distance and two-object comparisons. Missing fields remain unavailable. Source-reviewed moon descriptions support questions such as Europa water; mission lists are declined when no reviewed local mission summary exists.

The provider does not replace trusted structured astronomy values. Comparison prompts receive a small balanced subset for concise generation. Live responses return only evidence IDs the model actually cited; deterministic Local guide responses retain their bounded topic evidence.

## Cost and abuse controls

- Request body: 6,000 UTF-8 bytes maximum.
- Question: 600 characters maximum.
- Estimated provider input: 2,000 tokens maximum.
- Provider output: 400 tokens maximum.
- Timeout: 10 seconds; no automatic paid retry.
- Per network address: 2 reservations per minute and 10 per rolling 24 hours.
- Global: 5 per minute, 100 per rolling 24 hours and 1,000 per rolling 31 days.
- Reservation: $0.002 worst-case per attempted provider call.
- Application caps: $2 rolling 31 days and $4 lifetime reserved spend.
- The separate OpenAI project has the owner-configured $5 hard spend limit.

`drizzle/0000_guide_limits.sql` creates `guide_requests`, `guide_budget_totals`, indexes and the `guide_requests_budget_insert` trigger. A single conditional insert reserves quota atomically. Duplicate request UUIDs are blocked. Failed, timed-out and invalid responses retain their reservation so failures cannot bypass the budget.

## Fallback behavior

The deterministic Local guide is returned when the provider key, D1, quota, budget, network, provider, timeout or output validation is unavailable. The client also falls back locally if the server cannot be reached or returns an invalid response. Malformed and oversized requests are rejected before quota reservation or paid work.

## Production acceptance — 2026-09-21

Published production checks passed for:

- Mars — “Could I live here?” (`Live AI`)
- Moon — “How far am I from this moon?” (`Live AI`)
- Jupiter — “Compare this planet with Earth.” (`Live AI`)
- Europa selected — “What missions visited that planet?” resolved to Jupiter (`Live AI`)
- Europa selected — “What about this moon?” (`Live AI`)
- Europa selected — “Is there water here?” (`Live AI`)
- Earth — “How does this compare with Mars?” (`Live AI` after bounding comparison output)

The production database recorded 10 provider requests during implementation and acceptance: 7 final successful answer categories plus 3 safe-fallback diagnostics used to correct comparison output. The conservative approved per-request estimate places total OpenAI API cost below $0.009; D1 reserved $0.020 of application budget. A subsequent request returned `Local guide` with `viewer_day` before any provider call, confirming the deployed daily limit.

Automated checks cover provider failure, timeout, malformed/model-invalid output, oversized requests, rate refusal, application-budget refusal, one-call/no-retry behavior, key non-disclosure, reference resolution and structured two-object evidence. Final verification: production build and lint pass; all 79 automated tests pass.

The natural-answer update adds targeted coverage for Earth dogs, Mars color, Europa habitability, Jupiter's moons, jumping on the Moon and the current modeled Mars–Earth distance. Qualitative answers can be AI-composed without irrelevant cards; the distance answer must cite `body-distance`, and unsupported exact numbers still fail validation to the deterministic Local guide. The production UI keeps the answer first and places grounding details under **Sources & data**.
