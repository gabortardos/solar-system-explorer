# Solar System Explorer — Astronomy and Data

## Scope

This records the current scientific model, its limitations, and the intended data-growth path. Update it whenever object schemas, sources, coordinate logic, scale transformations, or scientific assumptions change.

## Current object catalogue

| Category | Objects |
| --- | --- |
| Star | Sun |
| Terrestrial planets | Mercury, Venus, Earth, Mars |
| Moon | Earth's Moon |
| Gas giants | Jupiter, Saturn |
| Ice giants | Uranus, Neptune |

No dwarf planets, additional moons, asteroids, comets, spacecraft, belts, or Lagrange points are active yet.

## Current body schema

`Body` in `app/astronomy.ts` contains:

| Field | Current meaning |
| --- | --- |
| `id` | Stable lowercase application identifier. |
| `name` | Display name. |
| `kind` | Display classification. |
| `radius` | Mean/reference radius in km. |
| `gravity` | Surface/reference-level gravity in m/s². |
| `day` | Sidereal rotation in hours; negative means retrograde. |
| `year` | Orbital period in Earth years; Moon uses days/365.25. |
| `au` | Reference orbital distance/semimajor-axis value. |
| `color` | Fallback/display color. |
| `texture` | Texture filename key. |
| `description` | Curated short description. |
| `fact` | Curated notable fact. |
| `atmosphere` | Curated atmosphere statement. |
| `source` | Per-body NASA Science URL. |
| `elements` | Optional base orbital elements and rates per Julian century. |

The current schema mixes scientific data, display metadata, and editorial content. Keep it stable for V1.2; separate these concerns before large-catalogue expansion.

## Sources currently used

- JPL approximate positions: `https://ssd.jpl.nasa.gov/planets/approx_pos.html`
- JPL planetary physical parameters: `https://ssd.jpl.nasa.gov/planets/phys_par.html`
- NASA Science Solar System/per-body pages: `https://science.nasa.gov/solar-system/`
- Surface textures: Solar System Scope/INOVE, based on NASA imagery, CC BY 4.0: `https://www.solarsystemscope.com/textures/`

The application ships numerical data and orbital elements in source. It does not fetch these services at runtime.

## Orbital data and calculations

### Planet model

- Epoch: J2000 (`2000-01-01 12:00 UTC`).
- Validity target: JPL approximate elements for 1800–2050.
- Elements: semimajor axis, eccentricity, inclination, mean longitude, longitude of perihelion, longitude of ascending node, plus rates per Julian century.
- Kepler's equation is solved with 12 Newton iterations.
- Orbital-plane coordinates are rotated into the application's Cartesian frame.
- UTC approximates dynamical time.
- The Earth element set represents the Earth–Moon barycenter rather than a precise geocentric Earth ephemeris.

### Moon model

- Circular distance: 384,400 km.
- Sidereal period: 27.3217 days.
- Inclination: 5.145°.
- Phase/orientation: arbitrary/simplified.
- This is not a current lunar ephemeris.

### Time limits

The scene initializes from current time, supports forward rates, and clamps at the end of 2049. It has no arbitrary date entry or reverse time.

## Coordinate system

`position()` returns `[x, y, z]` in AU for the Sun/planets and a derived heliocentric-like Moon position. The orbital transformation is mapped directly into Three.js coordinates.

The project does not currently declare compliance with ICRF/J2000 visualization axes, equatorial axes, ecliptic-north labeling, or a navigation-grade frame. Treat orientation as the implementation's approximate ecliptic-style scene frame unless formally verified later.

## Physical distance logic

`distance(a, b, time)` calculates both model positions, finds Euclidean center-to-center separation in AU, and multiplies by `149,597,870.7 km/AU`. The UI may express the result as AU and light-minutes using `299,792.458 km/s`.

These are straight-line separations at the displayed date, not surface distances, spacecraft routes, transfer-orbit distances, or travel times.

## Visualization scale and compression

Scientific values and scene positions are intentionally separate.

### Scientific-distance view

- Model position vector × 100 visual units.
- Relative center distances are preserved.
- Body radii remain enlarged; body groups use 5% of exploration display size.
- This is not a literal scale model of both distance and diameter.

### Exploration view

- Direction from the Sun is preserved.
- Radius is compressed to `24 + 38 × log(1 + distanceAU)`.
- The Moon is placed 5 visual units from Earth along its model-relative direction.
- Body radii use a separate square-root enlargement rule with a minimum; the Sun uses a fixed visual radius.

Never calculate displayed scientific distance from either scene representation.

## Physical data currently displayed

- Mean radius/diameter, gravity, rotation, and orbital period.
- Modeled distance from Sun.
- Pairwise modeled distance, AU, and light-minutes.
- Curated atmosphere, description, fact, temperature, water, companions, missions, and habitability.

Values are compiled from the cited source family; per-field provenance/version metadata is not implemented.

## Scientific approximations and visual-only systems

- Assisted travel is a camera curve, not celestial mechanics.
- Collision avoidance uses enlarged visual spheres.
- Stars are decorative, not a catalogue.
- Surface rotation and axial tilts are simplified.
- Atmospheres, clouds, lighting, rings, shadows, and eclipses are illustrative.
- Texture colors may be enhanced and maps may contain reconstructed areas.
- No terrain, atmospheric entry, landing, n-body gravity, perturbations, or spacecraft navigation exists.

## Scientific integrity rules

- Distinguish curated/real data, calculated model data, simulation approximation, and visual compression.
- Label estimated, disputed, unknown, simplified, or model-dependent information.
- Do not fabricate missing fields.
- Prefer primary/authoritative sources.
- Do not present the application as research/navigation software.
- A future LLM must not silently invent facts and should expose sources.

## Future data integration plan

1. **Strengthen current catalogue:** field-level provenance/units; separate physical, orbital, editorial, and rendering data; schema validation/versioning; parent relationships.
2. **High-value expansion:** Pluto/Charon, Ceres, Galilean moons, Titan, Enceladus, and appropriate position models/aliases/panels.
3. **Scalable catalogues:** authoritative ingestion/cache pipelines; load by region, size/importance, zoom, proximity, search, and performance.
4. **Higher-fidelity time:** evaluate JPL Horizons or equivalent behind a server/cache boundary; selectable dates, appropriate time standards, and spacecraft trajectories.

External integrations must be costed, cached, rate-limited, and server-side where credentials or provider limits apply.

