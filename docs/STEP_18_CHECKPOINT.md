# STEP 18 CHECKPOINT — AI SOURCE AND FACT CHECKING

Status: **COMPLETE — implementation, production acceptance, publication and continuity sync complete**

Date: 2026-09-21 UTC

## Completed phases

- Preserved the Step 17 Worker/OpenAI/D1/Local-guide architecture and all existing cost, rate, timeout, output and no-retry controls.
- Added `worker/guide/authoritative-sources.ts` with one-source, allowlisted NASA/ESA/JPL/USGS retrieval for explicit current/mission questions.
- Retrieval occurs only after D1 reservation and is bounded to four seconds, one megabyte and a 3,500-character relevant excerpt.
- Added evidence classes for project-structured data, project-curated context and authoritative external snapshots.
- Added validated `citationIds`; model-created URLs or unknown citation IDs fail closed.
- Added retrieval timestamps, source-class UI labels, retrieval-failure disclosure, uncertainty instructions and typed source-conflict reporting.
- Preserved natural qualitative/general-knowledge answers and exact project-value rendering.
- Resolved the former mobile-maintenance/Step 18 numbering collision across permanent documentation.
- Targeted tests and the full build/lint/86-test suite pass.

## Production status

- Site version 27 initially published the Step 18 implementation.
- Health check passed with D1 ready, `gpt-5.6-luna` configured and allowlisted retrieval reported.
- Production question: “What is the latest active mission at Mars?”
- Result: NASA retrieval succeeded with a real retrieval date, but model output was rejected by the old all-numbers validator and safely returned Local guide.
- Root cause fixed: model-written numeric phrases are now accepted only when the exact phrase appears in cited authoritative external evidence. Uncited numbers and project measurement prose remain blocked.
- The corrected validator is covered by targeted tests and was published in Site version 28.
- Final production acceptance on 2026-09-21 returned HTTP 200 with `mode: live` and `external.status: retrieved`.
- The returned evidence used `sourceClass: authoritative-external` and the actually retrieved NASA Mars URL: `https://science.nasa.gov/mars/`.
- The answer separated current NASA-sourced mission status from project context and contained no fabricated URL or unsupported precise value.

## Files changed

- `worker/guide/authoritative-sources.ts`
- `worker/guide/endpoint.ts`
- `app/guide-assistant.ts`
- `app/page.tsx`
- `app/globals.css`
- `tests/guide-foundation.test.mjs`
- `tests/guide-live.test.mjs`
- `docs/AI_GUIDE.md`
- `PROJECT_STATE.md`
- `ROADMAP.md`
- `DECISIONS.md`
- `ARCHITECTURE.md`
- `KNOWN_ISSUES.md`
- `docs/UI_GRAPHICS_PLAN.md`

## Final acceptance

Mars selected: `What is the latest active mission at Mars?`

- Live response: PASS
- Authoritative retrieval: PASS
- Actual NASA citation: PASS
- Source-class integrity: PASS
- Fact/context separation: PASS
- No fabricated URL or unsupported precision: PASS

## Known blocker

None for Step 18.

## Exact next action

None. Step 18 is complete. Do not start Step 19 unless separately requested.
