# Solar System Explorer — Astronomy and Data

## Scope

This records the current scientific model, its limitations, and the intended data-growth path. Update it whenever object schemas, sources, coordinate logic, scale transformations, or scientific assumptions change.

## Local catalogue and source snapshot

Dataset `2026.09.10-1`, schema version 1; numerical references retrieved 2026-09-09/10.

| Category | Catalogue records |
| --- | --- |
| Star and planets | Sun; Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune |
| Dwarf planets | Ceres, Pluto |
| Earth / Mars moons | Moon; Phobos, Deimos |
| Jupiter moons | Io, Europa, Ganymede, Callisto |
| Saturn moons | Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus |
| Uranus moons | Miranda, Ariel, Umbriel, Titania, Oberon |
| Neptune / Pluto moons | Triton; Charon |

**32 catalogue records, ten rendered/selectable destinations.** New records do not create meshes, labels or travel destinations. “Major moons” is this explicit initial scope, not a claim to catalogue every large satellite. Educational copy for newly catalogued bodies is not yet imported (`education: null`).

## Scientific data boundaries

| Module | Responsibility |
| --- | --- |
| `app/data/schema.ts` | Quantity values/units, source IDs, reference location, quality, uncertainty and missing reason |
| `sources.ts` | Source registry, snapshot version and physical/unit constants |
| `physical.ts` | Reference radii, masses or GM, gravity, signed rotation periods |
| `planet-elements.ts`, `orbits.ts` | Orbital elements/rates, parent, epoch, reference plane and period |
| `catalog.ts` | Identity, categories, indexed lookup and snapshot validation |
| `positions.ts` | Time-dependent, double-precision geometric positions and model quality |
| `dynamic.ts` | Timestamped modeled distances/light times; explicit absence of live observations |
| `education.ts`, `guide-education.ts` | Retained educational summaries, explicitly marked legacy-curated |
| `app/body-presentation.ts` | Existing ten-body colors, textures and display classifications |
| `app/astronomy.ts` | Compatibility adapter for current UI/scene; no independent scientific literals |

`Quantity.value` is a number or `null`. Missing values carry `missingReason`; they never become zero. `uncertainty: null` means no numerical uncertainty supplied/propagated, not exactness. `quality` distinguishes reference, nominal, approximate and derived quantities. Units are explicit (`km`, `kg`, `km3/s2`, `m/s2`, `h`, `d`, `au`, `deg`, `1`). Negative rotation means retrograde. The Sun has no heliocentric year (`null`).

An orbit identifies its parent, model, TDB epoch, plane and sourced quantities. Table 1 coefficient rows store `a (au), e, I, L, longitude of perihelion, node (degrees)` and rates per Julian century. Moon elements store argument of periapsis and mean anomaly, which must not be confused with planet longitude fields. Body GM and system GM are different quantities.

## Sources and reliability

