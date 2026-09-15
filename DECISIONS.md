# Solar System Explorer — Decision Record

Future agents should preserve these decisions unless new evidence or a product decision justifies change.

## D001 — The Solar System is the interface

- **Decision:** Open directly on exploration, not a landing/menu page.
- **Reason:** Curiosity and immersion are the core navigation mechanism.
- **Impact:** HUD/panels remain secondary.
- **Preserve:** Do not insert marketing or mandatory setup before exploration.

## D002 — React UI around an imperative scene engine

- **Decision:** React owns UI state; `app/scene.ts` owns high-frequency rendering/camera state.
- **Reason:** Avoid React work per frame and fit Three.js's model.
- **Impact:** Communication uses callbacks and a small method API.
- **Preserve:** Do not migrate frame state into components without evidence.

## D003 — Rendering-independent science

- **Decision:** Facts, positions, and physical distances stay in `app/astronomy.ts`.
- **Reason:** Scientific values must remain testable and unaffected by compression.
- **Impact:** UI and scene consume the same model.
- **Preserve:** Never calculate scientific distance from scene units.

## D004 — Two scale modes

- **Decision:** Exploration Scale and Scientific Scale both enlarge bodies.
- **Reason:** Literal astronomical scale is unusable; relative distance remains educational.
- **Impact:** Visual geometry is explicitly illustrative.
- **Preserve:** Do not present compressed positions/enlarged radii as physical scale.

## D005 — Local JPL approximate planet model for V1

- **Decision:** Use JPL 1800–2050 approximate elements locally.
- **Reason:** Authoritative, free, deterministic, fast, sufficient for a prototype.
- **Impact:** No runtime ephemeris dependency; accuracy/range limits are documented.
- **Preserve:** Replacements must address offline behavior, accuracy, time standards, rate limits, and cost.

## D006 — Explicitly approximate Moon

- **Decision:** Circular Moon orbit with fixed distance/period/inclination and arbitrary phase.
- **Reason:** Earth–Moon context without a full ephemeris.
- **Impact:** Position/phase is not current-epoch truth.
- **Preserve:** Never imply ephemeris accuracy.

## D007 — Manual and assisted travel coexist

- **Decision:** Free flight provides agency; assisted travel provides accessibility.
- **Reason:** The product must suit explorers and non-gamers.
- **Impact:** Selection and travel are separate; manual input cancels automation.
- **Preserve:** Do not reduce the product to teleportation or expert-only flight.

## D008 — Assisted travel is cinematic, not orbital

- **Decision:** Use a short curved visual path.
- **Reason:** Real travel times prevent casual exploration.
- **Impact:** Physical distance remains separate from travel animation.
- **Preserve:** Do not label it a real trajectory/time.

## D009 — Three.js/WebGL plus Canvas fallback

- **Decision:** Main Three.js renderer with custom Canvas compatibility path.
- **Reason:** WebGL enables quality; fallback preserves core access.
- **Impact:** Both paths require tests; parity is not assumed.
- **Preserve:** Do not remove either without demonstrated cross-device benefit.

## D010 — Selective loading

- **Decision:** Preload Earth/Sun; load other textures and guide/scene code on demand.
- **Reason:** Reduce initial work and bandwidth.
- **Impact:** Future catalogue growth must remain selective.
- **Preserve:** Do not eagerly load all objects/assets.

## D011 — Offline guide before live AI

- **Decision:** V1.1 uses curated, deterministic, selected-world answers.
- **Reason:** Avoid hallucinations, secrets, latency, privacy exposure, and recurring cost.
- **Impact:** Limited but reliable guide, explicitly labeled offline.
- **Preserve:** Live AI requires grounding, citations, server boundary, limits, and owner approval.

## D012 — Device-local progress before accounts

- **Decision:** Use `localStorage` for visited bodies.
- **Reason:** Continuity without auth/database complexity.
- **Impact:** No synchronization/backup.
- **Preserve:** Cloud identity needs privacy, security, and cost decisions.

## D013 — Restrained scientific futurism

- **Decision:** Dark minimal HUD with muted mint/blue accents.
- **Reason:** Space/worlds must dominate; cartoon/neon clutter harms credibility.
- **Impact:** Overlays instead of dashboard pages; restrained glow/glass.
- **Preserve:** Avoid generic SaaS, cheap cyberpunk, and cartoon visuals.

## D014 — Performance before catalogue scale

- **Decision:** Dynamic loading, capped pixel ratio, mobile geometry reduction, and future filtering/LOD.
- **Reason:** Smooth use on modern consumer hardware.
- **Impact:** Visual/catalogue upgrades require measurement.
- **Preserve:** Do not trade interaction quality for simultaneous volume.

## D015 — Deliberate release separation

