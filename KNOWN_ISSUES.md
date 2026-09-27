# Solar System Explorer — Known Issues and Technical Debt

Last reviewed: 2026-09-14 UTC

Severity: **High** blocks a core path/risks serious regression; **Medium** materially affects quality/access/performance; **Low** is contained polish or deferred capability.

## Active issues

UI checkpoint A adds faster timelapse and contrast but does not claim every visual problem resolved. Moon motion is numerically verified; following the Moon masks its movement relative to the camera. High timelapse can alias fast satellites. Reported post-search guide dismissal remains a reproduction task; a sticky Back to space escape route is added. Target-visible travel is still pending. See `docs/UI_GRAPHICS_PLAN.md`.

Step 16: context-aware local guide is implemented, but open-ended/multi-turn LLM conversation, durable paid-endpoint abuse/spend controls and refreshed legacy educational prose are not. The output validator is a format guard, not a scientific truth verifier. Paid activation is deliberately unavailable pending owner authorization and those safeguards (`docs/AI_GUIDE.md`).

| ID | Description | Severity | Status | System | Workaround | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| KI-002 | Full WebGL appearance, logarithmic depth, camera-relative rendering, and the updated custom atmosphere shaders were not verified because the supervised browser lacked WebGL. | Medium | Validation gap | WebGL visuals, scale | Use the verified Canvas compatibility path. | Record desktop/mobile WebGL QA before V1.2 release. |
| KI-003 | A minified production chunk exceeds 500 kB. | Medium | Open | Startup | Current build works. | Measure transfer/parse time; refine lazy loading/chunking only with evidence. |
| KI-004 | Smooth acceleration/deceleration and steering are implemented with normalized combined axes, but physical keyboard/touch feel and tuning are not yet validated. | Medium | V1.2 implementation complete; validation open | Flight | Brake/focus remains immediate and assisted travel remains available. | Validate on physical keyboard/touch devices and tune response only from evidence. |
| KI-005 | Assisted arrival framing has only been visually checked for Earth, Saturn, and the Sun in compatibility mode. | Medium | Partially improved | Camera | Refocus after arrival. | Verify all body sizes, WebGL, reduced motion, and mobile during V1.2. |
| KI-008 | Saturn ring/planet shadows are enabled in WebGL, but Canvas uses lighting/occlusion approximations rather than physical shadow projection. | Low | Intentional parity limit | Saturn, Canvas | Use WebGL for full treatment. | Verify WebGL transparency/shadow quality; keep Canvas approximation unless evidence justifies more cost. |
| KI-010 | Labels can overlap and lack body occlusion. | Low | Open | Labels | Toggle off/use search. | Crowding priority, distance/selection rules, occlusion checks. |
| KI-011 | Automated coverage now protects navigation transitions and frame-rate-independent motion response, but still cannot validate camera feel, WebGL visuals, or physical touch-device behavior. A prior 390 × 844 compatibility check covers the mobile HUD. | Medium | Partially improved | QA | Manual/supervised testing. | Repeatable WebGL and physical-device checklist, including smoothed flight, accelerated orbital motion and the mobile clock sheet. |
| KI-012 | Search covers all 32 local records, but the guide has full curated topic packs only for the original ten destinations and remains keyword-based, not AI. New moons answer sourced facts/numerical topics and explicitly decline missing topic packs. | Low | Partial fallback added; intentional V1.1 | Guide | Use the object information panel for complete verified moon content. | Add reviewed topic packs or build grounded AI only after approved provenance, privacy and cost design. |
| KI-013 | The robust clock still supports forward playback only and clamps at the final valid millisecond of 2049; there is no date picker or reverse rate. | Low | Partially improved; broader time deferred | Time | Pause or use 1×/10×/100×/1,000× within the model range. | Date/reverse UI with model-validity semantics and a validated ephemeris strategy. |
| KI-014 | Earth uses the Earth–Moon barycenter; all major moons use sourced fixed mean ellipses that omit precession/perturbations and have no validated error bounds. | Medium | Frame conversion implemented; ephemeris accuracy remains open | Astronomy | UI/result metadata marks satellite positions illustrative. | Use validated local Horizons/SPICE snapshots and proper time conversion when ephemeris accuracy is required. |

