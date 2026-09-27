# Step 19 checkpoint — updated 2026-09-27

**STEP 19 COMPLETE: NO. The reported mobile/WebGL shadow defects are fixed in source and covered by release checks; one post-fix real-device confirmation remains before final sign-off. Do not start Step 20.**

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

- Root cause: the presentation model deliberately enlarges moons and compresses moon systems, but every body surface both cast and received one global point-light shadow map. On mobile's 512px map, enlarged illustrative moons produced oversized/coarse eclipses and self-shadow artifacts around Jupiter.
- Saturn's transparent, alpha-tested ring sheet also cast into that map. Together with enlarged Saturnian moons, it could project a large blocky shadow across Saturn's globe; this was not a trustworthy physical ring-shadow simulation.
- Added an explicit shadow-participation policy. Illustrative moons neither cast nor receive shadow maps but retain normal PointLight/PBR day/night lighting. Major planets cast only onto opted-in receivers and do not receive the misleading moon/ring/self shadows.
- Saturn's ring no longer casts its coarse alpha sheet onto the planet. It remains normally lit and still receives Saturn's legitimate planet-on-ring shadow. Shadow bias was reduced and `normalBias` added for the remaining ring receiver.
- Earth, Moon, Jupiter, Saturn, Titan, rings and all existing LOD/cache paths are unchanged outside this shadow policy. Uranus was intentionally not redesigned.
- Targeted shadow-policy, body-detail and scene-contract tests pass. The production build, lint and full automated suite pass.

## Release verification

- Production build: PASS (`npm run build`), with the existing >500 kB chunk advisory.
- Lint: PASS (`npm run lint`).
- Full automated suite: **100/100 PASS**, including 11 new LOD/resource tests.
- No OpenAI requests, database migrations, account-policy or secret changes.
- Standalone TypeScript ambient-type/narrowing gaps were already known; do not confuse the successful release build with a clean standalone `tsc` run.
- The implementation was published as public Site version 32 on 2026-09-22 from Sites source `271c62bb30d242da6bafc11f6956096ac9ea7bf6`. On 2026-09-26, the same tracked source tree was mirrored to GitHub `main` as `8c13a3e92d43700b70d86880ac9ea0f4f8d80cb4` (tree `710182d35d15d8908557b7d3203dff6962153099`). Sites remains canonical.
- The unchanged implementation was rebuilt and retested on 2026-09-26: production build, lint and all 100 tests pass. The live Site still exposes `data-renderer="compatibility"` in the available browser, so this is a verified checkpoint, not Step 19 sign-off.

## Remaining sign-off action

The owner reproduced the original defects on real mobile/WebGL. The available inspection browser still reports `data-renderer="compatibility"`, so it cannot perform the required post-fix GPU/device reinspection. Step 19 remains open only until the published correction is confirmed on a real mobile WebGL device.

Exact next action: on the same mobile/WebGL path, revisit the four Galilean moons and Saturn long enough to cover rotation/orbit motion. Confirm the black moon patches and large pixelated Saturn shadow no longer appear, and quickly check rings, Earth, Titan, Moon, Jupiter and LOD transitions. If clean, change only the checkpoint/project-state status to `STEP 19 COMPLETE: YES`.

Known presentation limits: static source maps and illustrative spin/orientation; some baked lighting and uneven source resolution; Canvas is deliberately reduced detail and roughly 9 redraws/second; ring occlusion is approximate. No surface landing, walkable terrain, rover physics, procedural invented features or Step 20 features were added.