- **Decision:** GitHub CI validates; Sites deployment is separate.
- **Reason:** Prevent accidental releases and stored deployment credentials.
- **Impact:** repository and live Site may differ.
- **Preserve:** Keep the existing Site identity; never assume merge equals deploy.

## D016 — No secrets or speculative services

- **Decision:** No client secrets or active database/auth/analytics/paid API in V1.1.
- **Reason:** Security, privacy, cost control, and scope.
- **Impact:** Starter scaffolding stays dormant.
- **Preserve:** Never commit credentials or activate services casually.

## D017 — Repository documents are the official continuity system

- **Decision:** `MASTER_SPEC.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DESIGN_UX.md`, `ASTRONOMY_DATA.md`, `ROADMAP.md`, `DECISIONS.md`, and `KNOWN_ISSUES.md` are the official continuity system for future Work chats.
- **Reason:** Project continuity must not depend on one conversation's history or context window.
- **Impact:** A new Work chat reads `PROJECT_STATE.md` first, then the specialized documents relevant to its task, and verifies their claims against the repository and runnable application.
- **Preserve:** Update these documents when milestones, architecture, scientific rules, deployment state, or important decisions change. Do not replace them with chat-only handoffs or allow duplicate copies to drift silently.

## D018 — Layered physical cues instead of global spectacle

- **Decision:** Build the cinematic look from local, explainable layers—physically based planet materials, Sun-centered lighting, day-gated Earth atmosphere/night lights, textured rings, quiet orbits, deterministic stars, and eased camera framing—without global bloom or decorative post-processing.
- **Reason:** Local effects preserve scientific legibility, keep dark hemispheres meaningful, limit performance cost, and translate more honestly to the Canvas compatibility renderer.
- **Impact:** WebGL and Canvas are not pixel-identical, but both preserve the same visual hierarchy and restrained scientific tone.
- **Preserve:** Do not introduce global bloom, lens flares, saturated neon, fake holographic overlays, or effects that erase terminators without explicit product and performance review.

## D019 — A milestone closes with continuity maintenance

- **Decision:** After every substantial roadmap milestone, review what changed, update only the relevant permanent project documents, and create a stable repository checkpoint before starting the next milestone.
- **Reason:** The implemented product, roadmap, and written continuity system must remain synchronized so work can safely move between Work chats.
- **Impact:** A milestone is not considered fully closed until the relevant documentation and checkpoint are current. The closeout report names the changed documents, next milestone, and new-chat readiness.
- **Preserve:** Do not skip milestone maintenance, erase historical decisions, rewrite unaffected documents, or mark an issue resolved without verification.

## D020 — Scientific coordinates, presentation scales, and render coordinates are separate

- **Decision:** Keep scientific/model and navigation positions in double precision; transform them through the centralized `app/scale.ts` policy; subtract the camera origin only for the active render snapshot. Scientific Scale preserves modeled center-distance ratios at 100 units/AU. Exploration Scale applies the documented continuous radial compression. Body display size remains independent and enlarged.
- **Reason:** A single scale policy prevents visual formulas from drifting, while camera-relative GPU coordinates preserve nearby detail during long-distance travel and future large-catalogue use.
- **Impact:** Orbits, routes, satellites, camera clipping, custom lighting shaders, and both renderers follow the same coordinate boundary. Future catalogue growth uses indexed/streamed active sets and instancing or points rather than one mesh/label per stored object.
- **Preserve:** Never calculate scientific values from presentation coordinates, upload huge absolute positions directly as GPU floats, duplicate scale formulas, or interpret the synthetic million-record conversion test as proof that a million detailed meshes can render simultaneously.

## D021 — Mobile HUD uses progressive disclosure

- **Decision:** Phones default to a compact exploration HUD. Deeper actions live in one bottom sheet, touch flight controls are optional, and the full HUD can be hidden/restored.
- **Reason:** The former independent mobile overlays covered the Solar System and competed with the product's primary exploration surface.
- **Impact:** Mobile and desktop share the same React selection/options state and scene-engine API, but CSS and small UI state choose different presentation density. Search replaces the always-visible mobile destination strip; core actions remain one or two taps away.
- **Preserve:** Do not restore permanent stacked mobile cards, a permanent arrow pad, or a large intro over the scene. Do not turn the mobile menu into a new application architecture or alter scientific values/navigation to solve layout concerns.

## D022 — Local authoritative catalogue with explicit provenance (2026-09-10)