| KI-016 | No source-code license selected. | Low | Open decision | Legal/repo | Repository stays private. | Owner selects license before public/open-source distribution. |
| KI-017 | WebGL soft-shadow cost has not been measured on physical low/mid-range devices. | Medium | Open validation | Performance, WebGL | Mobile uses a smaller shadow map. | Profile frame time/memory on representative devices and reduce shadow scope/resolution if needed. |
| KI-018 | Ceres, Pluto and Charon remain information-only. Ceres/Pluto positional elements are not imported, so Charon cannot be placed heliocentrically despite stored parent-relative elements. | Medium | Reduced from 22 to 3 records | Data/scene/search | Information works; Show/travel are visibly disabled and unsupported position queries return unavailable. | Import and validate local Ceres/Pluto positions before activating all three. |
| KI-019 | Existing planet descriptions, temperatures and guide-topic prose remain legacy-curated. Major-moon descriptions/facts/atmospheres and object-education profiles were NASA-reviewed on 2026-09-14. | Low | Major-moon scope resolved; legacy review pending | Knowledge | Layer boundaries distinguish educational summaries from reference science/live values. | Review remaining legacy planet/guide copy as a separate editorial milestone. |
| KI-020 | Derived satellite/solar gravity has no propagated uncertainty and ignores shape/rotation. | Low | Documented approximation | Physical data | Quality/notes are exposed with sources. | Propagate uncertainties where useful; model irregular-body gravity only when required. |
| KI-021 | Standalone TypeScript check reports nullable flight state and missing Worker ambient types (`cloudflare:workers`, `Fetcher`, `D1Database`). | Medium | Existing check gap identified | Development tooling | Verified production build, lint and runtime tests pass; no errors reported in new data modules. | Correct flight narrowing and configure Worker type generation without changing gameplay. |
| KI-022 | Spacecraft distance in Exploration Scale is a focused-body-local navigation estimate, not a globally physical camera ephemeris. | Low | Intentional model limit | Distance/scale | Use Scientific Scale for exact linear camera-coordinate conversion; the UI labels Exploration output as an estimate. | Introduce an authoritative spacecraft/navigation coordinate independent of presentation scale if later gameplay requires physical spacecraft trajectories. |
| KI-023 | Minor-body paged storage/search and sample importer now work; bulk ingestion, object-storage hosting and fine spatial indexes are not implemented. | Medium | Partially resolved | Catalogue/scaling | Use the 19-object sample and bounded queries. | Streaming import/external sort, object storage, time-valid spatial index and end-to-end large-catalogue benchmarks before bulk rollout. |
| KI-027 | Step 15's 1,100 representative region markers are bounded, explicitly labelled and now have a dedicated fitted overview, but their apparent sparsity, contrast and Canvas/WebGL cost have not been checked on physical desktop/mobile GPUs. | Medium | Validation gap | Population rendering | Use the Small-body regions view or toggle the layer off. | Include both scales and all four regions in physical-device/WebGL QA; tune opacity/count only from evidence while preserving disclosure. |

## Deferred capabilities, not current bugs

- Terrain/atmospheric entry/landing, real spacecraft physics or transfer simulation, accurate eclipses/n-body perturbations, large catalogues, additional worlds/probes, sound, accounts, admin, analytics, broader time UI, and live cited AI.

## Resolved/stabilized history

- September 2026 mobile input maintenance correction: catalogue search no longer retains a vertical-centering transform after its mobile safe-area placement, and both search and guide text entry meet iOS's 16px no-auto-zoom threshold. This is not official roadmap Step 18; physical-device validation remains under KI-011.

- Step 17 owner-review corrections: the unstable animated time-rate picker was replaced by a native selector; the permanent population legend and desktop flight text were converted to compact/contextual UI; close Canvas Saturn uses a bounded higher-detail sphere raster; the brand now tracks completed development step 17. Build, lint and 62 tests pass. Physical-device/full-WebGL appearance remains covered by KI-002/KI-011.

