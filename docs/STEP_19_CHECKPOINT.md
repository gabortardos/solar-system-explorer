# Step 19 checkpoint — updated 2026-09-27

**STEP 19 COMPLETE: YES. Owner acceptance on 2026-09-27 used production Site version 35 in a real mobile WebGL browser. Do not start Step 20.**

## Resume without restarting

The interrupted shared LOD design and downloaded assets were retained. All eight bodies are implemented: Earth, Moon, Mars, Jupiter, Saturn, Europa, Titan, Enceladus. No new architecture, asset research or re-download is needed. See `docs/CLOSE_APPROACH.md` for the code boundaries, exact source URLs, processing, cache budgets, body matrix and visual results. `docs/BODY_TEXTURE_MANIFEST.json` records all 31 assets and hashes.

## Finished in the continuation

- Fixed Canvas one-pixel placeholder decoding, stationary fade redraws, elapsed-time fades, focused-moon priority and auxiliary disposal/cancellation handling.
- Fixed Saturn ring segment seams, opacity/depth split and texture loading during moon approaches.
- Removed unused Moon relief downloads from Canvas; preserved sourced relief for WebGL.
- Softened Titan's atmosphere edge, preserved its opaque treatment and aligned Earth night-side masking with the GPU shader.
- Inspected rendered far/medium/close views for all eight bodies, including parent-system context, focused Moon detail retention, Earth night lights, mapped Europa/Enceladus terrain and Saturn rings.
- Confirmed detail release in far views and reduced decoded-pixel retention. Final preview error check: no application errors.

## Mobile/WebGL shadow correction — 2026-09-27

- Source-level hypothesis, not a reproduced GPU root cause: the presentation model deliberately enlarges moons and compresses moon systems, but every body surface both cast and received one global point-light shadow map. Mobile's 512px map and enlarged illustrative moons could produce oversized/coarse eclipses and self-shadow artifacts around Jupiter.
- Saturn's transparent, alpha-tested ring sheet also cast into that map. Together with enlarged Saturnian moons, it could project a large blocky shadow across Saturn's globe. No GPU capture has established which contributor caused the owner's artifact.
- Added an explicit shadow-participation policy. Illustrative moons neither cast nor receive shadow maps but retain normal PointLight/PBR day/night lighting. Major planets cast only onto opted-in receivers and do not receive the misleading moon/ring/self shadows.
- Saturn's ring no longer casts its coarse alpha sheet onto the planet. It remains normally lit and still receives Saturn's legitimate planet-on-ring shadow. Shadow bias was reduced and `normalBias` added for the remaining ring receiver.
- Earth, Moon, Jupiter, Saturn, Titan, rings and all existing LOD/cache paths are unchanged outside this shadow policy. Uranus was intentionally not redesigned.
- Targeted shadow-policy, body-detail and scene-contract tests pass. The production build, lint and full automated suite pass.

## Final-fixes continuation — mobile search

- Resumed the canonical v34 tree (`2613ab73ede177d34115d0cb741a5482ca3f0243`), matching GitHub mirror `dcdaea58facb13e14316797ad9572e8b9990341b`. Did not restore older mirror content.
- Confirmed a positioning defect in source and compiled CSS: Tailwind v4 emits independent `translate: -50% -50%` through the dialog utilities. The previous mobile `transform: translateX(-50%)` did not reset it, leaving a second horizontal shift and the unwanted vertical shift.
- Mobile now resets both `translate` and `transform`, anchors to the visual viewport, and resizes/repositions when the soft keyboard changes that viewport. Safe-area margins, bounded internal result scrolling and 16px input text remain. Viewport listeners are attached only while open and cleaned up on close.
- Composed existing Dialog/Command primitives at the application level: accessible title/description inside the dialog, fixed header and 44px Close target above input/results, 44px mobile action targets with bounded icons. Desktop keeps its centered 680px layout. No vendored primitive edits.
- Disabled cmdk's second filter so the catalogue provider owns ranking/matching; retained explicit no-results feedback. Nested action buttons no longer let Enter/Space also activate the row's default action.
- Added viewport-bound tests for 320px/390px phones, keyboard/offset and landscape geometry, plus composition/cleanup/CSS regression coverage. These are automated logic/source tests, **not rendered phone inspection**.
- Reviewed the existing shadow flags, bias/normalBias, ring alpha/material settings, sphere normals, camera-relative/depth path and LOD material callback. No additional GPU root cause was established. Kept the v34 mitigation unchanged; did not disable global lighting/shadows or alter LOD/assets/Uranus.
- This environment selects the managed Sites preview workflow, but its required `control-browser` skill is unavailable. Per that workflow, no substitute browser-control path was used. **No new browser or real WebGL visual QA was performed.** Earlier inspection used compatibility rendering only. No FPS or GPU-memory measurement is claimed.
- Release checks for this continuation: `npm test` (production build plus 105 tests) and `npm run lint`. Existing >500 kB chunk advisory remains. Publication and mirror commit are recorded in the release handoff; the matching source commit contains this checkpoint.

## Release verification

- Production build: PASS (`npm run build`), with the existing >500 kB chunk advisory.
- Lint: PASS (`npm run lint`).
- Full automated suite: **100/100 PASS**, including 11 new LOD/resource tests.
- No OpenAI requests, database migrations, account-policy or secret changes.
- Standalone TypeScript ambient-type/narrowing gaps were already known; do not confuse the successful release build with a clean standalone `tsc` run.
- The implementation was published as public Site version 32 on 2026-09-22 from Sites source `271c62bb30d242da6bafc11f6956096ac9ea7bf6`. On 2026-09-26, the same tracked source tree was mirrored to GitHub `main` as `8c13a3e92d43700b70d86880ac9ea0f4f8d80cb4` (tree `710182d35d15d8908557b7d3203dff6962153099`). Sites remains canonical.
- The unchanged implementation was rebuilt and retested on 2026-09-26: production build, lint and all 100 tests pass. The live Site still exposes `data-renderer="compatibility"` in the available browser, so this is a verified checkpoint, not Step 19 sign-off.

## Owner WebGL acceptance — 2026-09-27

The owner rechecked production version 35 on a real mobile WebGL browser: Jupiter and all four Galilean moons through orbital/rotational motion; Saturn, rings and shadows; Earth, Moon, Titan and LOD transitions. The previously reported Jupiter-moon black artifacts and Saturn black/pixelated shadow no longer reproduce. This is the required Step 19 real-device acceptance evidence.

The source-level rationale for the shadow policy remains documented as a hypothesis; acceptance is based on the observed absence of the defects on the intended rendering path. Mobile catalogue search remains a separate maintenance item and does not block the close-approach rendering milestone.

Known presentation limits: static source maps and illustrative spin/orientation; some baked lighting and uneven source resolution; Canvas is deliberately reduced detail and roughly 9 redraws/second; ring occlusion is approximate. No surface landing, walkable terrain, rover physics, procedural invented features or Step 20 features were added.