- **Decision:** Separate physical, orbital, calculated, dynamic-observation and educational data. Use JPL numerical tables, IAU nominal constants and NASA educational references in a versioned local dataset. Each numerical field preserves units, source location, quality and available uncertainty; missing values remain null with a reason.
- **Reason:** Scientific facts must survive visual scaling, future catalogue growth and AI retrieval without hidden fabricated defaults or runtime API dependence. JPL numerical references take precedence over rounded educational page values (for example, Ceres radius).
- **Impact:** 32 catalogue bodies feed a compatibility adapter for the existing ten scene destinations. Physical values and guide responses now share one numerical source. No paid service, runtime astronomy API or new library was added. Legacy educational prose is retained but labelled separately, not falsely promoted to newly audited reference data.
- **Preserve:** Do not conflate body/system GM, sidereal/solar periods, parent-local/heliocentric coordinates, nominal/measured radii, or missing uncertainty/zero error. Do not replace source values merely because a different source offers more digits. Dataset update dates are not measurement epochs.

## D023 — Missing ephemerides remain unavailable (2026-09-10)

Status: partially superseded by D028 after the satellite reference-plane transforms were implemented and tested. Its prohibition on invented/unvalidated positions remains active.

- **Decision:** Store additional satellite mean elements with their actual parent reference planes; return unavailable for unvalidated propagation and unimported Ceres/Pluto position models. Replace the Moon's arbitrary phase/circle with a sourced fixed mean ellipse while retaining an explicit illustrative quality flag.
- **Reason:** A complete-looking invented orbit is less trustworthy than an honest unavailable result. A mean-element table alone does not establish a precision ephemeris or a correct coordinate transform. JPL's current Table 1 excludes Pluto.
- **Impact:** Current ten-world exploration remains available. Lunar precession/perturbations and Earth–Moon barycenter approximation remain limitations; new bodies are data records, not yet selectable worlds. A calculation's application time range does not certify lunar accuracy over that range.
- **Preserve:** Do not add fake phases, silently extrapolate outside the supported date interval, use GPU/compressed coordinates for measurements, or activate extra scene bodies until their positional model/assets are validated.

## D024 — Monotonic simulation clock, frame-rate-independent motion (2026-09-10)

- **Decision:** Anchor simulated UTC to monotonic browser time and expose only pause, 1×, 10×, 100× and 1,000×. Evaluate active body positions every animation frame, but notify React of the displayed timestamp at 2 Hz.
- **Reason:** Directly accumulating frame deltas drifts through rounding and makes rate changes/tab suspension harder to reason about. Separating frame motion from UI updates keeps movement smooth without causing unnecessary component renders.
- **Impact:** The eight planet positions continuously follow the existing local JPL model. The UI defaults to real time, speed changes are continuous, and the clock stops at the model boundary. No network ephemeris, new dependency, reverse time or date picker was added.
- **Preserve:** Do not add arbitrary rates without product/data-range review, move per-frame time into React, extrapolate beyond `[1800, 2050)`, or imply that faster playback increases scientific accuracy. Large catalogues must update a bounded active set.

## D025 — Type-aware object information is a reusable presentation model (2026-09-13)

- **Decision:** Build the details sheet from a reusable `ObjectInformationModel` that composes canonical quantities with a separate qualitative education layer. Emit only fields that apply and have values; the component accepts star, planet, moon, dwarf-planet, asteroid, comet and spacecraft categories.
- **Reason:** Different object types have different meaningful properties. A small presenter prevents hard-coded planet markup from spreading through the page while keeping scientific storage independent of layout and future catalogue adapters.
- **Impact:** Current worlds receive compact ordered facts and narratives; future asteroids, comets and spacecraft can supply the same model without redesigning the sheet. NASA-reviewed composition/discovery/scientific-importance summaries do not overwrite reference quantities or legacy guide text.
- **Preserve:** Do not render empty placeholders, infer unknown values, move canonical facts back into `page.tsx`, or force every category through a planet-shaped record. Extend the model with optional typed fields and explicit provenance instead.

## D026 — Instantaneous distance, average orbit and spacecraft estimates stay distinct (2026-09-13)

- **Decision:** Calculate body separation only from simultaneous uncompressed model positions. Show semimajor axis as a separately labelled average reference only for direct parent–child pairs. Keep spacecraft-camera conversion behind a read-only scene API: exact in linear Scientific Scale and focused-body-local/estimated in Exploration Scale.
- **Reason:** A current separation, an orbit's semimajor axis and a camera location answer different questions. Exploration compression, enlarged bodies and parent-local satellite placement prevent one globally physical inverse for the visual camera.
- **Impact:** The reusable calculator can compare the selected object with Earth, Sun, parent, spacecraft or another destination while honestly communicating basis, time, units and availability. No external service or invented orbit phase is required.
- **Preserve:** Never calculate body facts from rendered coordinates, silently replace unavailable separation with an average, call the Exploration Scale spacecraft estimate an ephemeris/measurement, or expose mutable Three.js camera state directly to React.

## D027 — Search is bounded, asynchronous, and independent of scene activation (2026-09-13)

