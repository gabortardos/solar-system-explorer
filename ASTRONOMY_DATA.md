# Solar System Explorer — Astronomy and Data

## Scope

This records the current scientific model, its limitations, and the intended data-growth path. Update it whenever object schemas, sources, coordinate logic, scale transformations, or scientific assumptions change.

## Local catalogue and source snapshot

Dataset `2026.09.14-1`, schema version 1; numerical references retrieved 2026-09-09/10 and Uranus orientation constants reviewed 2026-09-14.

| Category | Catalogue records |
| --- | --- |
| Star and planets | Sun; Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune |
| Dwarf planets | Ceres, Pluto |
| Earth / Mars moons | Moon; Phobos, Deimos |
| Jupiter moons | Io, Europa, Ganymede, Callisto |
| Saturn moons | Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus |
| Uranus moons | Miranda, Ariel, Umbriel, Titania, Oberon |
| Neptune / Pluto moons | Triton; Charon |

**32 catalogue records, 29 rendered/selectable destinations.** Ceres, Pluto and Charon remain information-only. “Major moons” is this explicit initial scope, not a claim to catalogue every large satellite.

## Scientific data boundaries

| Module | Responsibility |
| --- | --- |
| `app/data/schema.ts` | Quantity values/units, source IDs, reference location, quality, uncertainty and missing reason |
| `sources.ts` | Source registry, snapshot version and physical/unit constants |
| `physical.ts` | Reference radii, masses or GM, gravity, signed rotation periods |
| `planet-elements.ts`, `orbits.ts` | Orbital elements/rates, parent, epoch, reference plane and period |
| `catalog.ts` | Identity, curated aliases, categories, indexed lookup and snapshot validation |
| `positions.ts` | Time-dependent, double-precision geometric positions and model quality |
| `dynamic.ts` | Timestamped modeled distances/light times; explicit absence of live observations |
| `education.ts`, `guide-education.ts` | Retained descriptions, temperatures and guide summaries, explicitly marked legacy-curated |
| `object-education.ts` | NASA Science-reviewed qualitative composition, discovery and scientific-importance summaries |
| `app/body-presentation.ts` | Explicit bounded active-scene colors, optional textures and display classifications |
| `app/astronomy.ts` | Compatibility adapter for the active UI/scene set; no independent scientific literals |

`Quantity.value` is a number or `null`. Missing values carry `missingReason`; they never become zero. `uncertainty: null` means no numerical uncertainty supplied/propagated, not exactness. `quality` distinguishes reference, nominal, approximate and derived quantities. Units are explicit (`km`, `kg`, `km3/s2`, `m/s2`, `h`, `d`, `au`, `deg`, `1`). Negative rotation means retrograde. The Sun has no heliocentric year (`null`).

