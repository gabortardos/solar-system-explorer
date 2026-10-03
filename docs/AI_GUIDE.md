# Steps 17–18 + Astronomy Guide v2 — Grounded Conversational Guide

Status: **Steps 17 and 18 complete; Astronomy Guide v2 foundation complete and published** on 2026-10-03. Production uses `gpt-5.6-luna` through the OpenAI Responses API, bounded authoritative-source retrieval, signed multi-turn continuity and a deterministic Local guide fallback.

## Bounded conversation architecture

- Typed questions may include one opaque HMAC-signed conversation token issued by the Worker. The browser cannot create or alter trusted context.
- The token retains at most three compact recent turns: bounded question/answer summaries plus selected, resolved subject, comparison and intent IDs. It expires after two hours and never grows beyond the fixed limit.
- The Worker verifies the signature, expiry, schema, IDs and intent vocabulary before using any turn. Tampered, malformed or expired state fails closed to a fresh conversation.
- Current scene selection remains authoritative. If selection changes, vague pronouns resolve to the newly selected object rather than a stale subject. Explicit names and validated recent resolution support follow-ups such as “Why?”, “its moons,” “compare that with Earth,” and “what mission discovered that?”.
- Recent answer text is conversational continuity only, never scientific evidence. Every new answer rebuilds structured evidence from the canonical server bundle; current information still follows the Step 18 allowlisted retrieval rules.
- A New conversation action drops the browser token and visible recent thread immediately. It makes no network or AI call.
- Local preset questions remain direct deterministic browser calls. They do not enter the signed conversation, call the API, reserve D1 quota or consume Live allowance.

This design needs no conversation database and stores no unbounded transcript. `GUIDE_CONVERSATION_SECRET` is server-only and separate from `OPENAI_API_KEY`.

## Request and trust boundary

1. The browser captures one immutable request-time snapshot: selected object, simulation timestamp, spacecraft/navigation estimate, coordinate basis and scene anchor.
2. The browser sends only the question, selected object ID, bounded navigation snapshot and a unique request ID to `POST /api/guide`.
3. The Worker validates the body and rebuilds the astronomy context and evidence from the server-bundled canonical catalogue. Browser-supplied facts, source URLs and explanations are never trusted.
4. The Worker resolves contextual references and creates bounded structured project evidence before any provider call.
5. After an atomic D1 quota reservation, only questions about current or mission information can trigger one bounded server-side retrieval from a canonical NASA/ESA/JPL/USGS allowlist. The browser cannot supply a URL. Retrieval is limited to one source, four seconds, one megabyte and a 3,500-character relevant excerpt.
6. The Worker makes one non-streaming Responses API call with `store: false`, no model tools or provider-side web search, a 400-token output ceiling and a 10-second timeout. Failed calls are not retried automatically.
7. Strict JSON output may contain natural qualitative text, structured-value references and citation IDs. Citation IDs must match evidence actually supplied by the server. The server rejects unsupported numerical prose, URLs, invented/unknown citations, malformed JSON and oversized output.
8. The browser receives the answer and only the evidence records materially referenced by that answer, never `OPENAI_API_KEY`. A visible badge identifies `Live AI` or `Local guide`.

`GET /api/guide` is a non-paid health check. It reports the model, provider configuration, D1 readiness, bounded retrieval mode and the current viewer's safe quota summary; it never returns the secret, viewer hash, network address or database details.

## Contextual-reference policy

- “Here” means the selected object, not the spacecraft location and not an implicit arrival.
- “This moon” resolves to the selected moon. If a planet is selected, it resolves only when the moon is uniquely determined or explicitly named.
- “This planet” and “that planet” resolve to the selected planet, or to the parent planet when a moon is selected.
- Explicit named objects may become the subject when the question is not a comparison.
- Comparisons retain the resolved selected subject and use structured evidence for both objects.
- “How far am I from this moon?” uses the captured spacecraft/navigation snapshot and the selected moon position at the captured simulation time.

