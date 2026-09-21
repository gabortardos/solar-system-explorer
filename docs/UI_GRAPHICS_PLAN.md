# UI/graphics review — 2026-09-15

## Checkpoint A — implemented

Verification: 61 tests/build/lint pass after fixing the stale Step 16 `setAnswer`/`setGuideSource` effect found during browser startup. Desktop compatibility preview inspected at 1363×936: startup, layout, hide/restore, guide answer/Back to space, search typing/Close, overview paths and timelapse/date/changed Earth position. Full WebGL, phone and short-height visual matrices remain open.

- Explicit 1 day/second and 30 days/second timelapse rates alongside existing rates. Same canonical clock and date limits; not independent planet speeds. Fast satellites may alias at high rates, disclosed in UI. Prefer 1 day/second for Moon and 30 days/second for planet overviews. Outer planets still need patience to show a full orbit. At 1000×, a real minute is only 16h40m of model time.
- Higher contrast orbit paths in both renderers, preserving stronger focused-orbit emphasis. Canvas baseline stroke increased from 0.65 to 1 pixel; focused lines 1.5 pixels. WebGL native lines remain implementation-width-limited; emphasis uses contrast.
- Desktop left rail spacing, short-height behavior, full-scene hide/restore button, opaque label backplates without underline, muted input focus-within indicator and sticky Back to space exit.
- The guide's scrolling close control is a likely contributor to the reported exit difficulty, not a reproduced root cause. Added explicit sticky escape route; full browser reproduction remains required.
- Moon/Io/Titan/Triton parent-relative motion regression. Existing model already advances these satellites; focused camera compensation can hide apparent movement. Use parent focus to watch satellites, not Moon-following view. Other systems remain culled when irrelevant by design.

## Step 17 correction — implemented

The owner review exposed four presentation regressions. Canvas Saturn now raises sphere raster detail only for a large close-up and slightly lifts its compatibility-only night-side floor. The time-rate picker is a stable native selector, including the two lower timelapse entries. The permanent small-body legend is replaced by a labelled info disclosure beside Small-body regions; the same representative-marker and exaggeration warning remains available on click/tap. Static desktop spacecraft status and control hints are removed, while mobile flight mode retains its contextual status. The brand reads `STEP 17`. Production build, lint and 62 tests pass; physical-device and full-WebGL visual checks remain part of V1.2 QA.

## September 2026 mobile input maintenance correction — implemented

Owner iPhone evidence showed the mobile catalogue search retaining a vertical-centering transform after safe-area placement, leaving it clipped and unusable above the keyboard. The dialog is now top-anchored, constrained to a keyboard-safe internal result viewport, and remains horizontally centered. The guide's question field and the catalogue search input use 16px mobile text, preventing iOS Safari's automatic page zoom that could place the sheet exit out of reach. Production build, lint and 63 tests pass. Full physical-device confirmation remains part of V1.2 QA.

## Checkpoint B — next, not implemented here

Target-locked assisted travel: first establish destination visibility when offscreen, optionally pull back to a fitted overview, smoothly orient while holding the target on screen, then approach with body/ring-aware clearance. Preserve cancellation, reduced motion and moving-target following. Test Sun, Earth/Moon, Saturn, distant worlds and minor markers at both scales, desktop/mobile, and both renderers. Avoid force-locking free-flight cameras. Add sampled screen-space trajectory tests before publication.

Repeat visual QA for desktop normal/short/wide layouts, both scale modes, hide/restore, input keyboard focus, nested search and guide exit. Source/logic tests alone do not close this work. No claim that all browser issues are fully resolved.

## Population markers versus objects

Step 15 dots are deliberately noninteractive statistical regions, never fake named asteroids. Step 14 provides 19 real sample objects through Search → Explore asteroids, comets and distant objects, with information/show/travel. Improve this entry's discoverability later; expanding the real dataset is separate from making anonymous region points clickable. Not every catalogue object is a rendered destination and no full small-body orbital-path overlay exists yet.

## Proposal only — Milky Way perspective (requires agreement)

Stage 1: optional sourced educational panel/illustration locating the Solar System within a schematic Milky Way, explicitly not a detailed galaxy simulation. Stage 2: transition between system and schematic galaxy perspective with separate scales, no false precise star placements. Stage 3: only if wanted, a bounded sourced nearby-star sample. Do not build until the owner agrees on Stage 1 appearance and information. Exact galactic distances/geometry require source review at implementation time.

## Proposal only — deeper exploration (requires agreement)

Stage 1: reviewed higher-resolution global maps for selected bodies with demand-loaded texture levels and attribution. Stage 2: terrain tiles for a small approved Earth/Moon/Mars area where licensed elevation/imagery exists. Stage 3: surface navigation with separate collision/camera models and offline/network failure states. Google Earth-like global detail is a substantial geospatial streaming product, not a texture switch. Check imagery licensing, permitted rendering/caching, credentials and bandwidth cost before picking a service. Many asteroids have no complete imagery/shape coverage: show explicit unknowns or sourced shape models, never invent photoreal survey detail. No external service or paid streaming activated.
