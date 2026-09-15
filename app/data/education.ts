import type { EducationalEntry } from "./schema";
// Existing authored copy retained; not certified as newly source-reviewed.
export const education: Record<string, EducationalEntry> = {
  sun: {
    description:
      "Our star. Its gravity holds the solar system together, while fusion in its core supplies the light and warmth that make life on Earth possible.",
    fact: "Sunlight takes about 8 minutes 20 seconds to travel one astronomical unit.",
    atmosphere: "Hydrogen and helium; a hot plasma, not a solid surface.",
    source: "https://science.nasa.gov/sun/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  mercury: {
    description:
      "A small, cratered world close to the Sun. Its nearly airless surface experiences extreme contrasts between day and night.",
    fact: "Mercury completes an orbit before it completes two rotations.",
    atmosphere: "An extremely thin exosphere.",
    source: "https://science.nasa.gov/mercury/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  venus: {
    description:
      "Beneath bright clouds lies a rocky world with a crushing atmosphere. An intense greenhouse effect makes its surface hotter than Mercury’s.",
    fact: "Venus rotates in the opposite direction to most planets.",
    atmosphere: "Mostly carbon dioxide, with sulfuric acid clouds.",
    source: "https://science.nasa.gov/venus/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  earth: {
    description:
      "An ocean world wrapped in a thin blue atmosphere. Our home is the only place where life has been confirmed, and the starting point for every journey we have made into space.",
    fact: "Liquid oceans cover about 71% of Earth’s surface.",
    atmosphere: "Mostly nitrogen and oxygen.",
    source: "https://science.nasa.gov/earth/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  moon: {
    description:
      "Earth’s natural satellite preserves a record of ancient impacts. Dark volcanic plains contrast with bright, heavily cratered highlands.",
    fact: "Tidal locking keeps approximately the same side facing Earth.",
    atmosphere: "An extremely thin exosphere.",
    source: "https://science.nasa.gov/moon/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  mars: {
    description:
      "A cold desert with giant volcanoes, deep canyons and evidence of ancient rivers. Iron minerals give the landscape its rusty color.",
    fact: "Robotic missions study whether ancient Mars had environments suitable for life.",
    atmosphere: "Thin, mostly carbon dioxide.",
    source: "https://science.nasa.gov/mars/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  jupiter: {
    description:
      "The largest planet is a swirling world of cloud bands and powerful storms. Below the visible clouds, pressure rises deep into its hydrogen-rich interior.",
    fact: "The Great Red Spot is a long-lived storm, not a surface feature.",
    atmosphere: "Mostly hydrogen and helium.",
    source: "https://science.nasa.gov/jupiter/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  saturn: {
    description:
      "A pale gas giant surrounded by a vast, delicate ring system. The rings consist of countless pieces of ice and rock, each following its own orbit.",
    fact: "Saturn has a lower average density than water.",
    atmosphere: "Mostly hydrogen and helium.",
    source: "https://science.nasa.gov/saturn/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  uranus: {
    description:
      "A cold ice giant that rotates almost on its side. Its unusual tilt produces extreme seasons during its long journey around the Sun.",
    fact: "Methane in the atmosphere absorbs red light, contributing to its blue-green appearance.",
    atmosphere: "Hydrogen, helium and methane.",
    source: "https://science.nasa.gov/uranus/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  neptune: {
    description:
      "Far beyond Earth, Neptune is a cold, windy world. Its atmosphere contains changing clouds and storms above a dense interior.",
    fact: "Neptune was found after mathematical predictions pointed astronomers toward it.",
    atmosphere: "Hydrogen, helium and methane.",
    source: "https://science.nasa.gov/neptune/facts/",
    reviewStatus: "legacy-curated",
    reviewedAt: null,
  },
  phobos: {
    description:
      "Mars’s larger inner moon is an irregular, heavily cratered body that is slowly spiraling inward.",
    fact: "Phobos orbits Mars faster than Mars rotates, so it rises in the west and sets in the east.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/mars/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  deimos: {
    description:
      "Mars’s small outer moon has a smoother-looking surface because loose material partly fills its craters.",
    fact: "Deimos takes about 30 hours to complete one orbit around Mars.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/mars/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  io: {
    description:
      "The innermost Galilean moon is the most volcanically active world known, driven by tidal heating inside Jupiter’s gravity well.",
    fact: "Io’s surface is continually renewed by lava and sulfur-rich volcanic deposits.",
    atmosphere: "A thin, variable sulfur-dioxide atmosphere.",
    source: "https://science.nasa.gov/jupiter/moons/io/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  europa: {
    description:
      "A bright shell of water ice covers a global ocean that may contain more liquid water than all Earth’s oceans combined.",
    fact: "Europa’s young surface is crossed by ridges and bands with relatively few large impact craters.",
    atmosphere: "An extremely tenuous oxygen atmosphere.",
    source: "https://science.nasa.gov/jupiter/moons/europa/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  ganymede: {
    description:
      "The largest moon in the Solar System is an icy-rocky world with its own internally generated magnetic field.",
    fact: "Ganymede is larger than Mercury, although it has much less mass.",
    atmosphere: "A very tenuous oxygen atmosphere.",
    source: "https://science.nasa.gov/jupiter/moons/ganymede/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  callisto: {
    description:
      "Jupiter’s outermost Galilean moon has an ancient, densely cratered surface and evidence for an ocean deep below.",
    fact: "Callisto’s heavily cratered landscape preserves a long record of impacts.",
    atmosphere: "An extremely tenuous atmosphere, including carbon dioxide.",
    source: "https://science.nasa.gov/jupiter/moons/callisto/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  mimas: {
    description:
      "A small icy Saturnian moon dominated visually by the enormous Herschel impact crater.",
    fact: "Herschel crater makes Mimas resemble the fictional Death Star, although the likeness is coincidental.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/saturn/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  enceladus: {
    description:
      "A bright icy moon whose south-polar fractures vent water-rich material from a global subsurface ocean.",
    fact: "Material from Enceladus’s plumes supplies much of Saturn’s E ring.",
    atmosphere:
      "A very tenuous, localized water-vapor exosphere associated with active plumes.",
    source: "https://science.nasa.gov/saturn/moons/enceladus/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  tethys: {
    description:
      "A low-density icy moon marked by the vast Odysseus crater and the long Ithaca Chasma canyon system.",
    fact: "Tethys is composed predominantly of water ice.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/saturn/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  dione: {
    description:
      "An icy moon with bright tectonic fractures, cratered terrain and evidence suggesting a deep internal ocean.",
    fact: "Dione shares its orbit with the small co-orbital moons Helene and Polydeuces.",
    atmosphere: "An extremely tenuous exosphere.",
    source: "https://science.nasa.gov/saturn/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  rhea: {
    description:
      "Saturn’s second-largest moon is an icy, heavily cratered world with bright wispy fractures.",
    fact: "Rhea has an extremely tenuous oxygen-and-carbon-dioxide exosphere.",
    atmosphere: "An extremely tenuous oxygen-and-carbon-dioxide exosphere.",
    source: "https://science.nasa.gov/saturn/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  titan: {
    description:
      "Saturn’s largest moon has a dense atmosphere, organic chemistry and lakes and seas of liquid methane and ethane.",
    fact: "Titan is the only moon known to have a dense atmosphere and stable surface liquids.",
    atmosphere:
      "Dense nitrogen atmosphere with methane and complex organic haze.",
    source: "https://science.nasa.gov/saturn/moons/titan/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  iapetus: {
    description:
      "An outer Saturnian moon with a dramatic dark-and-bright surface contrast and a ridge along much of its equator.",
    fact: "Iapetus’s leading hemisphere is far darker than its trailing hemisphere.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/saturn/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  miranda: {
    description:
      "The innermost major Uranian moon has a patchwork surface of giant canyons, ridges and unusual coronae.",
    fact: "Miranda’s Verona Rupes is among the tallest known cliffs in the Solar System.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/uranus/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  ariel: {
    description:
      "A bright Uranian moon whose valleys and relatively young terrain show extensive past geological activity.",
    fact: "Ariel appears to have one of the youngest surfaces among Uranus’s major moons.",
    atmosphere: "No substantial atmosphere confirmed.",
    source: "https://science.nasa.gov/uranus/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  umbriel: {
    description:
      "A dark, ancient and heavily cratered Uranian moon with fewer obvious signs of recent resurfacing.",
    fact: "The bright ring on crater Wunda stands out against Umbriel’s dark terrain.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/uranus/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  titania: {
    description:
      "Uranus’s largest moon is an icy-rocky world cut by faults and deep canyons.",
    fact: "Titania was discovered by William Herschel in 1787, together with Oberon.",
    atmosphere: "No substantial atmosphere confirmed.",
    source: "https://science.nasa.gov/uranus/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  oberon: {
    description:
      "The outermost major Uranian moon has an old, cratered surface crossed by faults and canyons.",
    fact: "Oberon’s dark crater floors may expose material from below its icy surface.",
    atmosphere: "No substantial atmosphere.",
    source: "https://science.nasa.gov/uranus/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  triton: {
    description:
      "Neptune’s largest moon follows a retrograde orbit and has a young icy surface shaped by cryovolcanic activity.",
    fact: "Triton likely formed in the Kuiper Belt before Neptune captured it.",
    atmosphere: "A thin nitrogen atmosphere with trace methane.",
    source: "https://science.nasa.gov/neptune/moons/triton/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
  charon: {
    description:
      "Pluto’s largest moon is so large relative to Pluto that the pair orbit a barycenter outside Pluto itself.",
    fact: "The same hemispheres of Pluto and Charon continually face one another because both are tidally locked.",
    atmosphere: "No substantial atmosphere detected.",
    source: "https://science.nasa.gov/dwarf-planets/pluto/moons/",
    reviewStatus: "source-reviewed",
    reviewedAt: "2026-09-14",
  },
};