Identity records contain a stable ID, canonical name, optional curated aliases, category and parent. The initial aliases are common Latin alternatives (Sol, Terra, Luna, Jove) and official numbered designations for Ceres/Pluto. Empty alias arrays are intentional. Catalogue validation rejects blank, repeated, or cross-object ambiguous names/aliases; future imports must source designations rather than manufacture synonyms.

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
| Planet orientation | [NASA/JPL NAIF PCK](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc) | IAU Working Group orientation models. Used only for Uranus's equatorial reference-plane pole, not as a satellite ephemeris. |
| Solar rotation / lunar synchronism | [NASA Sun](https://science.nasa.gov/sun/facts/), [NASA Moon](https://science.nasa.gov/moon/facts/) | Educational approximations. Sun rotates differentially; the Moon's mean synchronous spin is explicitly derived using the stored JPL period. |
| Educational summaries | Per-body NASA Science links | Retained author-written material is marked `legacy-curated`, not newly verified field-level science or a live feed. Full editorial re-review remains outstanding. |

Gravity for planets is the JPL equatorial/reference-level value. Satellite gravity is explicitly computed as `GM / meanRadius² × 1000` in m/s²; it neglects shape and rotation and has no propagated uncertainty. Sun gravity uses DE440 GM and the nominal radius. No guessed mass is inserted when only GM is imported.

All data needed by the app ships locally. No external astronomy API, paid service, keys, background refresh or per-visit usage cost was added. JPL/Horizons is the recommended future ephemeris source; MPC is appropriate for future minor-body catalogue ingestion, not an unnecessary dependency for this small static dataset. ESA remains a useful mission/science reference; it was not needed to duplicate JPL's numerical tables.

## Calculated positions and time

`calculatePosition(id, utcMs)` returns available coordinates with unit, frame, time, model, quality, sources and caveat, or `unavailable` with `value: null` and a reason. Unknown IDs, unsupported models, invalid times and out-of-range dates fail explicitly. The active-scene adapter throws for invalid requests rather than inventing positions.

- Planet model: Table 1, J2000 TDB coefficients; UTC is still substituted for TDB and disclosed. Twelve Newton iterations solve Kepler's equation.
- For the 1800–2050 fit, position results also expose JPL's published nominal longitude/latitude/radial errors per planet. Radial figures range from 1,000 km (Mercury) to 1,500,000 km (Saturn); they are model guidance, not per-frame uncertainty calculations.
- Public calculation interval: `[1800-01-01, 2050-01-01)`; UI still stops at the end of 2049.
- Returned scientific axes: heliocentric ecliptic/equinox J2000 `[X,Y,Z]` in AU. Scene mapping is explicitly `[X,Z,-Y]`, with no scale change.
- Sun: origin of the chosen heliocentric frame, not a computed barycentric solar trajectory.
- Major moons: source J2000 mean ellipses are propagated at their published mean periods and added to the modeled parent position. Parent-ecliptic elements remain ecliptic; local-Laplace and parent-equatorial coordinates are rotated into ICRF using the stored reference-plane pole, then into the J2000 ecliptic. The node convention follows JPL's ascending node of the reference plane on the ICRF equator.
- These fixed ellipses omit nodal/apsidal precession, perturbations, light time and body orientation. Every result is **illustrative**, with no validated position-error bound; the application interval is not a claimed satellite-accuracy interval.
- Charon: parent-relative elements and facts are stored, but position remains unavailable because Pluto has no imported heliocentric model. No origin or average-distance fallback is used.
- Ceres/Pluto: physical properties and reference orbital periods are imported; a positional element set is not yet imported. The current JPL approximate-positions page explicitly excludes Pluto. No remembered or guessed Pluto/Ceres coefficients are used.

`calculateDistance()` uses simultaneous uncompressed model coordinates, converted by the defined AU. Results carry time, sources and approximate/illustrative quality. `dynamicValues()` separates these calculations from `observations`, which is explicitly unavailable. Light time is geometric distance/c, not observed retarded-time astrometry or a spacecraft travel duration.

The simulation clock starts at the current UTC instant, advances from a monotonic browser-time anchor, and offers pause, 1×, 10×, 100× and 1,000×. It does not improve ephemeris accuracy: UTC still substitutes for TDB, coordinates are geometric simultaneous positions, Earth is the Earth–Moon barycenter, and the lunar model omits perturbations/precession. Rates alter only the evaluation time, never the source coefficients or displayed physical units.

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
- Parent and satellite offsets are handled separately. Each Exploration-scale moon system uses a monotonic radial power compression normalized by its outermost active orbit; direction, phase and orbital ordering are preserved while literal spacing is intentionally not.
- Body radii use a separate square-root enlargement rule with a minimum; the Sun uses a fixed visual radius.

Never calculate displayed scientific distance from either scene representation.

The mobile bottom-sheet scale selector and desktop settings switch both update the same `SceneOptions.scientific` state. They are alternate controls for the same presentation policy; neither changes catalogue values, modeled positions, or displayed physical measurements.

### Precision and catalogue growth

- Model positions, physical calculations, navigation positions, and future catalogue tiles use IEEE-754 double precision.
- Rendering subtracts the camera origin before writing bounded active geometry to GPU float buffers.
- Orbit/route source vertices remain double precision and are regenerated relative to the current camera for rendering.
- Large catalogues must be spatially indexed and streamed by region, zoom, proximity, and importance. The renderer must not create one textured mesh or DOM label for every stored minor body.
- Search indexing is separate from render activation. The current 32-record local adapter returns bounded compact results; a large catalogue requires an ingest-time normalized alias/designation index and server-side top-k/paginated queries, followed by object detail and scene tile loading only on demand.
- Nearby satellites use parent-local coordinates so small separations survive when their parent is far from the global origin.
- A finite active render horizon is a visibility/performance rule, not a limit on scientific coordinates or travel.

## Physical data currently displayed

- Mean radius/diameter, gravity, rotation, and orbital period.
- Modeled distance from Sun.
- Pairwise modeled distance with magnitude-aware km/million-km/AU presentation.
- Curated atmosphere, description, fact, temperature, water, companions, missions, and habitability.

The current object-information presenter consumes canonical numerical records and emits only applicable quantities with non-null values. It never treats a missing measurement as zero or manufactures a display default. Field-level source/reliability details are exposed for the numerical rows that appear.

Major-moon descriptions, facts, atmospheres, composition, discovery and scientific-importance summaries were reviewed against linked NASA Science pages on 2026-09-14 and remain separate from reference measurements. Planet descriptions, temperatures and guide prose are still legacy-curated; their numerical prose is not a live measurement feed.

### Distance calculation semantics

- Body-to-body distance is the Euclidean center separation of two simultaneous uncompressed model positions at the displayed UTC simulation timestamp. It is geometric, not light-time corrected, observed, or a flight path.
- “Average orbital distance” is shown only when one compared body directly orbits the other. Its value is the locally stored semimajor axis; it is a reference orbit size, not the current separation.
- Scientific Scale spacecraft distance converts the camera through the exact linear 100-units/AU mapping.
- Exploration Scale spacecraft distance is a focused-body-local navigation estimate because compressed heliocentric distances, enlarged radii and parent-local satellite placement do not have one globally physical inverse. It must remain labelled as an estimate and outside the authoritative ephemeris layer.
- Missing position or semimajor-axis data is omitted or reported unavailable; it is never reconstructed from average values without an explicit model.

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

1. **Validated ephemeris expansion:** acquire reviewed, versioned local JPL Horizons/SPICE snapshots or fitted coefficients for Ceres/Pluto and higher-accuracy moons; establish time transformations and error bounds before claiming ephemeris quality.
2. **Editorial review:** re-review retained NASA summaries, import descriptions for additional bodies, record dates and source locations, and avoid assertions about current mission status without a dated source.
3. **Selected-world rendering:** add textured assets only where provenance and performance justify them; retain lightweight color-material fallbacks and system-level visibility culling.
4. **Large catalogues:** an offline/import-time ingestion pipeline with schema/unit/source validation, reviewable diffs, release versions and rollback. Store compact numerical arrays separately from prose; spatially index/stream bounded active tiles. Never eagerly construct one mesh or metadata object per million-body catalogue entry in the scene loop.
5. **Higher-fidelity time:** proper UTC/TT/TDB conversion, validated date ranges and optional cached ephemerides. Browser sessions must remain independent of external API uptime and billing.

## Update and validation procedure

Numerical rows are a reviewed local source snapshot, not a live scraper. To update: retrieve the authoritative table, preserve its epoch/frame/reference/uncertainty, edit only the corresponding row, bump `DATASET_VERSION`, record the review here or in DECISIONS, and run the catalogue and astronomy/scale regressions. Never claim `retrievedAt` is the measurement epoch or that a recently retrieved compilation is newly measured data.

`tests/data-layer.test.mjs` verifies 32-body scope, referential integrity, units/provenance, missing-value behavior, independent Kepler/axis cases, time boundaries, deterministic offline calculations and scene/guide integration. `tests/simulation-clock.test.mjs` verifies exact rates, monotonic continuity, clamping, UTC output, a bounded nonzero orbital step and attached JPL error metadata. Existing scale tests still verify scientific ratios and double-to-float conversion. No higher-precision ephemeris accuracy is claimed by these tests.

## Step 14 minor-body snapshot

Source: [NASA/JPL SBDB API 1.3](https://ssd-api.jpl.nasa.gov/doc/sbdb.html), retrieved 2026-09-14 via serial offline requests. `data-source/minor-bodies/` retains original responses, retrieval times and request URLs. Generated detail records link these and preserve SHA-256 snapshot checksums, JPL solution dates, orbital condition codes, per-field units, uncertainties and physical references. Never refresh this data during normal build or browser use.

Nineteen objects cover main-belt asteroids, NEO/PHA asteroids, comets and TNOs. Categories and NEO/PHA flags come from JPL; editorial importance is solely for browsing/render budgets. TNO describes orbital context, not a replacement IAU physical classification. No hazard probability is inferred from the PHA flag.

Schema separates identity/classification, `physical` reported quantities, `orbit` epoch/frame/elements, calculated position functions and optional `education` (currently null). No invented educational text, radius, mass, rotation or shape is filled in. The physical panel retains JPL's individual labels/units/references and omits null values.

Position model: geometric heliocentric ecliptic J2000 AU in Float64; JPL osculating a/e/i/node/argument/mean anomaly and mean motion at each record's TDB epoch. A bracketed Kepler solver handles high eccentricity. UTC substitutes for TDB. This is an **illustrative fixed two-body ellipse**, not a JPL ephemeris: planetary perturbations, comet nongravitational forces, relativity and light time are absent; no validated error bound. Accuracy can deteriorate far from the source epoch, especially after encounters. Unsupported hyperbolic/parabolic or missing elements return null. Nearby results use the same model at one stated simulation instant, never compressed coordinates or average orbital distances.

Future precision requires Horizons/SPK snapshots and explicit validity windows with independent reference comparisons. Do not use these markers to predict impacts, mission approaches or observations.

## Step 15 population-region model

The population layer is visualization metadata, not a new astronomical catalogue. It uses deterministic, uniformly representative samples within simplified envelopes: main asteroid belt 2.1–3.3 AU, the main Kuiper Belt 30–50 AU, and broad Jupiter co-orbital clouds centered approximately 60° ahead/behind Jupiter. The Kuiper limits and Trojan geometry follow NASA educational references; the main-belt envelope is a deliberate presentation boundary spanning the region between Mars and Jupiter rather than a claim of a sharp physical edge.

The dots have no identity, orbital elements, epoch position, completeness or population-count meaning. Uniform sampling does not reproduce real density, resonances, Kirkwood gaps, asteroid families or Kuiper sub-populations. Radial position and modest vertical spread exist only to communicate a sparse three-dimensional region. Scientific calculations never consume these samples.

References: [NASA Kuiper Belt facts](https://science.nasa.gov/solar-system/kuiper-belt/facts/), [NASA Solar System glossary — Trojan asteroids](https://science.nasa.gov/universe/glossary/), and [NASA asteroid facts](https://science.nasa.gov/solar-system/asteroids/facts/).