- **Decision:** Search through an asynchronous provider that returns compact, capped results. Keep canonical names/curated aliases in identity data, and keep the inspected-object ID separate from the active 3D destination. The current adapter indexes only the 32 local records; future large catalogues require a server-side index with paginated/top-k retrieval and detail-on-demand.
- **Reason:** Exact aliases and context need one deterministic identity source, while hundreds of thousands or millions of records cannot be shipped into browser memory or instantiated in the scene merely to be searchable.
- **Impact:** All 32 records can be found and inspected. D028 later expanded the bounded scene from ten to 29 destinations; Ceres, Pluto and Charon still communicate unavailable Show/travel rather than receiving invented coordinates.
- **Preserve:** Do not bulk-import a future catalogue into the client bundle, make search create scene meshes, conflate information selection with travel selection, invent aliases, or enable Show/travel without validated positions and presentation assets.

## D028 — Major moons use honest mean-orbit models and bounded system rendering (2026-09-14)

- **Decision:** Activate moons only when their parent has a scene position and their JPL mean-element reference plane can be explicitly transformed. Parent-ecliptic, local-Laplace and parent-equatorial frames are handled separately; Uranus's equatorial pole comes from the IAU-based NASA/JPL NAIF PCK. Every moon position remains `illustrative`, not an ephemeris. Exploration Scale applies a centralized monotonic parent-local compression. Only the focused moon system is rendered/raycastable/collidable, using lightweight untextured geometry and local orbit lines.
- **Reason:** This makes the requested moon systems scientifically meaningful without overstating rounded mean elements, preserves small parent-relative offsets at large heliocentric distance, and prevents catalogue growth from turning into permanent mesh/label/render cost.
- **Impact:** Nineteen moons join Earth's Moon as scene destinations. Their direction, phase and orbit order are meaningful; visual spacing is compressed. Charon remains information-only because Pluto lacks a heliocentric model. Search and reusable information/distance systems require no architectural replacement.
- **Preserve:** Do not call these positions precision/current ephemerides, flatten every satellite frame into ecliptic coordinates, infer spin from orbit period, activate a child whose parent position is unavailable, load detailed assets for every catalogue record, or remove focused-system culling without measured performance evidence.

## D029 — Minor catalogue storage is independent of scene activation (2026-09-14)

- **Decision:** Store JPL snapshots locally and serve bounded summary/detail/index pages. Keep the 29 primary destinations separate from up to 12 explicitly requested minor markers. Use conservative radial filtering plus exact model distances and disclose incomplete neighborhoods.
- **Reason:** Catalogue size must not determine browser heap, mesh count or per-frame propagation work. Static sample pages avoid a new paid/runtime astronomy dependency while preserving a replaceable provider boundary.
- **Impact:** Prefix/alias search, collections, nearby Earth, information and marker travel work for 19 real objects. Larger ingestion, object-storage hosting and finer spatial indexes are planned extensions, not claims of measured million-object readiness.
- **Preserve:** Never fetch the entire future catalogue into the browser, treat curated importance as hazard, silently invent missing physics, or call fixed-ellipse propagation an authoritative ephemeris. Maintain page/cache/candidate/render budgets and explicit incompleteness when replacing storage.

## D030 — Manual flight uses bounded response, not spacecraft physics (2026-09-14)

- **Decision:** Keep the existing direct keyboard/touch controls and body/distance-aware speed, but approach target translation and steering rates with frame-rate-independent exponential response. Normalize combined movement axes, retain the 8× boost, and make brake/focus/overview/assisted transitions clear residual motion immediately.
- **Reason:** Non-gamers need calmer starts, stops and turns without losing responsiveness or changing the established navigation model.
- **Impact:** Brief release coasting feels smoother, diagonal input no longer gains unintended speed, and body collision correction removes inward velocity. The implementation remains a camera-navigation aid, not inertia, thrust or orbital physics.
- **Preserve:** Do not let residual manual velocity leak into automated transitions, weaken the immediate brake, make speed frame-rate dependent, or describe the smoothing as physical spacecraft simulation. Tune response only with cross-device evidence.

## D031 — Population regions are schematic renderer layers (2026-09-14)

- **Decision:** Represent the main asteroid belt, main Kuiper Belt and Jupiter L4/L5 Trojan regions with four deterministic, bounded `Points` layers generated in uncompressed AU and individually passed through the central scale transform. Keep a visible disclosure whenever enabled.
- **Reason:** Educational context benefits from visible regions, but a torus, dense haze or pseudo-catalogue would falsely imply solid belts, true density, current positions or complete counts.
- **Impact:** Both renderers show sparse one-pixel samples without expanding search, selection, collision, navigation or canonical data. Marker count, size, distribution and vertical spread are presentation choices.
- **Preserve:** Do not turn region dots into objects, measurements or census data; remove the exaggeration disclosure; derive Trojan geometry from compressed coordinates; add glow/opaque fills; or increase budgets without measured device evidence.
