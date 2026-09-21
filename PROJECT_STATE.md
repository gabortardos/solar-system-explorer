# Solar System Explorer — Current Project State

Last verified: 2026-09-21 UTC

Stable product version: V1.1. Production URL: `https://solar-system-explorer-gabor.gabortardos.chatgpt.site`.

This is the fast handoff for **what exists now**. The repository and deployed application are the source of truth. Read the specialized documents for product direction, architecture, UX, astronomy, roadmap, decisions and issues. Do not rebuild from a starter or replace working architecture merely because a new Work chat begins.

## Current reality

Step 17 — **CONNECT THE LIVE AI** is complete and published. The Astronomy Guide uses server-side `gpt-5.6-luna` with D1-backed rate/budget reservations, strict structured-output validation, request-time context resolution, evidence/citation separation and deterministic Local guide fallback. Its two-class trust policy now allows natural qualitative and common-knowledge explanations while keeping exact measurements, calculated distances and scene state tied to trusted structured evidence. `OPENAI_API_KEY` remains a Sites secret. See `docs/AI_GUIDE.md`.

Step 18 — **AI SOURCE AND FACT CHECKING** is complete and published. Project-structured data remains first, current/mission questions may retrieve one server-selected NASA/ESA/JPL/USGS source after D1 reservation, citation IDs are validated, source conflicts preserve project values, and uncertainty is explicit. Final production acceptance returned a Live AI answer for the current Mars-mission question with an actually retrieved NASA source and no fabricated citation or unsupported precise value. See `docs/AI_GUIDE.md`.

The earlier work previously called “Step 18 mobile input correction” is reclassified as the **September 2026 mobile input maintenance correction**. Its behavior remains complete: mobile search is keyboard-safe and text inputs prevent iOS auto-zoom. It is not an official numbered roadmap milestone.

Step 16's request-time context/evidence foundation remains the deterministic fallback beneath the completed Step 17 live connection. Step 15 was published as Site version 15; its source/live mismatch was resolved.

Step 15 — **ASTEROID BELT AND KUIPER BELT VISUALIZATION** adds renderer-only representative regions for the main asteroid belt, the Kuiper Belt and Jupiter's leading/trailing Trojan clouds. Step 14's separate on-demand 19-object JPL minor-body sample remains intact. The bounded active scene still contains 29 destinations; population dots are not catalogue objects, destinations, counts or ephemerides.

Latest verification:

- Production build, lint and all 86 automated tests pass. Live-guide natural answers, numerical grounding, authoritative retrieval, uncertainty, conflict handling, citation integrity, security and cost contracts are covered; full WebGL and physical-device appearance QA remain open.
- Tests cover catalogue integrity, every activated moon's parent-relative source-ellipse bounds, explicit illustrative-quality metadata, scale ordering, distances, clock behavior, rendering contracts, mobile HUD and bounded search.
- Desktop compatibility-renderer QA passed for Io/Jupiter search and focus, moon orbit toggling, Charon's information-only panel and application console errors.
- Full WebGL and physical-device mobile QA remain open.

## Working features

- Starts focused near Earth; selection, assisted curved travel, brake/cancel, arrival focus and device-local visit progress.
- Desktop free flight with W/S, A/D, Q/E, arrow look, Shift boost and Space/Escape brake; mouse/touch orbit and approach.
- Mobile compact dock, bottom action sheet, optional flight controls and hide/restore HUD.
- Bounded asynchronous search across all 32 records by name, curated alias, type and parent context. Results expose Show, Travel and Information; scene actions are enabled only for the 29 active destinations.
- A ten-item primary destination strip keeps the desktop HUD compact; major moons are reached through search or contextual selection.
- Reusable type-aware information panel with parent, applicable physical/orbital facts, sourced education and provenance. Empty/unknown values are omitted.
- Reusable distance comparison with Earth, Sun, parent, spacecraft or another active destination. Simulated separation and average orbital distance remain distinct.
- Exploration Scale and Scientific Scale; displayed scientific measurements always use uncompressed canonical data.
- Optional planetary and relevant moon-system orbit paths.
- UTC simulation clock with pause, real time, 10×, 100×, 1,000×, 1 day/second and 30 days/second.
- Live Astronomy Guide using `gpt-5.6-luna`, natural qualitative/general-knowledge prose, selectively displayed project/retrieved evidence and validated citations, plus deterministic Local guide fallback. Exact and scene-dependent values remain application-owned; current facts use bounded official-source retrieval when required.
- Canvas compatibility renderer when WebGL is unavailable.
- Optional small-body region layer with four bounded point draws, centralized scale projection, camera-relative precision and an accessible on-demand disclosure beside its view control. A dedicated Small-body regions view frames the Asteroid Belt, Jupiter Trojan regions and Kuiper Belt in either scale.
- V1.2 flight smoothing is now implemented: translation accelerates and decelerates with frame-rate-independent response, combined axes are normalized, arrow-key steering eases in and out, collision correction removes inward drift, and brake/focus/overview transitions clear residual motion.

## Architecture summary

- React 19 + TypeScript UI in a Vinext/Next-compatible structure; Vite 8 builds Cloudflare Worker-compatible output.
- `app/page.tsx` owns UI state; the imperative Three.js engine remains isolated in `app/scene.ts`.
- Canonical versioned science lives in `app/data/`; `app/astronomy.ts` adapts the bounded active scene set without duplicating scientific values.
- Physical, orbital, calculated position, dynamic result and educational layers remain separate.
- `app/scale.ts` owns presentation scale. `app/render-space.ts` performs camera-relative Float64-to-Float32 projection only at render time.
- `app/search.ts`, `app/object-information.tsx` and `app/distance-comparison.tsx` remain reusable provider/presenter boundaries.
- D1 is used only for atomic Live Guide quota/budget accounting. Bounded server-side reads from allowlisted official science pages support current guide questions; there is no product authentication or analytics.