| Data type | Preferred authority | Reliability / policy |
| --- | --- | --- |
| Planet/Ceres/Pluto properties | [JPL physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) | Field-level reference letters retained. Different quantities have different historical references. Do not replace values with rounded educational-page numbers. |
| Satellite radius and GM | [JPL satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html) | Quoted uncertainties retained; radii generally IAU WGCCRE 2015 / Archinal 2018; Charon radius Nimmo 2017. GM reference is recorded per moon. |
| Solar radius | [IAU 2015 B3](https://iauarchive.eso.org/static/resolutions/IAU2015_English.pdf) | 695,700 km is a nominal conversion constant, not an exact measured radius. |
| AU, light speed, solar GM | [JPL constants / DE440](https://ssd.jpl.nasa.gov/astro_par.html) | AU and time conversions are definitions. Solar GM is a fitted ephemeris parameter. |
| Planet positions | [JPL approximate elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html) | Eight planets, Table 1, 1800–2050; Earth row is the Earth–Moon barycenter. |
| Satellite elements | [JPL mean elements](https://ssd.jpl.nasa.gov/sats/elem/) | Rounded epoch elements in different parent reference planes. These are not downloadable precision ephemerides. |
| Solar rotation / lunar synchronism | [NASA Sun](https://science.nasa.gov/sun/facts/), [NASA Moon](https://science.nasa.gov/moon/facts/) | Educational approximations. Sun rotates differentially; the Moon's mean synchronous spin is explicitly derived using the stored JPL period. |
| Educational summaries | Per-body NASA Science links | Retained author-written material is marked `legacy-curated`, not newly verified field-level science or a live feed. Full editorial re-review remains outstanding. |

Gravity for planets is the JPL equatorial/reference-level value. Satellite gravity is explicitly computed as `GM / meanRadius² × 1000` in m/s²; it neglects shape and rotation and has no propagated uncertainty. Sun gravity uses DE440 GM and the nominal radius. No guessed mass is inserted when only GM is imported.

All data needed by the app ships locally. No external astronomy API, paid service, keys, background refresh or per-visit usage cost was added. JPL/Horizons is the recommended future ephemeris source; MPC is appropriate for future minor-body catalogue ingestion, not an unnecessary dependency for this small static dataset. ESA remains a useful mission/science reference; it was not needed to duplicate JPL's numerical tables.

## Calculated positions and time

`calculatePosition(id, utcMs)` returns available coordinates with unit, frame, time, model, quality, sources and caveat, or `unavailable` with `value: null` and a reason. Unknown IDs, unsupported models, invalid times and out-of-range dates fail explicitly. The legacy ten-body adapter throws for invalid requests rather than inventing positions.

- Planet model: Table 1, J2000 TDB coefficients; UTC is still substituted for TDB and disclosed. Twelve Newton iterations solve Kepler's equation.
- Public calculation interval: `[1800-01-01, 2050-01-01)`; UI still stops at the end of 2049.
- Returned scientific axes: heliocentric ecliptic/equinox J2000 `[X,Y,Z]` in AU. Scene mapping is explicitly `[X,Z,-Y]`, with no scale change.
- Sun: origin of the chosen heliocentric frame, not a computed barycentric solar trajectory.
- Moon: the old arbitrary phase/circular path was replaced by the sourced J2000 mean ellipse (a=384,400 km, e=0.0554 and published angular elements/P). Its fixed-ellipse propagation omits precession and perturbations and adds the result to the approximate Earth–Moon barycenter. Quality is **illustrative**, with no validated error bound. The application date interval is not a claimed scientific validity interval for this lunar approximation.
- Other moons: orbital parameters are stored, but propagation returns unavailable until parent-equatorial/Laplace-plane transformations and timing are validated. The catalogue preserves the source frame/pole rather than silently treating every orbit as ecliptic.
- Ceres/Pluto: physical properties and reference orbital periods are imported; a positional element set is not yet imported. The current JPL approximate-positions page explicitly excludes Pluto. No remembered or guessed Pluto/Ceres coefficients are used.

`calculateDistance()` uses simultaneous uncompressed model coordinates, converted by the defined AU. Results carry time, sources and approximate/illustrative quality. `dynamicValues()` separates these calculations from `observations`, which is explicitly unavailable. Light time is geometric distance/c, not observed retarded-time astrometry or a spacecraft travel duration.

## Visualization scale and compression

Scientific values and scene positions are intentionally separate.

### Scientific Scale

- Each Cartesian model component × 100 visual units/AU.
- All modeled center-to-center distance ratios are preserved.
- Body radii remain enlarged; body groups use 5% of exploration display size.
- This is not a literal scale model of both distance and diameter.

### Exploration Scale

- Direction from the Sun is preserved.
- Heliocentric radius is compressed to `24 × (1 − exp(−r / 0.05)) + 38 × ln(1 + r)` visual units. This is continuous at zero and monotonic for nonnegative distances.
- Parent and satellite offsets are handled separately; the Moon is placed 5 visual units from Earth along its model-relative direction.
- Body radii use a separate square-root enlargement rule with a minimum; the Sun uses a fixed visual radius.

Never calculate displayed scientific distance from either scene representation.

The mobile bottom-sheet scale selector and desktop settings switch both update the same `SceneOptions.scientific` state. They are alternate controls for the same presentation policy; neither changes catalogue values, modeled positions, or displayed physical measurements.

### Precision and catalogue growth

- Model positions, physical calculations, navigation positions, and future catalogue tiles use IEEE-754 double precision.
- Rendering subtracts the camera origin before writing bounded active geometry to GPU float buffers.
- Orbit/route source vertices remain double precision and are regenerated relative to the current camera for rendering.
- Large catalogues must be spatially indexed and streamed by region, zoom, proximity, and importance. The renderer must not create one textured mesh or DOM label for every stored minor body.
- Nearby satellites use parent-local coordinates so small separations survive when their parent is far from the global origin.
- A finite active render horizon is a visibility/performance rule, not a limit on scientific coordinates or travel.

## Physical data currently displayed

- Mean radius/diameter, gravity, rotation, and orbital period.
- Modeled distance from Sun.
- Pairwise modeled distance, AU, and light-minutes.
- Curated atmosphere, description, fact, temperature, water, companions, missions, and habitability.

The current panels consume canonical numerical records and expose field-level source/reliability details. Legacy educational summaries remain separately labelled; their numerical prose is not a live measurement feed.

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

1. **Validated ephemeris expansion:** acquire reviewed, versioned local JPL Horizons/SPICE snapshots or fitted coefficients for Ceres/Pluto and moons; establish frame/time transformations and error bounds before activating new destinations.
2. **Editorial review:** re-review retained NASA summaries, import descriptions for additional bodies, record dates and source locations, and avoid assertions about current mission status without a dated source.
3. **Selected-world rendering:** add assets, labels, panels and travel only for data-ready bodies; preserve the ten-body renderer until that milestone.
4. **Large catalogues:** an offline/import-time ingestion pipeline with schema/unit/source validation, reviewable diffs, release versions and rollback. Store compact numerical arrays separately from prose; spatially index/stream bounded active tiles. Never eagerly construct one mesh or metadata object per million-body catalogue entry in the scene loop.
5. **Higher-fidelity time:** proper UTC/TT/TDB conversion, validated date ranges and optional cached ephemerides. Browser sessions must remain independent of external API uptime and billing.

## Update and validation procedure

Numerical rows are a reviewed local source snapshot, not a live scraper. To update: retrieve the authoritative table, preserve its epoch/frame/reference/uncertainty, edit only the corresponding row, bump `DATASET_VERSION`, record the review here or in DECISIONS, and run the catalogue and astronomy/scale regressions. Never claim `retrievedAt` is the measurement epoch or that a recently retrieved compilation is newly measured data.

`tests/data-layer.test.mjs` verifies 32-body scope, referential integrity, units/provenance, missing-value behavior, independent Kepler/axis cases, time boundaries, deterministic offline calculations and scene/guide integration. Existing scale tests still verify scientific ratios and double-to-float conversion. No higher-precision ephemeris accuracy is claimed by these tests.
