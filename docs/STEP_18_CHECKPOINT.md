# STEP 18 CHECKPOINT — AI SOURCE AND FACT CHECKING

Status: **IN PROGRESS — implementation complete, one production acceptance call pending**

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
- The corrected validator is covered by targeted tests and is published in the next Site version.

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

## Remaining test

After the paid-call allowance resets, make exactly one production request with Mars selected:

`What is the latest active mission at Mars?`

Pass criteria:

- `mode` is `live`;
- `external.status` is `retrieved`;
- at least one returned evidence card has `sourceClass: authoritative-external`;
- its URL is the actually retrieved NASA Mars URL;
- the answer distinguishes current sourced facts from project-curated context;
- no fabricated URL or unsupported precise value appears.

If it passes, update `docs/AI_GUIDE.md`, `PROJECT_STATE.md`, `ROADMAP.md` and this checkpoint to **COMPLETE**, then publish and sync the documentation-only closeout. If it fails, inspect the recorded fallback reason, fix only that issue, rerun targeted guide tests, and repeat one paid call only when allowed.

## Known blocker

The explicit real-paid-request ceiling has been reached. Do not bypass it or change network identity/rate controls.

## Exact next action

Repeat the single Mars current-mission production request after the paid-call allowance resets.

Recommended continuation model: **Sol High / high reasoning**, because the remaining work is a narrow production-validation and evidence-integrity check, not an architecture redesign.
