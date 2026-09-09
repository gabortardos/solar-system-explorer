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
