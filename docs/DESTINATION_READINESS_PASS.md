# Destination Readiness Pass — Pluto and named small bodies

Status: implementation complete and published as production Site version 39 on 2026-09-28; actual rendered/WebGL acceptance remains for the owner PC session. This is an unnumbered quality pass before Step 20. Step 20 has not started.

## Activated core destinations

- Ceres and Pluto use a local linear six-element fit derived from 251 annual NASA/JPL Horizons geometric heliocentric osculating-element rows per body across 1800–2050. Raw responses, exact queries, checksums, reproduction code and validation output live in `data-source/horizons-pass3/`.
- The positions are explicitly `illustrative`, not ephemerides. Annual-checkpoint sampled validation is Ceres max 0.02561 AU / 0.548° and RMS 0.00988 AU / 0.197°; Pluto max 0.16804 AU / 0.176° and RMS 0.07382 AU / 0.077°. Maxima are not continuous-time guarantees.
- Charon retains the published Pluto-centered PLU060 mean ellipse. The missing NAIF Pluto pole transform is now stored; its circular mean longitude agrees with the J2000 Horizons check and it is added to Pluto target 999, not the system barycenter.
- All 32 catalogue records are now selectable scene destinations. Search, Show, Travel, information, distance, guide grounding and parent-relative Charon placement use the existing systems.
- NASA/New Horizons Pluto and Charon maps and a NASA/Dawn Ceres map use the shared identity-map cache at 256px base / 1024px close tier. After owner WebGL evidence, Pluto/Charon observational gaps use a broad feather into neutral, low-amplitude non-topographic material instead of a hard cap edge; no craters, ridges or geography are synthesized. Ceres is a colorized spectral mosaic, not literal natural color.

## Named small-body rendering

- Bennu, Ryugu, Itokawa, Eros, Vesta, Halley and 67P use compact source-derived global shape meshes. Exact sources, credits, caveats, sizes and hashes are in `SMALL_BODY_SHAPE_SOURCES.json`.
- Other named catalogue objects receive a deterministic, restrained irregular procedural visualization labelled approximate. It is not presented as a measured shape.
- Only the selected named body can hold one detailed mesh or one in-flight shape request. Switching, clearing, eviction and unmount abort and dispose the detailed geometry. Up to 12 existing marker entries remain the unchanged scene budget.
- The seven detailed files total 1,780,696 bytes. Each runtime mesh is capped at 30,000 vertices / 180,000 indices and uses 16-bit indices for WebGL1/mobile compatibility.
- Statistical asteroid-belt, Kuiper-belt and Trojan dots remain unchanged lightweight representative populations and never receive detailed meshes.

## Verification

- Source maps were inspected directly after processing; Horizons source checksums and fit reproduction pass.
- Automated coverage verifies all 32 destination positions, search activation, Charon parent consistency, source-shape transfer/geometry budgets, fallback disclosure, shared identity-cache limits and resource disposal contracts.
- Production build and lint pass. Full test count and publication version are recorded in `PROJECT_STATE.md` after release.
- This environment did not provide the managed browser/WebGL inspection surface. No real-render/WebGL visual-acceptance claim is made; owner PC inspection remains the final visual QA item.
