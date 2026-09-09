# Solar System Explorer — Known Issues and Technical Debt

Last reviewed: 2026-09-09 UTC

Severity: **High** blocks a core path/risks serious regression; **Medium** materially affects quality/access/performance; **Low** is contained polish or deferred capability.

## Active issues

| ID | Description | Severity | Status | System | Workaround | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| KI-002 | Full WebGL appearance, logarithmic depth, camera-relative rendering, and the updated custom atmosphere shaders were not verified because the supervised browser lacked WebGL. | Medium | Validation gap | WebGL visuals, scale | Use the verified Canvas compatibility path. | Record desktop/mobile WebGL QA before V1.2 release. |
| KI-003 | A minified production chunk exceeds 500 kB. | Medium | Open | Startup | Current build works. | Measure transfer/parse time; refine lazy loading/chunking only with evidence. |
| KI-004 | Manual input has no acceleration, inertia, or sensitivity control. | Medium | V1.2 planned | Flight | Use assisted travel/brake/refocus. | Add smooth velocity/acceleration/deceleration and tests. |
| KI-005 | Assisted arrival framing has only been visually checked for Earth, Saturn, and the Sun in compatibility mode. | Medium | Partially improved | Camera | Refocus after arrival. | Verify all body sizes, WebGL, reduced motion, and mobile during V1.2. |
| KI-008 | Saturn ring/planet shadows are enabled in WebGL, but Canvas uses lighting/occlusion approximations rather than physical shadow projection. | Low | Intentional parity limit | Saturn, Canvas | Use WebGL for full treatment. | Verify WebGL transparency/shadow quality; keep Canvas approximation unless evidence justifies more cost. |
| KI-010 | Labels can overlap and lack body occlusion. | Low | Open | Labels | Toggle off/use search. | Crowding priority, distance/selection rules, occlusion checks. |
| KI-011 | Automated coverage omits camera feel, WebGL visuals, and physical touch-device behavior. A source contract and 390 × 844 rendered compatibility check now cover the responsive HUD structure. | Medium | Partially improved | QA | Manual/supervised testing. | Focused engine tests plus repeatable WebGL and physical-device checklist. |
| KI-012 | Search/guide cover ten bodies; guide is keyword-based, not AI. | Low | Intentional V1.1 | Search/guide | Use suggested topics. | Generalize data/search before grounded AI. |
| KI-013 | Time only advances and clamps at end of 2049. | Low | Deferred | Time | Pause/use forward rates. | Date/reverse UI with model-validity semantics. |
| KI-014 | Moon and Earth positions are simplified. | Medium | Documented | Astronomy | UI discloses limits. | Verified ephemeris strategy for higher-accuracy mode. |
| KI-015 | `Body` mixes science, editorial, and rendering fields. | Medium | Debt before expansion | Data | Fine for ten bodies. | Validated/versioned schemas with units, provenance, parents, type fields. |
| KI-016 | No source-code license selected. | Low | Open decision | Legal/repo | Repository stays private. | Owner selects license before public/open-source distribution. |
| KI-017 | WebGL soft-shadow cost has not been measured on physical low/mid-range devices. | Medium | Open validation | Performance, WebGL | Mobile uses a smaller shadow map. | Profile frame time/memory on representative devices and reduce shadow scope/resolution if needed. |

## Deferred capabilities, not current bugs

- Terrain/atmospheric entry/landing, real spacecraft physics or transfer simulation, accurate eclipses/n-body perturbations, large catalogues, additional worlds/probes, sound, accounts, admin, analytics, broader time UI, and live cited AI.

## Resolved/stabilized history

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

## Maintenance rules

- Do not close an issue because only one renderer/device reproduces it.
- Mark uncertainty; do not promote suspicion to fact without evidence.
- Rendering fixes check both paths where applicable.
- Scientific fixes update [ASTRONOMY_DATA.md](ASTRONOMY_DATA.md).
- Decision changes update [DECISIONS.md](DECISIONS.md).