- KI-015: canonical science/editorial/rendering data separated in Step 8; the combined ten-body `Body` shape remains only as a compatibility adapter. Versioned unit/provenance/missing-value and parent validation added.
- Playable V1: `719e8cd`.
- Controls/fallback stabilization: `fa6a107`.
- Mobile/persistence/guide/build improvements: `2582807`.
- Repository/CI/documentation baseline: `acf79e7`, `89d24cd`.
- Canvas overview framing: corrected in VISUAL PASS #1 with renderer cache invalidation, a wider overview, and left-biased composition; all ten labels were visible in desktop inspection.
- Earth night map: activated only on the unlit hemisphere in WebGL and Canvas.
- Sun corona: added as a restrained local layer without global bloom.
- Orbit styling: muted nonfocused paths and clearer focused context added in both renderers.
- Saturn compatibility rings: segmentation increased and faceting reduced during rendered inspection.
- Scale architecture: centralized two-scale transforms, parent-local satellite placement, camera-relative rendering, adaptive clipping, and double-to-float active-buffer conversion added; build/lint/16 tests and compatibility gameplay passed.
- Mobile HUD obstruction: resolved by replacing the stacked mobile overlays with a compact default dock, unified bottom sheet, optional touch-flight controls, and hide/restore mode. Phone-sized compatibility rendering and interaction checks passed; physical-device validation remains under KI-011.
- Frame-dependent simulation-time accumulation: resolved by a monotonic anchored clock with validated rates, continuous rate changes, model-boundary clamping and dedicated regressions. Planet motion remains approximate under D005; lunar accuracy remains under KI-014.
- Planet-specific details markup and unavailable-value placeholders: resolved by the reusable type-aware object-information presenter and omission regressions. Future catalogue integration remains tracked under KI-018/KI-019.
- Fixed body-only distance comparison: resolved with contextual targets, simulated timestamps, average-orbit separation, magnitude-aware units, unavailable states and a disclosed spacecraft estimate. The Exploration Scale limitation remains tracked as KI-022.

## Maintenance rules

- Do not close an issue because only one renderer/device reproduces it.
- Mark uncertainty; do not promote suspicion to fact without evidence.
- Rendering fixes check both paths where applicable.
- Scientific fixes update [ASTRONOMY_DATA.md](ASTRONOMY_DATA.md).
- Decision changes update [DECISIONS.md](DECISIONS.md).

## Step 14 limitations

- **KI-024 — Minor ephemeris accuracy (Medium, open, astronomy):** Fixed osculating ellipses omit perturbations/outgassing and have no validated error bounds. UI labels them illustrative; replace with validated bounded ephemerides where required.
- **KI-025 — Minor presentation integration (Low, open, UX/rendering):** Minor markers have dedicated selection cards, details and navigation, but do not enter the primary destination progress/guide/distance-comparison controls. No physical shape assets or tails. Use the minor catalogue and its heliocentric distance; later unify presenter/selection contracts without eager loading.
- **KI-026 — Spatial query completeness (Low, by design, catalogue):** Dense radial shells may exceed the 64-candidate budget. UI reports incomplete samples; use search for known objects. Add finer conservative spatial partitioning before large imports.


## Step 19 sign-off gate — 2026-09-22

All eight priority implementations and compatibility-distance inspections exist. The inspection browser cannot create WebGL, so GPU shader compilation/appearance, Moon bump strength, Earth atmospheric/night depth, Saturn ring shadows, real draw-call/texture cost and physical mobile performance remain unverified. This prevents marking Step 19 complete. Canvas remains a reduced-detail ~9-redraw/s fallback with approximate ring occlusion and static/baked source lighting; imagery does not validate orientation or real-time weather. See `docs/STEP_19_CHECKPOINT.md` for the exact next action. No known source-level test failure is accepted as completion.

Update 2026-09-27: owner mobile/WebGL use exposed black artifacts around Jupiter's moons and Saturn. The existing v34 policy excludes illustrative moon/ring-sheet shadow contributions while retaining direct lighting and Saturn-on-ring shading. Enlarged geometry/coarse shadows remain a source-level hypothesis, not a GPU-proven root cause. This continuation retains that mitigation and fixes a confirmed source/compiled-CSS mobile-search positioning conflict (independent translate), keyboard viewport sizing and duplicate filtering. Build/lint/105 tests pass. Required managed browser tooling is unavailable; no new rendered phone/WebGL verification occurred. Both rendering defects and mobile-search visual sign-off remain open; do not infer completion from policy tests.
