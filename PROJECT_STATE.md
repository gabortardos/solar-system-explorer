# Solar System Explorer — Current Project State

Last verified: 2026-09-10 UTC

Stable working product version: V1.1

Previous published application checkpoint: `5bc749b` (public Site version 5, mobile HUD).

Current development state: Step 8 AUTHORITATIVE ASTRONOMICAL DATA implemented and published; dataset `2026.09.10-1`. The earlier visual, scale and mobile passes remain intact.

Production: `https://solar-system-explorer-gabor.gabortardos.chatgpt.site`

## Role of this document

This is the fast handoff for **what exists now**. Read it first, then use the specialized documents for detail:

- [MASTER_SPEC.md](MASTER_SPEC.md): destination and requirements.
- [ARCHITECTURE.md](ARCHITECTURE.md): technical operation.
- [DESIGN_UX.md](DESIGN_UX.md): visual and interaction language.
- [ASTRONOMY_DATA.md](ASTRONOMY_DATA.md): scientific/data rules.
- [ROADMAP.md](ROADMAP.md): milestone order.
- [DECISIONS.md](DECISIONS.md): decisions and rationale.
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md): bugs and technical debt.

The repository and deployed application are the source of truth. Do not rebuild from a starter or replace working architecture because a new Work chat begins.

## Current state

V1.1 is a public, playable prototype covering the Sun, Moon, and eight planets. It opens near Earth and supports the core loop: select a world, travel or fly, inspect it, compare distances, and ask the offline astronomy guide. The current public release includes VISUAL PASS #1, the two-scale architecture, the compact mobile HUD and the Step 8 local astronomy layer.

Latest source verification (2026-09-10):

- Public Site version 6 deployed successfully on 2026-09-10 from application commit `46a2202d072826a3ff8b541c2741f3b09f858d19`. Public link access is preserved. The current commit may add continuity-only release notes after that application revision.
- Production build, lint and all 23 tests passed, including six new catalogue/source/missing-value/model tests and all existing astronomy/scale/UI regressions.
- No render/navigation/scale policy changes were made. Existing desktop and 390 × 844 compatibility-mode visual/gameplay QA belongs to the previous published milestone, not this data pass.
- Standalone TypeScript check reports existing flight-nullability and Worker ambient-type errors outside the new data modules (KI-021).
- Full WebGL and physical-device mobile QA remain open.

## Working features

- Ten selectable worlds: Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune.
- Starts focused near Earth.
- Assisted curved travel with progress, braking/cancellation, arrival focus, and visited-state updates.
- Desktop free flight: W/S, A/D, Q/E, arrows, Shift boost, Space/Escape brake.
- Mouse orbit/approach and touch drag/pinch. On mobile, flight controls are revealed only when requested.
- Search dialog, destination strip, system view, focus target, labels, and fullscreen.
- Details sheet with physical facts, atmosphere, curated fact, source links, and modeled distance comparison.
- Exploration Scale and Scientific Scale modes; all displayed measurements remain based on the uncompressed astronomy model.
- Optional orbit paths and simulation rates: paused, real time, 1,000×, one day/second.
- Offline curated astronomy guide tied to the selected world.
- Device-local visited-world persistence and reset.
- Reduced-motion setting.
- Canvas 2D compatibility renderer when WebGL is unavailable.

## Architecture summary

- React 19 + TypeScript UI in a Vinext/Next-compatible app structure.
- Vite 8 build and Cloudflare Worker-compatible output.
- Imperative Three.js engine in `app/scene.ts`; React state and panels in `app/page.tsx`.
- Canonical versioned data in `app/data/`; `app/astronomy.ts` is the existing ten-destination compatibility adapter.
- Physical/orbital/calculated/dynamic/editorial modules are separate; visual metadata lives in `app/body-presentation.ts`.
- Central presentation-scale policy in `app/scale.ts` and camera-relative GPU projection in `app/render-space.ts`.
- Curated offline routing in `app/guide.ts`, with authored topic content in `app/data/guide-education.ts`.
- Custom fallback in `app/software-renderer.ts`.
- Progressive mobile HUD state remains in React/CSS; it does not alter the scene-engine API.
- Tailwind CSS 4 and existing Shadcn-derived primitives.
- No active application database, authentication, analytics, paid API, or server-side product API.

## Current data systems

