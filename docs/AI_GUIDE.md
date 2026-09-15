# Step 16 — Guide foundation

## Implemented prototype (no external account or usage charges)

The guide is a deterministic local assistant, not a connected LLM. Existing legacy guide exports remain for compatibility; the visible guide uses `guide-assistant.ts`.

1. Scene `getGuideNavigation()` captures simulation time, camera-derived coordinates, coordinate basis/anchor and selected minor record together. Scientific conversion reverses scene axes into heliocentric ecliptic J2000 AU. Exploration coordinates remain estimates; minor-focused Exploration coordinates return unavailable.
2. `buildGuideContext()` copies selection and science, dataset version and nearest five core objects at that instant. This is a bounded core-catalogue neighborhood, not a full minor-body census. Region dots are excluded.
3. `answerContextGuide()` resolves “here” to the selected object, never implicit arrival. Spacecraft questions use the separate navigation context. It returns explanation and typed evidence separately; numerical fields preserve units, missing reasons, quality, notes and registry citations.
4. UI retains the answer subject/time, renders React text (not model HTML), labels legacy prose, and allows one request at a time with a 600-character input cap. Questions/answers stay in memory and are not persisted or sent externally.

Limitations: local keyword intents, no multi-turn inference or general question answering; older educational numerical prose is explicitly legacy-curated, not authoritative measurements. Missing moon/minor habitability content is declined. Named-object comparison and open-ended questions require future intent resolution. Hardware visual QA remains separate.

## Future paid LLM boundary — disabled, not production-ready

The exported provider/segment contract and output format validator form a testable seam, not an activated provider. There is no API route, API key, fetch to an LLM, or paid fallback. Adding a key alone cannot activate usage.

Required before activation:

- Owner approves provider/model, monthly hard spend ceiling, expected audience, and transmission of question plus bounded simulation context. No account identities, browsing history, raw camera scene, or secrets go into prompts.
- Configure the provider key as a server-only Sites secret. For OpenAI, use the OpenAI Developers plugin's API-key workflow; never paste keys in chat or client code.
- Add a Worker-compatible server endpoint. Validate body IDs/time/question length; retrieve canonical evidence on the server, never trust client-supplied facts/source URLs. Client navigation coordinates are explicitly untrusted simulation estimates.
- Separate intent/retrieval from explanation. Facts are rendered from server evidence IDs; the model may not supply numeric literals or URLs. The format validator is defense-in-depth only: it cannot prove semantic entailment or block every spelled-out/indirect quantity. Unsupported claims require refusal or reviewed evidence-bound templates, not prompt-only trust.
- Before exposing a public paid endpoint, implement atomic durable global budget reservation and per-viewer/session limits with abuse protection. In-memory Worker counters or browser localStorage are not hard spend limits. No auth/database is activated in this foundation.
- Proposed budgets: question 600 characters, bounded evidence 12 items, input 2,000 tokens, output 400 tokens, timeout 10 seconds, no automatic paid retries, no automatic calls on selection/frame/time change. Reject requests exceeding budget, fail to local mode, and expose a server kill switch.
- Cache only identical canonical question/subject/dataset/context keys; dynamic keys include exact simulation timestamp/coordinate basis. Never reuse a date-dependent answer as current. Cache bounded public stable answers; avoid retaining personal questions. No provider tools/web search in the first paid release.
- Record token totals and request status without question text. Reserve worst-case request cost before calling; reconcile actual usage afterward. Budget exhaustion refuses paid generation.

## Cost approval

Current prototype: zero LLM calls and $0 LLM usage cost. No external API/account is required.

Before a paid provider is chosen, obtain its current official prices and present a dated estimate: `(input_tokens × input_price_per_million + output_tokens × output_price_per_million) / 1,000,000`, multiplied by expected monthly requests, plus any explicit tool/storage charges. Do not activate against an undated guessed price or claim a provider dashboard alert is a hard cap. Owner approval must cover the precise provider, data transmitted, audience and enforced maximum spend. Paid activation is a separate gated task.
