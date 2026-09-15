# Solar System Explorer

Solar System Explorer is an interactive browser prototype for exploring the Sun, Moon, and eight planets. It combines a playable 3D scene with assisted travel, manual flight controls, sourced astronomy facts, distance comparisons, and a curated offline guide.

The current stable baseline is **V1.1**. It is publicly available through ChatGPT Sites at [solar-system-explorer-gabor.gabortardos.chatgpt.site](https://solar-system-explorer-gabor.gabortardos.chatgpt.site).

## What works

- Select any of 29 modeled destinations through the scene or bounded search; the ten-item primary strip remains a compact overview.
- Travel with an assisted curved approach, or fly with keyboard, mouse, and touch controls.
- Ease into and out of manual movement and steering; combined axes stay normalized while brake remains immediate.
- Inspect physical facts and compare modeled center-to-center distances.
- Switch between an exploration scale and relatively accurate orbital distances.
- Show orbital paths and labels, pause or accelerate simulation time, and reduce motion.
- Show sparse, explicitly schematic Asteroid Belt, Kuiper Belt and Jupiter Trojan regions; marker size and density are greatly enhanced for visibility.
- Ask a curated astronomy guide common questions without sending data to an external service.
- Save visited-world progress in the current browser on the current device.
- Fall back to a reduced-detail Canvas renderer when WebGL is unavailable.
- Use a compact mobile HUD with one action sheet, optional flight controls, and a distraction-free hide/restore mode.

## Technology

- React 19 and TypeScript
- Vinext and Vite
- Three.js/WebGL, with a Canvas 2D compatibility renderer
- Tailwind CSS and Shadcn-derived interface primitives
- Cloudflare Workers packaging through ChatGPT Sites

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Main interface, interaction state, panels, and local progress persistence |
| `app/scene.ts` | Three.js scene, renderer lifecycle, selection, flight, travel, and camera behavior |
| `app/populations.ts` | Deterministic bounded samples for schematic small-body regions |
| `app/software-renderer.ts` | Reduced-detail Canvas fallback for devices without WebGL |
| `app/astronomy.ts` | Ten-destination adapter over the canonical science layer |
| `app/data/` | Versioned 32-body science catalogue, sources, orbits, positions, dynamic results and educational content |
| `app/body-presentation.ts` | Existing visual metadata, separate from scientific facts |
| `app/guide.ts` | Curated offline astronomy answers and source selection |
| `app/globals.css` | Responsive desktop, touch, and mobile presentation |
| `public/textures/` | Planet, Moon, Sun, cloud, and ring imagery |
| `tests/` | Astronomy invariants and user-interface behavior checks |
| `PROJECT_STATE.md` | Current-state handoff and entry point to permanent project knowledge |
| `MASTER_SPEC.md`, `ROADMAP.md` | Long-term requirements and milestone sequence |
| `ARCHITECTURE.md`, `DESIGN_UX.md`, `ASTRONOMY_DATA.md` | Technical, design, and scientific operating rules |
| `DECISIONS.md`, `KNOWN_ISSUES.md` | Decision rationale and tracked limitations/technical debt |
| `.openai/hosting.json` | Identity and resource bindings for the existing Sites deployment |

For more detail, see [Architecture](ARCHITECTURE.md) and [Deployment](docs/DEPLOYMENT.md).

## Permanent project knowledge

Future development sessions should begin with [PROJECT_STATE.md](PROJECT_STATE.md). It links to the master specification, architecture, design/UX rules, astronomy/data model, roadmap, decisions, and known-issues register. These files are the durable project handoff and should be updated with meaningful changes.

## Local development

Prerequisite: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Useful checks:

```bash
npm test
npm run lint
```

`npm test` performs a production build before running the automated test suite.

## Scientific scope

Planet positions use JPL approximate Keplerian elements for 1800–2050, evaluated at the displayed UTC time. Twenty major moons use sourced J2000 mean ellipses transformed from their published parent reference planes; these are illustrative models with no validated positional error bounds, not current ephemerides. The local catalogue includes 32 bodies and 29 scene destinations; Ceres, Pluto and Charon remain information-only. Physical distances are calculated from model coordinates before visual compression.

Body sizes, assisted-travel paths, surface rotations, atmospheres, lighting, and stars are illustrative. The application is an educational experience, not a spacecraft-navigation or research tool. Full assumptions and boundaries are documented in [Architecture](ARCHITECTURE.md) and [Astronomy and Data](ASTRONOMY_DATA.md).

## Data, privacy, and secrets

The prototype has no account system, analytics, paid API, or third-party runtime data request. Exploration progress is stored only in browser `localStorage` under `solar-explorer-progress-v1`.

No secret is required to run the application. Environment files, private keys, build output, and local tooling state are ignored by Git. If a future service needs credentials, keep them in the hosting provider's encrypted environment settings and never in browser code, commits, issues, or documentation.

## Sources and assets

- [JPL approximate positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)
- [JPL satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html) and [mean elements](https://ssd.jpl.nasa.gov/sats/elem/)
- [IAU nominal solar constants](https://iauarchive.eso.org/static/resolutions/IAU2015_English.pdf)
- Individual [NASA Science](https://science.nasa.gov/solar-system/) pages linked from each information panel
- Planetary maps by [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and based on NASA imagery

The texture license does not determine the license for the application source code. No source-code license has been selected yet.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, review, test, and release workflow. Security guidance is in [SECURITY.md](SECURITY.md).

## Asteroids and comets

Open search and choose “Explore asteroids, comets and distant objects” to browse 19 sourced JPL sample objects, search names/aliases, open information, show markers, travel, or find nearby objects around simulated Earth. Pages, cache, nearby candidates and active markers are bounded independently of catalogue size. At most 12 minor markers are retained. Orbits are illustrative two-body calculations, not precision ephemerides or impact predictions.

See `ARCHITECTURE.md` for storage/index growth plans and `ASTRONOMY_DATA.md` for snapshot provenance. Bulk ingestion and million-object end-to-end performance are future work.
