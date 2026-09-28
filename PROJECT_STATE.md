# Solar System Explorer — Current Project State

Last verified: 2026-09-27 UTC

Stable product version: V1.1. Production URL: `https://solar-system-explorer-gabor.gabortardos.chatgpt.site`.

This is the fast handoff for **what exists now**. The repository and deployed application are the source of truth. Read the specialized documents for product direction, architecture, UX, astronomy, roadmap, decisions and issues. Do not rebuild from a starter or replace working architecture merely because a new Work chat begins.

## Current reality

**Step 19 — Close-approach planet experience is COMPLETE for all eight priority bodies.** Owner acceptance on 2026-09-27 used production Site version 35 on a real mobile WebGL browser and confirmed that the Jupiter-moon black artifacts and Saturn black/pixelated shadow no longer reproduce. Earth, Moon, Titan and LOD transitions were also rechecked. The shared LOD, sourced assets and bounded cache are preserved. Mobile catalogue search is a separate maintenance item, not a Step 19 gate. Do not begin Step 20 in this closeout.

Step 17 — **CONNECT THE LIVE AI** is complete and published. The Astronomy Guide uses server-side `gpt-5.6-luna` with D1-backed rate/budget reservations, strict structured-output validation, request-time context resolution, evidence/citation separation and deterministic Local guide fallback. Its two-class trust policy now allows natural qualitative and common-knowledge explanations while keeping exact measurements, calculated distances and scene state tied to trusted structured evidence. `OPENAI_API_KEY` remains a Sites secret. See `docs/AI_GUIDE.md`.

Step 18 — **AI SOURCE AND FACT CHECKING** is complete and published. Project-structured data remains first, current/mission questions may retrieve one server-selected NASA/ESA/JPL/USGS source after D1 reservation, citation IDs are validated, source conflicts preserve project values, and uncertainty is explicit. Final production acceptance returned a Live AI answer for the current Mars-mission question with an actually retrieved NASA source and no fabricated citation or unsupported precise value. See `docs/AI_GUIDE.md`.

Post-Step-18 Live Guide maintenance provides public visitors 10 requests per minute and 50 per rolling 24 hours. A compact D1-backed counter shows the real rolling allowance, refreshes after server requests and gives clear server-derived reset timing when a viewer limit is reached. Preset buttons explicitly use the free deterministic Local guide and do not call OpenAI, reserve D1 usage or change the counter; typed questions retain the Live path. The authenticated project owner has a server-verified request-count bypass for development/testing. Owner calls remain fully recorded and cost-reserved; the $2 rolling application cap, $4 lifetime application cap and separate OpenAI $5 hard limit remain active. A compact owner sign-in uses the platform-owned ChatGPT flow; there is no IP whitelist or client-side developer secret. Future accounts, memberships and subscriptions will replace this temporary access model.

The earlier work previously called “Step 18 mobile input correction” is reclassified as the **September 2026 mobile input maintenance correction**. After owner iPhone 16 evidence showed the centered mobile dialog still clipped outside the viewport, the mobile search presentation was replaced with a dedicated fixed, safe-area-aware sheet. Its header, Close control and 16px input remain fixed while results scroll internally within the VisualViewport height above the iOS keyboard. Desktop search and the catalogue provider are unchanged. This is not an official numbered roadmap milestone.

Step 16's request-time context/evidence foundation remains the deterministic fallback beneath the completed Step 17 live connection. Step 15 was published as Site version 15; its source/live mismatch was resolved.

Step 15 — **ASTEROID BELT AND KUIPER BELT VISUALIZATION** adds renderer-only representative regions for the main asteroid belt, the Kuiper Belt and Jupiter's leading/trailing Trojan clouds. Step 14's separate on-demand 19-object JPL minor-body sample remains intact. The bounded active scene still contains 29 destinations; population dots are not catalogue objects, destinations, counts or ephemerides.

Latest verification:

