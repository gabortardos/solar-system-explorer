# Solar System Explorer — Current Project State

Last verified: 2026-09-09 UTC

Stable working product version: V1.1

Application-code baseline entering VISUAL PASS #1: `c17e84a` on the Site source repository

Current development state: VISUAL PASS #1 is complete in source; the stable checkpoint is the commit containing this file.

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

V1.1 is a deployed, playable prototype covering the Sun, Moon, and eight planets. It opens near Earth and supports the core loop: select a world, travel or fly, inspect it, compare distances, and ask the offline astronomy guide. VISUAL PASS #1 is complete in the Site source repository but has not been deployed.

VISUAL PASS #1 verification on 2026-09-09:

- The production Site remains active on deployed version 4, sourced from `acf79e7`.
- The updated Site source built successfully.
- Lint passed.
- All 9 tests passed, including a rendering-treatment contract.
- Rendered desktop compatibility-mode inspection covered Earth, the Sun, Saturn, system overview, assisted transitions, labels, orbit context, loading, and layout overflow.
- Inspection found and corrected cropped overview framing and visibly faceted Saturn rings.
- No console error attributable to the application was present.
- Full WebGL and physical-device mobile visual QA remain validation gaps because the supervised browser used the Canvas compatibility renderer.

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
- Access at last inspection: public link access.
- `.openai/hosting.json` preserves the existing project identity; `d1` and `r2` are `null`.
- GitHub CI validates pushes/PRs but does not deploy.
- Repository divergence remains explicit: the Site source repository contains the verified VISUAL PASS #1 implementation, while GitHub `main` contains the earlier independent rendering experiment (`e8ec19d`) and continuity-document history. GitHub application code is not the production source and must not be merged or overwritten casually.
- Runtime makes no external astronomy, AI, analytics, or authentication request.
- Static sources/assets: NASA/JPL references and Solar System Scope/INOVE textures.

## Known limitations

- Full WebGL and physical-device mobile QA remain incomplete.
- At least one production chunk exceeds 500 kB after minification.
- WebGL shadow cost has not been profiled on physical low/mid-range devices.
- Saturn ring/planet shadows are enabled in WebGL but the Canvas renderer uses a visual approximation rather than physical shadow projection.
- Labels lack overlap/occlusion management.
- Search covers only the ten current bodies.
- Guide supports curated topics rather than open-ended AI conversation.
- Date selection, reverse time, accurate lunar ephemerides, terrain/landing, spacecraft physics, sound, and catalogue streaming are absent.

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for tracked status and fixes.

## Current milestone and unfinished work

**VISUAL PASS #1 is complete in source and awaiting product-owner review.** It improved lighting, Sun appearance, star field, planet materials, Earth atmosphere and night side, Saturn rings, orbit lines, shadows, and camera transitions without changing the astronomy model, React/scene boundary, scale system, navigation model, guide, or persistence.

The next planned engineering milestone is **V1.2 — Flight and navigation quality**. Smooth non-gamer flight, broader navigation regression coverage, WebGL/physical-device mobile QA, and measured bundle optimization remain unfinished.

## Next recommended task

Review VISUAL PASS #1 with the product owner. If approved, publish the checkpoint to the existing public Site. Do not deploy automatically. After approval/deployment, begin V1.2 with navigation regression coverage and smoother non-gamer flight.
