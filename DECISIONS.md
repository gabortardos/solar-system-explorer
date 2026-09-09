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

- **Decision:** Exploration and scientific-distance modes both enlarge bodies.
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