- Production build, lint and all 105 automated tests pass (including LOD/resource and mobile-search viewport checks). Live-guide natural answers, numerical grounding, authoritative retrieval, uncertainty, conflict handling, citation integrity, owner/public quota behavior, server-derived usage/reset state and free local presets are covered.
- Tests cover catalogue integrity, every activated moon's parent-relative source-ellipse bounds, explicit illustrative-quality metadata, scale ordering, distances, clock behavior, rendering contracts, mobile HUD and bounded search.
- Desktop compatibility-renderer QA passed for Io/Jupiter search and focus, moon orbit toggling, Charon's information-only panel and application console errors.
- Step 19: all eight bodies were inspected at far/medium/close range in compatibility rendering. Owner real mobile/WebGL acceptance on production version 35 then confirmed Jupiter and all four Galilean moons during motion, Saturn rings/shadows, Earth, Moon, Titan and LOD transitions; the prior black artifacts no longer reproduce.
- Version 35 contains the shadow-policy and mobile-search maintenance release. Its source is mirrored to GitHub `main` at `c24106d0610ee48d645012d42cb7005a8d7137dc`. The documentation-only closeout follows this recorded owner acceptance.

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
- Live Astronomy Guide using `gpt-5.6-luna`, natural qualitative/general-knowledge prose, selectively displayed project/retrieved evidence and validated citations, plus deterministic Local guide fallback. Exact and scene-dependent values remain application-owned; current facts use bounded official-source retrieval when required. Public limits are 10/minute and 50/rolling-day with a D1-backed usage/reset display; authenticated owner development calls bypass request counts but not cost controls. Preset buttons are intentionally local/free, while typed questions use Live AI.
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
- D1 is used only for atomic Live Guide quota/budget accounting. Bounded server-side reads from allowlisted official science pages support current guide questions. Platform-provided ChatGPT identity is used only to recognize the configured owner for development access; there is no app-owned authentication stack or analytics.

## Data and position systems

- Dataset version: `2026.09.14-1`; 32 local catalogue records with explicit units, sources, references, uncertainties where available and null/missing reasons.
- Planet positions: JPL approximate Keplerian model for `[1800, 2050)`; Earth is the Earth–Moon barycenter approximation.
- Major-moon positions: JPL J2000 mean ellipses in parent-ecliptic, local-Laplace or parent-equatorial frames. Laplace poles come from JPL; Uranus's equatorial pole comes from the IAU-based NASA/JPL NAIF PCK.
- Moon positions are **illustrative**, not ephemerides: fixed mean ellipses omit apsidal/nodal precession, perturbations, light time and body orientation, and have no validated error bounds.
- Charon's parent-relative elements are stored, but its position is unavailable because Pluto has no imported heliocentric position. No fallback is invented.
- Major-moon education was reviewed against linked NASA Science pages on 2026-09-14. Legacy planet guide/temperature prose remains labelled separately.

## Visual and scale systems

- Shared close-approach LOD for Earth, Moon, Mars, Jupiter, Saturn, Europa, Titan and Enceladus: lazy 512/1024/4096px maps (2048px mobile cap), two desktop or one mobile/compatibility detail bundles, focus priority, fades, abort/disposal and sourced moon imagery. Titan remains opaque haze with no invented surface. Other moons retain lightweight colors.
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

**Current implementation checkpoint:** Step 19 close-approach rendering is complete. Steps 17 and 18 remain complete. **Still open:** V1.2 flight/device QA and separate mobile UI maintenance. Do not start Step 20 in this task.

Next action: retain the completed Step 19 implementation and address later work only under its own approved scope. Step 20 remains out of scope.

## Step 14 data and release notes

- Raw JPL snapshots and provenance: `data-source/minor-bodies/`; offline importer: `scripts/import-minor-bodies.py`; generated HTTP pages: `public/catalogue/v1/`; provider/model: `app/minor-bodies.ts`; compact UI: `app/minor-body-panel.tsx`.
- Includes Vesta, Pallas, Hygiea, Eros, Itokawa, Bennu, Ryugu, Apophis, Didymos, 1950 DA, Halley, Encke, 67P, Hale-Bopp, Eris, Makemake, Haumea, Sedna and Arrokoth.
- Minor-body positions are explicitly illustrative fixed osculating ellipses, with no perturbations/outgassing/light-time correction or validated error bounds. Hyperbolic/missing elements return unavailable. PHA flags are sourced classifications, not impact predictions.
- Desktop compatibility-renderer QA verified catalogue loading, Bennu and Halley search/details/travel, correct minor selection cards and timestamped Nearby Earth. Fixed browser fetch binding and arrival status/card issues found during QA. Full WebGL and physical-device mobile QA remain open. Public Site version 12 deployed successfully on 2026-09-14 from `e71ab9961a12e754e02ca6f201742b6dae623f4f`; public access preserved. Final production build, lint and all 40 tests passed. Earth return/arrival also passed rendered QA.