The response retains `resolution.selectedId`, `subjectId`, `comparisonId` and a plain-language interpretation so the UI and tests can verify what each phrase meant.

## Three-level source hierarchy

1. **Project-structured data** remains authoritative for application measurements, calculated distances, spacecraft position, simulation time, orbital values and physical values. Exact values are rendered server-side from evidence IDs; the model cannot supply or alter them.
2. **Authoritative external evidence** is retrieved only when information is current or missing, and only from a server-owned allowlisted source. It is labelled as a dated snapshot and never writes into the canonical project dataset.
3. **Model general knowledge** may support qualitative explanations and ordinary science. It is not presented as verified application data.

AI explanatory/general knowledge may be used for qualitative astronomy explanations, ordinary science, common-knowledge questions, well-established mission context and conversational follow-ups. This permits direct answers to questions such as whether dogs live on Earth, why Mars looks red, how a jump on the Moon would feel, or why Jupiter has many moons. Such prose is not labelled as verified application data and does not receive an evidence card unless structured data actually supports it.

If external evidence and project data share a claim key but differ, the response records a source discrepancy and preserves the project value. Canonical data updates remain a separate deliberate maintenance process. If current retrieval fails or no allowlisted source is registered, the model must not guess current mission status, discoveries or classifications. Approximate, illustrative, incomplete or scientifically uncertain evidence remains qualified.

The answer is the primary UI content. The `Live AI` / `Local guide` badge remains visible, while request-time snapshot details, context resolution, data quality and materially relevant evidence cards are grouped under the collapsed **Sources & data** disclosure.

## Evidence coverage

The live boundary supports selected planets and moons, habitability, atmosphere, water/ice, missions, physical facts, spacecraft-to-object distance, body-to-body distance and two-object comparisons. Missing fields remain unavailable. Current mission questions can retrieve the resolved object's official NASA page; Mars acceptance uses `https://science.nasa.gov/mars/`.

The provider does not replace trusted structured astronomy values. Comparison prompts receive a small balanced subset for concise generation. Live responses return only evidence IDs the model actually cited; deterministic Local guide responses retain their bounded topic evidence.

External source titles, URLs and retrieval dates come from the retrieval result, never model output. Evidence cards classify each item as **Project data** or **Retrieved authoritative source** inside **Sources & data**.

## Cost and abuse controls

Development policy: the project owner may sign in through the Site's platform-owned ChatGPT sign-in flow. The Worker compares the trusted server-injected authenticated email with a server-only owner setting. Matching owner requests bypass per-viewer and global request-count ceilings, but they are still inserted into D1, reserve the same worst-case cost, and remain subject to rolling/lifetime application budgets and the OpenAI project hard limit. No IP whitelist or browser secret is used.

Current public policy: anonymous and non-owner visitors receive 10 Live AI reservations per minute and 50 per rolling 24 hours. Public traffic remains subject to the global and monetary protections below. Developer rows are recorded with a one-way identity hash and excluded only from public/global request-count calculations.

The guide shows the public viewer's current rolling count from the same D1 rows used by reservation enforcement, refreshes it after each server request and shows the server-calculated minute/day availability time when a viewer limit is reached. The authenticated owner instead sees **Developer access · no request-count limit**. Limit fallbacks remain usable Local-guide answers, but the visible notice makes the reason and retry timing explicit.

The displayed preset question buttons are derived from the selected object's available data and reviewed topic coverage, then explicitly routed to the deterministic Local guide in the browser. Weak spacecraft-location defaults are not promoted, and unavailable temperature/mission topics are hidden rather than returning boilerplate. Presets make no `/api/guide` request, reserve no D1 row, consume no public Live AI allowance and perform no external retrieval. User-written questions continue through the Live AI boundary. A future preset that genuinely requires current information must be deliberately configured for the live route rather than inferred from its wording.

