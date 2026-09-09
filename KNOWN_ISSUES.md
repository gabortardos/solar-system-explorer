# Solar System Explorer — Known Issues and Technical Debt

Last reviewed: 2026-09-09 UTC

Severity: **High** blocks a core path/risks serious regression; **Medium** materially affects quality/access/performance; **Low** is contained polish or deferred capability.

## Active issues

| ID | Description | Severity | Status | System | Workaround | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| KI-001 | Canvas system overview showed inconsistent/oversized Earth framing in supervised inspection. | Medium | Open; environment-specific so far | Canvas, camera | Use focus/travel; prefer WebGL. | Reproduce; invalidate render cache on scene/focus changes; verify camera/matrices. |
| KI-002 | Full WebGL appearance was not verified because the supervised browser lacked WebGL. | Medium | Validation gap | WebGL visuals | Test in a capable browser. | Record desktop/mobile WebGL QA before V1.2 release. |
| KI-003 | A minified production chunk exceeds 500 kB. | Medium | Open | Startup | Current build works. | Measure transfer/parse time; refine lazy loading/chunking only with evidence. |
| KI-004 | Manual input has no acceleration, inertia, or sensitivity control. | Medium | V1.2 planned | Flight | Use assisted travel/brake/refocus. | Add smooth velocity/acceleration/deceleration and tests. |
| KI-005 | Assisted arrival framing is not consistently cinematic across body sizes/rings. | Medium | V1.2 planned | Camera | Refocus after arrival. | Body-aware approach/framing; test Sun, Earth, Saturn, outer planets, reduced motion. |
| KI-006 | `earth_nightmap.jpg` is unused. | Low | Open | Earth material | Ordinary shaded night side. | Restrained unlit-side night blend with honest labeling. |
| KI-007 | WebGL Sun has no dedicated corona/glow. | Low | V1.2 planned | Sun | Current texture works. | Performance-conscious layered/shader glow without excessive bloom. |
| KI-008 | Saturn lacks meaningful ring/planet shadows. | Medium | V1.2 planned | Saturn | Current ring remains visible. | Depth-safe shader/approximation; test transparency and Canvas. |
| KI-009 | Orbit lines are uniform and may clutter. | Low | V1.2 planned | Orbits | Toggle off. | Restrained target/context emphasis and distance-aware opacity. |
| KI-010 | Labels can overlap and lack body occlusion. | Low | Open | Labels | Toggle off/use search. | Crowding priority, distance/selection rules, occlusion checks. |
| KI-011 | Automated coverage omits camera feel, WebGL visuals, touch, and responsive layout. | Medium | Open | QA | Manual testing. | Focused engine tests plus repeatable browser/device checklist. |
| KI-012 | Search/guide cover ten bodies; guide is keyword-based, not AI. | Low | Intentional V1.1 | Search/guide | Use suggested topics. | Generalize data/search before grounded AI. |
| KI-013 | Time only advances and clamps at end of 2049. | Low | Deferred | Time | Pause/use forward rates. | Date/reverse UI with model-validity semantics. |
| KI-014 | Moon and Earth positions are simplified. | Medium | Documented | Astronomy | UI discloses limits. | Verified ephemeris strategy for higher-accuracy mode. |
| KI-015 | `Body` mixes science, editorial, and rendering fields. | Medium | Debt before expansion | Data | Fine for ten bodies. | Validated/versioned schemas with units, provenance, parents, type fields. |
| KI-016 | No source-code license selected. | Low | Open decision | Legal/repo | Repository stays private. | Owner selects license before public/open-source distribution. |

## Deferred capabilities, not current bugs

- Terrain/atmospheric entry/landing, real spacecraft physics or transfer simulation, accurate eclipses/n-body perturbations, large catalogues, additional worlds/probes, sound, accounts, admin, analytics, broader time UI, and live cited AI.

## Resolved/stabilized history

- Playable V1: `719e8cd`.
- Controls/fallback stabilization: `fa6a107`.
- Mobile/persistence/guide/build improvements: `2582807`.
- Repository/CI/documentation baseline: `acf79e7`, `89d24cd`.

## Maintenance rules

- Do not close an issue because only one renderer/device reproduces it.
- Mark uncertainty; do not promote suspicion to fact without evidence.
- Rendering fixes check both paths where applicable.
- Scientific fixes update [ASTRONOMY_DATA.md](ASTRONOMY_DATA.md).
- Decision changes update [DECISIONS.md](DECISIONS.md).

