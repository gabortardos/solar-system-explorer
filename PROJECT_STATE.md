# Solar System Explorer — Current Project State

Last verified: 2026-09-09 UTC

Stable working product version: V1.1

Application-code baseline: `acf79e7` on the Site source repository

Documentation baseline entering this checkpoint: `c667ce1` on `main`; the stable checkpoint is the documentation-only commit containing this file.

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

V1.1 is a deployed, playable prototype covering the Sun, Moon, and eight planets. It opens near Earth and supports the core loop: select a world, travel or fly, inspect it, compare distances, and ask the offline astronomy guide.

Checkpoint verification on 2026-09-09:

- The production Site remains active on deployed version 4, sourced from `acf79e7`.
- A clean recovered checkout of the Site source built successfully.
- Lint passed.
- All 8 tests passed.
- No feature source was changed while creating this checkpoint.
- An earlier runnable compatibility-mode inspection exercised system view, world selection, assisted travel to Saturn, arrival, details, and distance comparison.
- Full WebGL visual QA was unavailable in the supervised browser and remains a validation gap.

## Working features

- Ten selectable worlds: Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune.
- Starts focused near Earth.
- Assisted curved travel with progress, braking/cancellation, arrival focus, and visited-state updates.
- Desktop free flight: W/S, A/D, Q/E, arrows, Shift boost, Space/Escape brake.
- Mouse orbit/approach and touch drag/pinch plus on-screen mobile flight controls.
- Search dialog, destination strip, system view, focus target, labels, and fullscreen.
- Details sheet with physical facts, atmosphere, curated fact, source links, and modeled distance comparison.
- Exploration and scientific-distance display modes.
- Optional orbit paths and simulation rates: paused, real time, 1,000×, one day/second.
- Offline curated astronomy guide tied to the selected world.
- Device-local visited-world persistence and reset.
- Reduced-motion setting.
- Canvas 2D compatibility renderer when WebGL is unavailable.

## Architecture summary

- React 19 + TypeScript UI in a Vinext/Next-compatible app structure.
- Vite 8 build and Cloudflare Worker-compatible output.
- Imperative Three.js engine in `app/scene.ts`; React state and panels in `app/page.tsx`.
- Pure astronomical catalogue/calculations in `app/astronomy.ts`.
- Curated offline knowledge routing in `app/guide.ts`.
- Custom fallback in `app/software-renderer.ts`.
- Tailwind CSS 4 and existing Shadcn-derived primitives.
- No active application database, authentication, analytics, paid API, or server-side product API.

## Current data systems

- Planet positions: JPL approximate Keplerian elements for 1800–2050.
- Earth entry: Earth–Moon barycenter approximation used by the JPL element set.
- Moon: simplified circular 384,400 km orbit with fixed inclination and arbitrary phase.
- Physical data and copy: compiled catalogue with NASA/JPL source links.
- Distances: center-to-center calculations from uncompressed model coordinates.
- Guide: deterministic local topic matching, not an LLM.
- Progress: browser `localStorage` key `solar-explorer-progress-v1`.

## Current visual systems

- Textured sphere bodies with mobile geometry reduction.
- Point light at the Sun, low ambient light, and ACES Filmic tone mapping.
- Earth cloud layer and additive atmosphere rim shader.
- Saturn ring mesh with alpha texture.
- Deterministic procedural decorative star field.
- Optional 256-segment planetary orbit lines.
- Axial tilts for selected bodies and time-driven surface rotation.
- DOM world labels projected from 3D positions.
- Canvas fallback approximating spheres, lighting, rings, atmosphere, stars, and orbits.

## Current navigation and flight

- `OrbitControls` handles mouse/touch orbit, zoom, damping, and pan.
- Assisted travel uses a quadratic Bézier-like curve and smoothstep interpolation.
- Travel duration is based on visual scene span and clamped to approximately 2.6–6.5 seconds.
- Manual translation speed scales with target size and camera-to-target distance.
- Manual inputs are immediate/binary; smooth acceleration, inertia, and configurable sensitivity are not implemented.
- Camera collision protection keeps it outside enlarged visible body spheres.
- Focused-body following compensates for orbital movement after arrival.

## Deployment, repositories, and external services

- Stable production source: the ChatGPT Sites source repository identified by `.openai/hosting.json`.
- Persistent external mirror: private GitHub repository `gabortardos/solar-system-explorer`.
- Hosting: ChatGPT Sites with Cloudflare Worker runtime.
- Site status: active; deployed Site version 4, sourced from commit `acf79e7`.
- Access at last inspection: custom/owner-only.
- `.openai/hosting.json` preserves the existing project identity; `d1` and `r2` are `null`.
- GitHub CI validates pushes/PRs but does not deploy.
- Repository divergence is currently explicit: GitHub `main` contains undeployed rendering work (`e8ec19d`) and the permanent-document commit (`16e4d3a`), while production remains on the verified Site-source V1.1 baseline. VISUAL PASS #1 must review and reconcile that work deliberately; do not overwrite either history or assume the GitHub rendering work is approved production state.
- Runtime makes no external astronomy, AI, analytics, or authentication request.
- Static sources/assets: NASA/JPL references and Solar System Scope/INOVE textures.

## Known limitations

- Canvas compatibility overview framing behaved inconsistently during supervised inspection.
- Full WebGL and physical-device mobile QA remain incomplete.
- At least one production chunk exceeds 500 kB after minification.
- Earth night-map asset is present but unused.
- Sun corona/glow, material response, ring shadows, orbit styling, and cinematic camera choreography are basic.
- Labels lack overlap/occlusion management.
- Search covers only the ten current bodies.
- Guide supports curated topics rather than open-ended AI conversation.
- Date selection, reverse time, accurate lunar ephemerides, terrain/landing, spacecraft physics, sound, and catalogue streaming are absent.

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for tracked status and fixes.

## Current milestone and unfinished work

V1.1 is complete as the stable baseline. The next development milestone is **VISUAL PASS #1**. Implementation has not begun on the stable Site-source checkpoint.

VISUAL PASS #1 covers lighting, Sun appearance, star field, planet materials, Earth atmosphere and night side, Saturn rings, orbit lines, shadows, and camera transitions. It must preserve the current architecture, scientific calculations, flight behavior, fallback renderer, and restrained visual language.

Before implementing it, inspect the undeployed GitHub rendering work in `e8ec19d` as a work-in-progress. Reuse only changes that pass source review, build/tests, WebGL and Canvas inspection, and product-owner feedback.

Smooth non-gamer flight, broader navigation regression coverage, mobile/device QA, and measured bundle optimization remain unfinished work after or alongside the visual milestone, as ROADMAP.md specifies.

## Next recommended task

Begin **VISUAL PASS #1** from this stable checkpoint. First compare the production Site-source renderer with the undeployed GitHub rendering work, then plan and implement a controlled visual pass. Preserve `app/astronomy.ts` as the source for scientific positions/distances and do not deploy until the product owner approves the completed milestone.
