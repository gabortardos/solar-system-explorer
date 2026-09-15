// Source-reviewed, compact editorial fields for the current scene destinations.
// These are qualitative summaries from each body's linked NASA Science fact page,
// not physical measurements or live observations.
export type ObjectEducationProfile = {
  composition: string;
  scientificImportance: string;
  discovery?: string;
};
export const OBJECT_EDUCATION_REVIEWED_AT = "2026-09-14";
export const objectEducation: Record<string, ObjectEducationProfile> = {
  sun: {
    composition:
      "A sphere of hot plasma made primarily of hydrogen and helium; hydrogen fusion powers its core.",
    scientificImportance:
      "The Sun supplies the energy that supports life on Earth. Studying our nearest star also reveals how stellar activity and space weather affect planetary systems.",
  },
  mercury: {
    composition:
      "A very large metallic core beneath a comparatively thin rocky mantle and crust.",
    scientificImportance:
      "Mercury preserves evidence about rocky-planet formation close to a star and provides an extreme test of solar heating, space weathering and planetary contraction.",
  },
  venus: {
    composition:
      "An iron core, hot-rock mantle and rocky crust beneath a dense carbon-dioxide atmosphere and sulfuric-acid clouds.",
    scientificImportance:
      "Venus is a crucial comparison with Earth: similar size and interior structure led to a radically different climate, helping scientists study greenhouse warming and rocky exoplanets.",
  },
  earth: {
    composition:
      "An iron-nickel core, silicate mantle and crust, extensive liquid-water oceans, and a nitrogen-oxygen atmosphere.",
    scientificImportance:
      "Earth is the only world known to host life and the reference point for understanding habitable environments, climate and the evolution of rocky planets.",
  },
  moon: {
    composition:
      "A small iron-rich core surrounded by a rocky mantle and crust; its surface is covered by impact-fragmented regolith.",
    scientificImportance:
      "The Moon preserves an ancient impact record, constrains the history of the Earth-Moon system, and offers accessible polar ice and terrain for sustained exploration.",
  },
  mars: {
    composition:
      "An iron, nickel and sulfur core, a rocky mantle, and an iron-rich crust beneath a thin carbon-dioxide atmosphere.",
    scientificImportance:
      "Mars records ancient rivers, lakes and changing climates, making it a primary target for studying past habitability and the evolution of terrestrial planets.",
  },
  jupiter: {
    composition:
      "Mostly hydrogen and helium, grading into liquid and metallic hydrogen around a diffuse core enriched in heavier material.",
    scientificImportance:
      "Jupiter’s mass, atmosphere, magnetic field and diverse moons help reveal how giant planets and entire planetary systems form and evolve.",
  },
  saturn: {
    composition:
      "Mostly hydrogen and helium around a dense metal-and-rock core; its rings are predominantly water ice mixed with rock and dust.",
    scientificImportance:
      "Saturn is a natural laboratory for ring dynamics, giant-planet atmospheres and potentially habitable ocean worlds such as Enceladus and Titan.",
  },
  uranus: {
    composition:
      "A hot, dense fluid rich in water, methane and ammonia above a small rocky core, wrapped in a hydrogen-helium-methane atmosphere.",
    discovery:
      "William Herschel discovered Uranus in 1781. It was the first planet found with the aid of a telescope.",
    scientificImportance:
      "Uranus’s extreme axial tilt, unusual seasons and ice-giant interior provide a key comparison for the many Neptune-size planets found around other stars.",
  },
  neptune: {
    composition:
      "A hot, dense fluid rich in water, methane and ammonia above a small rocky core, with a hydrogen-helium-methane atmosphere.",
    discovery:
      "Johann Gottfried Galle found Neptune in 1846 near the position predicted mathematically from disturbances in Uranus’s orbit.",
    scientificImportance:
      "Neptune tests models of ice-giant interiors, extreme atmospheric dynamics and the formation and migration of the outer Solar System.",
  },
  phobos: {
    composition: "A dark, porous mixture of rocky material and dust.",
    discovery: "Asaph Hall discovered Phobos in 1877.",
    scientificImportance:
      "Its inward migration records tidal evolution around Mars and will eventually end in disruption or impact.",
  },
  deimos: {
    composition:
      "A small, dark and porous rocky body covered by loose regolith.",
    discovery: "Asaph Hall discovered Deimos in 1877.",
    scientificImportance:
      "Together with Phobos, it constrains competing capture and impact-origin models for the Martian moons.",
  },
  io: {
    composition:
      "A rocky, iron-rich body coated with sulfurous volcanic material.",
    discovery: "Galileo Galilei observed Io in 1610.",
    scientificImportance:
      "Io is the clearest natural laboratory for extreme tidal heating and its interaction with a giant planet’s magnetosphere.",
  },
  europa: {
    composition:
      "A metallic and rocky interior beneath a water-ice shell and global saltwater ocean.",
    discovery: "Galileo Galilei observed Europa in 1610.",
    scientificImportance:
      "Its ocean and possible chemical energy sources make Europa one of the Solar System’s highest-priority astrobiology targets.",
  },
  ganymede: {
    composition:
      "Roughly equal parts rock and water ice, differentiated into layers around a metallic core.",
    discovery: "Galileo Galilei observed Ganymede in 1610.",
    scientificImportance:
      "Its magnetic field, probable layered ocean and great size connect moon geology with magnetospheric science.",
  },
  callisto: {
    composition:
      "An approximately mixed rock-and-ice interior beneath an ancient icy surface.",
    discovery: "Galileo Galilei observed Callisto in 1610.",
    scientificImportance:
      "Its preserved impact record and possible deep ocean offer a comparison with more geologically active icy moons.",
  },
  mimas: {
    composition: "Predominantly water ice with a smaller rocky component.",
    discovery: "William Herschel discovered Mimas in 1789.",
    scientificImportance:
      "Its cratered surface and evidence for a possible internal ocean test models of how small icy moons retain heat.",
  },
  enceladus: {
    composition:
      "Water ice over a rocky core, with a global subsurface ocean containing salts and organic compounds.",
    discovery: "William Herschel discovered Enceladus in 1789.",
    scientificImportance:
      "Its accessible ocean-derived plumes make Enceladus a premier target in the search for habitable environments beyond Earth.",
  },
  tethys: {
    composition: "Mostly water ice with a small fraction of rock.",
    discovery: "Giovanni Domenico Cassini discovered Tethys in 1684.",
    scientificImportance:
      "Its giant impact structures and low density help constrain the formation and evolution of Saturn’s mid-sized icy moons.",
  },
  dione: {
    composition: "Water ice mixed with a denser rocky component.",
    discovery: "Giovanni Domenico Cassini discovered Dione in 1684.",
    scientificImportance:
      "Tectonic terrain and evidence for an internal ocean illuminate how modest-sized icy moons can remain geologically active.",
  },
  rhea: {
    composition: "Mostly water ice with rocky material.",
    discovery: "Giovanni Domenico Cassini discovered Rhea in 1672.",
    scientificImportance:
      "Rhea’s old surface and tenuous exosphere provide a useful contrast with Saturn’s more active icy moons.",
  },
  titan: {
    composition:
      "A rock-and-water-ice interior beneath a thick nitrogen-rich atmosphere and organic haze.",
    discovery: "Christiaan Huygens discovered Titan in 1655.",
    scientificImportance:
      "Titan couples an ocean-world interior with Earth-like weather and surface liquids made of hydrocarbons, enabling unique studies of prebiotic chemistry.",
  },
  iapetus: {
    composition:
      "Mostly water ice with rocky material and dark carbon-rich surface deposits.",
    discovery: "Giovanni Domenico Cassini discovered Iapetus in 1671.",
    scientificImportance:
      "Its two-tone surface, equatorial ridge and distant orbit preserve clues to dust transport and Saturn-system history.",
  },
  miranda: {
    composition: "A mixture of water ice and rock.",
    discovery: "Gerard Kuiper discovered Miranda in 1948.",
    scientificImportance:
      "Its disrupted-looking geology is a strong test of tidal heating, orbital resonance and resurfacing models.",
  },
  ariel: {
    composition: "A roughly mixed water-ice and rocky interior.",
    discovery: "William Lassell discovered Ariel in 1851.",
    scientificImportance:
      "Ariel’s young-looking valleys and resurfaced terrain may record relatively recent internal activity in the Uranian system.",
  },
  umbriel: {
    composition:
      "A mixture of water ice and dark rocky or carbon-rich material.",
    discovery: "William Lassell discovered Umbriel in 1851.",
    scientificImportance:
      "Its old, dark surface provides a baseline for comparing geological and space-weathering histories among Uranus’s moons.",
  },
  titania: {
    composition: "Approximately equal parts water ice and rocky material.",
    discovery: "William Herschel discovered Titania in 1787.",
    scientificImportance:
      "As Uranus’s largest moon, Titania is central to understanding differentiation, tectonics and possible oceans in ice-giant satellite systems.",
  },
  oberon: {
    composition: "A mixture of water ice and rocky material.",
    discovery: "William Herschel discovered Oberon in 1787.",
    scientificImportance:
      "Its old outer-system terrain preserves the long-term cratering and tectonic history of Uranus’s moons.",
  },
  triton: {
    composition:
      "A differentiated icy-rocky body with volatile nitrogen, methane and carbon monoxide at its surface.",
    discovery: "William Lassell discovered Triton in 1846.",
    scientificImportance:
      "Its retrograde orbit and active surface reveal the consequences of capturing a Kuiper Belt world into orbit around Neptune.",
  },
  charon: {
    composition: "A mixture of water ice and rocky material.",
    discovery: "James Christy discovered Charon in 1978.",
    scientificImportance:
      "The unusually large Pluto–Charon binary constrains giant-impact formation and the evolution of double-synchronous systems.",
  },
};