- Planet positions: JPL approximate Keplerian elements for 1800–2050.
- Earth entry: Earth–Moon barycenter approximation used by the JPL element set.
- Moon: sourced J2000 mean ellipse, without precession/perturbations; explicitly illustrative with no validated error bound.
- 32-body local catalogue: Sun, eight planets, 21 selected moons, Ceres and Pluto. JPL/NASA/IAU numerical provenance, units, reference locations, uncertainty and explicit missing reasons.
- Additional 22 bodies are data-only: no scene travel/assets yet. Ceres/Pluto positional elements are not imported; other moons lack validated propagation/frame transforms. Unsupported positions return unavailable.
- Existing descriptions are legacy-curated; new-body descriptions are not imported. Live observation values are explicitly unavailable.
- Physical values in panels/guide derive from canonical records. A details disclosure exposes sources and reliability.
- Distances: center-to-center calculations from uncompressed model coordinates.
- Scientific Scale: linear 100 visual units/AU center positions; body sizes remain visibly enlarged.
- Exploration Scale: continuous radial compression with parent-local satellite placement.
- Guide: deterministic local topic matching, not an LLM.
- Progress: browser `localStorage` key `solar-explorer-progress-v1`.

## Current visual systems

- Textured sphere bodies with mobile geometry reduction.
- Physically based non-solar materials, a warm point light at the Sun, restrained ambient fill, soft WebGL shadows, and ACES Filmic tone mapping.
- Earth cloud layer, night-lights map gated to the unlit hemisphere, and a day-weighted atmospheric limb shader.
- Saturn ring mesh with alpha texture, improved material response, body-aware arrival distance, and WebGL shadow participation.
- Layered Sun treatment: self-lit textured surface plus a restrained additive corona without global bloom.
- Deterministic decorative star field with subtle brightness and temperature variation.
- Optional 256-segment planetary orbit lines with quiet default styling and selected-orbit emphasis.
- Axial tilts for selected bodies and time-driven surface rotation.
- DOM world labels projected from 3D positions.
- Canvas fallback approximating the same visual language with a graded space background, improved terminators/night lights, smoother rings, restrained glows, material-aware orbit opacity, and corrected overview framing.
- Assisted travel and system overview use quintic easing with a subtle temporary field-of-view expansion; reduced motion remains instant.
- Mobile presentation defaults to a slim header, icon-only view tools, and a compact destination dock. One bottom sheet groups deeper actions and scale selection; flight controls and the full HUD can be shown/hidden independently.

## Current navigation and flight

- `OrbitControls` handles mouse/touch orbit, zoom, damping, and pan.
- Assisted travel uses a quadratic Bézier-like curve and quintic easing.
- Travel duration is based on visual scene span and clamped to approximately 2.6–6.5 seconds.
- Manual translation speed scales with target size and camera-to-target distance.
- Manual inputs are immediate/binary; smooth acceleration, inertia, and configurable sensitivity are not implemented.
- Camera collision protection keeps it outside enlarged visible body spheres.
- Focused-body following compensates for orbital movement after arrival.

## Deployment, repositories, and external services

- Stable production source: the ChatGPT Sites source repository identified by `.openai/hosting.json`.
- Persistent external mirror: private GitHub repository `gabortardos/solar-system-explorer`.
- Hosting: ChatGPT Sites with Cloudflare Worker runtime.
- Site status: active, public version 6; contains visual, scale, mobile HUD and Step 8 data passes.
- Access at last inspection: public link access.
- `.openai/hosting.json` preserves the existing project identity; `d1` and `r2` are `null`.
- GitHub CI validates pushes/PRs but does not deploy.
- Repository separation remains explicit: the Site source repository is the production source. The private GitHub repository is a continuity/document mirror unless a future owner-approved consolidation is performed; its application code must not overwrite production casually.
- Runtime makes no external astronomy, AI, analytics, or authentication request.
- Static sources/assets: NASA/JPL references and Solar System Scope/INOVE textures.

## Known limitations

- Full WebGL—including logarithmic depth, custom atmosphere shaders, and camera-relative rendering—and physical-device mobile QA remain incomplete. Phone-sized responsive rendering has been verified in the supervised compatibility renderer.
- At least one production chunk exceeds 500 kB after minification.
- WebGL shadow cost has not been profiled on physical low/mid-range devices.
- Saturn ring/planet shadows are enabled in WebGL but the Canvas renderer uses a visual approximation rather than physical shadow projection.
- Labels lack overlap/occlusion management.
- Search covers only the ten current bodies.
- Guide supports curated topics rather than open-ended AI conversation.
- Date selection, reverse time, accurate lunar ephemerides, terrain/landing, spacecraft physics, sound, and catalogue streaming are absent.

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for tracked status and fixes.

## Current milestone and unfinished work

**Step 8 — AUTHORITATIVE ASTRONOMICAL DATA is implemented and published.** Local numerical architecture and source/missing-value handling are complete; expanded world rendering and high-accuracy ephemerides are not claimed. Prior visual, scale and mobile passes remain published.

The next planned engineering milestone is **V1.2 — Flight and navigation quality**. Smooth non-gamer flight, broader navigation regression coverage, WebGL/physical-device mobile QA, and measured bundle optimization remain unfinished.

## Next recommended task

Begin V1.2 with navigation regression coverage and smoother non-gamer flight. Resolve KI-021 during tooling/navigation work; complete WebGL/mobile validation before expanded worlds. Do not start the next milestone without the owner’s direction.