## Data and position systems

- Dataset version: `2026.09.14-1`; 32 local catalogue records with explicit units, sources, references, uncertainties where available and null/missing reasons.
- Planet positions: JPL approximate Keplerian model for `[1800, 2050)`; Earth is the Earth–Moon barycenter approximation.
- Major-moon positions: JPL J2000 mean ellipses in parent-ecliptic, local-Laplace or parent-equatorial frames. Laplace poles come from JPL; Uranus's equatorial pole comes from the IAU-based NASA/JPL NAIF PCK.
- Moon positions are **illustrative**, not ephemerides: fixed mean ellipses omit apsidal/nodal precession, perturbations, light time and body orientation, and have no validated error bounds.
- Charon's parent-relative elements are stored, but its position is unavailable because Pluto has no imported heliocentric position. No fallback is invented.
- Major-moon education was reviewed against linked NASA Science pages on 2026-09-14. Legacy planet guide/temperature prose remains labelled separately.

## Visual and scale systems

- Textured primary bodies; lightweight color materials and lower-segment geometry for newly activated moons, avoiding new texture downloads.
- Warm Sun light, restrained ambient fill, ACES tone mapping, soft WebGL shadows, Earth clouds/night lights/atmosphere, Saturn rings, Sun corona and deterministic decorative stars.
- Scientific Scale is linear at 100 units/AU for centers. Bodies remain enlarged for visibility.
- Exploration Scale compresses heliocentric radius continuously. Moon systems use a centralized monotonic parent-local radial compression preserving phase, direction and orbit ordering.
- Planet paths use camera-relative double-backed line geometry. Moon paths are 96-segment parent-local lines that follow their moving parent.
- Only the focused parent system is shown for moons. This visibility culling applies to WebGL, raycasting, labels, collision checks and the Canvas renderer, keeping the active visual set bounded.

## Navigation and deployment

- `OrbitControls` handles orbit/pan/zoom/damping. Assisted travel uses a quadratic curve with quintic easing and a roughly 2.6–6.5 second visual duration.
- Focus following compensates for orbital movement. Collision protection covers relevant visible bodies.
- Canonical production source is the Sites repository identified by `.openai/hosting.json`; public link access must remain enabled.
- The private GitHub repository is an optional continuity mirror, not the production source. Do not overwrite production from it casually.
- GitHub CI validates pushes/PRs but does not deploy.

## Known limitations

- Moon positions are scientifically meaningful mean-orbit visualizations, not precision ephemerides or eclipse/navigation predictions.
- Ceres, Pluto and Charon are not scene destinations.
- Full WebGL/physical-device performance and appearance remain unverified; a production chunk remains over 500 kB.
- Labels have no overlap/occlusion solver. Manual flight has no acceleration/inertia/sensitivity control.
- Population regions are deterministic statistical samples with simplified radial/inclination envelopes. They intentionally do not reproduce true density, resonant structure, families or precise object positions; WebGL/physical-device visual sparsity still needs QA.
- Primary search covers 32 core records. Its “Explore asteroids, comets and distant objects” entry opens a paged minor-body catalogue with prefix/alias search, collection filters, information, Show, Travel, Nearby Earth and Clear markers. Minor markers are separate from the primary destination/visited system.
- Static catalogue pages hold at most 32 summaries; the provider caches at most 64 responses, evaluates at most 64 nearby candidates, and the scene retains at most 12 requested markers with one selected label. No catalogue-wide render or browser import.
- Large-scale ingestion/object-storage hosting, a fine spatial index and million-record end-to-end benchmarks remain future work; the sample importer is not a bulk-ingestion tool.
- Standalone TypeScript checking still has known Worker ambient-type/flight-narrowing gaps even though the verified production build passes.

## Current milestone and next task

**Current delivered increments:** Step 17 — Live AI connection, and Step 18 — AI source and fact checking. **Still open:** V1.2 flight/device QA. The mobile search/guide input fix is preserved as September 2026 maintenance, not a numbered milestone.

Step 15 is implemented and verified in source. The current unfinished work returns to body-aware assisted-arrival review, full WebGL/physical-device mobile QA (including population sparsity in both scales), and evidence-led bundle/startup and shadow-cost measurement. Do not claim release confidence until those checks are complete.

## Step 14 data and release notes

- Raw JPL snapshots and provenance: `data-source/minor-bodies/`; offline importer: `scripts/import-minor-bodies.py`; generated HTTP pages: `public/catalogue/v1/`; provider/model: `app/minor-bodies.ts`; compact UI: `app/minor-body-panel.tsx`.
- Includes Vesta, Pallas, Hygiea, Eros, Itokawa, Bennu, Ryugu, Apophis, Didymos, 1950 DA, Halley, Encke, 67P, Hale-Bopp, Eris, Makemake, Haumea, Sedna and Arrokoth.
- Minor-body positions are explicitly illustrative fixed osculating ellipses, with no perturbations/outgassing/light-time correction or validated error bounds. Hyperbolic/missing elements return unavailable. PHA flags are sourced classifications, not impact predictions.
- Desktop compatibility-renderer QA verified catalogue loading, Bennu and Halley search/details/travel, correct minor selection cards and timestamped Nearby Earth. Fixed browser fetch binding and arrival status/card issues found during QA. Full WebGL and physical-device mobile QA remain open. Public Site version 12 deployed successfully on 2026-09-14 from `e71ab9961a12e754e02ca6f201742b6dae623f4f`; public access preserved. Final production build, lint and all 40 tests passed. Earth return/arrival also passed rendered QA.