- Request body: 12,000 UTF-8 bytes maximum, including the bounded signed token.
- Question: 600 characters maximum.
- Estimated provider input: 2,000 tokens maximum.
- Provider output: 400 tokens maximum.
- Timeout: 10 seconds; no automatic paid retry.
- Per public network address: 10 reservations per minute and 50 per rolling 24 hours.
- Global public traffic: 10 per minute, 100 per rolling 24 hours and 1,000 per rolling 31 days.
- Reservation: $0.002 worst-case per attempted provider call.
- Application caps: $2 rolling 31 days and $4 lifetime reserved spend.
- The separate OpenAI project has the owner-configured $5 hard spend limit.

Future policy: the temporary owner/public distinction will be replaced by user-account, membership and subscription-based limits when those product systems are deliberately introduced.

`drizzle/0000_guide_limits.sql` creates `guide_requests`, `guide_budget_totals`, indexes and the `guide_requests_budget_insert` trigger. A single conditional insert reserves quota atomically. Duplicate request UUIDs are blocked. Failed, timed-out and invalid responses retain their reservation so failures cannot bypass the budget.

## Fallback behavior

The deterministic Local guide is returned when the provider key, D1, quota, budget, network, provider, timeout or output validation is unavailable. The client also falls back locally if the server cannot be reached or returns an invalid response. Malformed and oversized requests are rejected before quota reservation or paid work.

External retrieval failure is non-destructive: a Live response may state that current information could not be verified, while a provider failure still returns the deterministic Local guide. External evidence is removed from Local fallback cards because the Local answer did not use it.

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

Post-Step-18 diagnosis confirmed that repeated Local-guide responses were caused by the former 10-per-day public viewer ceiling, not an OpenAI or D1 failure. The public policy was raised to 10/minute and 50/rolling-day, authenticated owner development access was added without weakening monetary controls, and the UI now exposes D1-backed usage/reset state. Local presets are the explicit free path and leave that counter unchanged.

Automated checks cover provider failure, timeout, malformed/model-invalid output, oversized requests, rate refusal, application-budget refusal, one-call/no-retry behavior, key non-disclosure, reference resolution and structured two-object evidence.

Astronomy Guide v2 adds tests for signed context, “Why?” intent inheritance, pronouns, moons, comparisons, selection changes, token tampering, expiry, reset, three-turn retention, quota refusal, provider fallback, current-mission retrieval and citation preservation. The full production suite contains 123 tests.

The natural-answer update adds targeted coverage for Earth dogs, Mars color, Europa habitability, Jupiter's moons, jumping on the Moon and the current modeled Mars–Earth distance. Qualitative answers can be AI-composed without irrelevant cards; the distance answer must cite `body-distance`, and unsupported exact numbers still fail validation to the deterministic Local guide. The production UI keeps the answer first and places grounding details under **Sources & data**.

Step 18 acceptance adds project-authoritative radius, contextual distance, current Mars mission retrieval, scientific uncertainty, synthetic source conflict, citation-integrity, retrieval-failure and fallback coverage. The final production request, “What is the latest active mission at Mars?”, returned `mode: live`, `external.status: retrieved`, and an `authoritative-external` evidence record whose URL was the actually retrieved NASA Mars page. The answer kept current NASA facts separate from project context and contained no fabricated URL or unsupported precise value. The earlier all-numbers validator issue remains fixed by allowing a numeric phrase only when it appears exactly in cited authoritative external evidence.

Live-access maintenance shipped in Site version 30. Production verified two consecutive authenticated owner questions as `Live AI` with developer access, public usage advancing from 3/50 to 4/50 after a typed Live question, and a clicked local preset leaving the counter unchanged at 4/50. D1 recorded both public and developer calls with successful model/token telemetry and normal $0.002 reservations. Build and lint pass; all 89 automated tests pass.
