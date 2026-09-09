# Solar System Explorer — Master Specification

## Product vision

Create a beautiful, interactive, educational 3D Solar System experience in which the Solar System itself is the interface. The user begins near Earth in a spacecraft or spacecraft-like free camera and can immediately choose a direction, discover a world, travel to it, learn about it, and ask questions.

Core experience:

`SEE → FLY → DISCOVER → SELECT → LEARN → ASK → EXPLORE`

The intended character is a combination of:

- a lightweight 3D space-exploration game;
- an interactive planetarium;
- an astronomical encyclopedia;
- an educational discovery experience;
- a scientifically grounded simulation;
- a future context-aware AI astronomy guide.

This must not become a conventional website with planet pictures and text. Curiosity should drive navigation.

## Product principles

Prioritize, in order:

1. Discovery.
2. Immersion.
3. Understanding.
4. Scientific credibility.
5. Simplicity.

The experience should be accessible to people with little astronomy knowledge and little or no gaming experience. It should feel premium and cinematic without hiding uncertainty or pretending that visual approximations are physical reality.

## Target opening experience

- Begin quickly in darkness/space near Earth.
- Reveal stars and Earth with restrained cinematic motion.
- Activate a minimal spacecraft/HUD layer.
- Present a simple invitation such as “Where do you want to go?”
- Allow exploration immediately; do not place a marketing page or menu wall before the experience.

## Major product capabilities

### Solar System exploration

- Freely explore from a spacecraft/free-flight camera.
- Select objects by scene interaction, label/crosshair, search, browser, or nearby list.
- Support both manual flight and assisted travel.
- Provide system overview, target focus, braking, recovery, and clear orientation aids.
- Make close approach increasingly detailed without requiring literal astronomical travel times.

### Astronomical catalogue

The architecture should eventually represent:

- Sun and planets;
- major and selected minor moons;
- dwarf planets;
- notable asteroids and near-Earth objects;
- comets and centaurs;
- trans-Neptunian/Kuiper Belt objects;
- rings, belts, and important populations/regions;
- useful Lagrange points;
- selected human spacecraft and probes.

Major objects should remain readily available. Large populations must load selectively by location, zoom, importance, search, and performance; never render every catalogue object simultaneously.

### Object information

Adapt the information panel to object type. Relevant fields may include:

- identity, type, and parent body;
- description and notable characteristics;
- radius/diameter, mass, gravity, rotation, and orbital period;
- atmosphere, composition, temperature, and discovery information;
- distance from Sun, Earth, selected object, and spacecraft;
- missions, scientific importance, habitability, and uncertainty.

Do not display meaningless empty fields.

### Distance comparison

- Compare selected objects with Earth, Sun, parent body, another object, or the spacecraft.
- Use scientifically meaningful units and calculations.
- Label approximations and distinguish straight-line separation from a travel path.

### Search and discovery

- Support exact object names and aliases.
- Later support natural-language queries such as “moons with subsurface oceans.”
- Search results should offer show, travel, and information actions.
- Add nearby objects, tours, curated discoveries, and contextual suggestions only after the core experience is strong.

### Time and orbital motion

- Show optional orbital paths.
- Support pause, real time, and accelerated rates.
- Later permit historical/future dates with documented model accuracy.
- Preserve real numerical data even when visualization distances/sizes are altered.

## Flight and gameplay goals

### Manual flight

- Easy for non-gamers, smooth, predictable, and recoverable.
- Support forward/back, lateral, vertical, rotation, acceleration, braking, and faster travel.
- Adapt speed to context without causing sudden loss of control.
- Provide touch/mobile controls as the product matures.

### Assisted travel

- Let the user select a destination and request travel.
- Produce a visually impressive, readable journey with safe approach framing.
- Do not claim that assisted travel is a real transfer orbit or real travel time.
- Respect reduced-motion settings.

### Optional progression

After the exploration experience is excellent, add lightweight missions and discovery tracking, for example visiting all planets, Galilean moons, ocean worlds, dwarf planets, famous asteroids, or spacecraft routes. Gamification must support curiosity rather than undermine scientific exploration.

## Scientific goals

- Prefer NASA, JPL, IAU, ESA, Minor Planet Center, and equivalent primary/authoritative sources.
- Separate stable facts, calculated/dynamic values, external/current data, and AI-generated explanation.
- Never fabricate missing values.
- Mark unknown, estimated, disputed, model-dependent, simplified, or visually compressed information.
- Design for citations and source provenance.
- Treat the product as educational visualization, not navigation/research software.

Detailed data rules are in [ASTRONOMY_DATA.md](ASTRONOMY_DATA.md).

## Visual and UX goals

- Dark, cinematic, minimal, premium, scientific, futuristic, immersive.
- Space and the worlds dominate the screen; UI remains restrained.
- Realistic materials, lighting, shadows, atmospheric glow, night sides, rings, orbit visualization, and smooth camera motion.
- Use LOD, culling, streaming, optimized textures, and procedural systems to sustain performance.
- Support readable/scalable typography, keyboard navigation, contrast, reduced motion, and alternatives to color-only meaning.
- Sound may later include interface, spacecraft-interior, alarm, or music elements. Do not imply that sound propagates through space. Sound must be optional and mutable.

Detailed interaction rules are in [DESIGN_UX.md](DESIGN_UX.md).

## AI astronomy guide vision

The mature guide should understand the selected object, current view, spacecraft location, displayed date, and conversation context. It should answer questions such as “Could humans live here?”, “What is below the ice?”, and “Compare this with our Moon.”

The guide should combine:

1. trusted structured astronomical data;
2. curated factual content;
3. current external information when appropriate;
4. an LLM for conversation and explanation.

Requirements:

- Ground factual claims in structured/curated data.
- Show sources/citations where practical.
- Communicate uncertainty.
- Never expose API keys in browser code.
- Use a server-side boundary, rate limits, privacy protections, and cost controls.
- Obtain an explicit product decision before introducing meaningful recurring AI/API cost.

## Long-term roadmap goals

- Larger dynamically loaded Solar System catalogue.
- High-quality close approaches and multi-resolution LOD.
- More accurate ephemerides and selectable dates.
- Guided tours and educational/classroom experiences.
- Missions, exploration logs, achievements, and completion tracking.
- Spacecraft/probe journeys.
- Secure non-programmer admin tools for descriptions, tours, missions, sources, and visibility.
- Privacy-conscious analytics for product quality and errors.
- Optional accounts/synchronized journeys when justified.
- Possible later expansion to exoplanets, nearby stars, Milky Way exploration, VR, narration, and multiplayer.

## Intentionally deferred

These are not part of the current near-term build:

- millions of asteroids or full-catalogue simultaneous rendering;
- complex accounts and cloud synchronization;
- multiplayer;
- massive admin functionality;
- expensive infrastructure or broad paid API usage;
- every astronomical API;
- research-grade ephemerides/navigation;
- extreme terrain detail and surface landing;
- elaborate achievements before exploration quality is proven;
- exoplanets, the wider galaxy, and VR.

## Delivery method

Work iteratively:

`PLAN → BUILD → RUN → INSPECT → TEST → FIX → SHOW → FEEDBACK → IMPROVE`

The product owner steers product and creative decisions in normal language. Development agents own technical implementation, debugging, validation, and safe deployment.

