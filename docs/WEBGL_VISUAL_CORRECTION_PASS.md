# Targeted WebGL visual correction pass — 2026-10-01

Status: implementation and release checks complete for production Site version 41. Owner PC/WebGL reinspection of the deployed correction remains the final visual-acceptance item. Step 20 has not started.

## Reproduced evidence and root cause

Owner screenshots from the real WebGL path showed hard, irregular latitude boundaries on Ariel, Miranda and Oberon, a detached-cap appearance on Pluto and Charon, and a broad false dark band on Triton. The same Voyager coverage pipeline put Umbriel and Titania at immediate regression risk. Saturn, Mars, Io, Deimos, Mimas, Neptune and Titan screenshots did not establish a new renderer defect and were left unchanged.

The sphere meshes, shared LOD transitions and texture cache were operating correctly. The defects came from asset preparation: edge-connected black/no-data pixels and JPEG ringing received too narrow a feather, so live lighting made the mission footprint look like separate geometry. Triton's NASA visualization map also retained broad baked mosaic illumination that compounded the live material lighting.

## Correction

- The five partial Uranian maps plus Pluto and Charon now detect only polar-edge-connected no-data pixels, discard ringing, and suppress measured detail into a broad neutral latitude transition.
- Neutral unknown regions receive low-amplitude deterministic material grain only. It contains no copied, mirrored or generated crater/ridge geography and is explicitly presentation rather than observation.
- Triton's broad row-wise baked illumination is normalized and its featureless northern source area is faded into a neutral tone; local measured texture remains.
- Both existing 256px base and 1024px identity tiers were regenerated. `coverageTreatment` identifiers and new hashes are stored in `IDENTITY_TEXTURE_MANIFEST.json`.
- No runtime code, geometry, slot count, threshold, cache, atmosphere, shadow or Step 19 asset changed.

## Verification

- Corrected maps and lit spherical projections were inspected against the supplied failure views.
- Focused tests validate both treatment tiers, provenance hashes, transfer budget and shared-cache lifetime behavior.
- Production build, lint and all 114 tests pass; the full release record is in `PROJECT_STATE.md`.
- This Work environment cannot provide real WebGL inspection. The owner PC should recheck Ariel/Miranda/Oberon, Pluto/Charon and Triton at close view; Umbriel/Titania are immediate shared-pipeline regressions. Until then, do not claim post-fix WebGL visual acceptance.
