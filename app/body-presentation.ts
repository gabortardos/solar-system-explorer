// Render adapter metadata only. Never use this file for scientific measurements.
export type BodyPresentation={name:string;kind:string;color:string;texture:string|null};
export const presentation:Record<string,BodyPresentation> = {
  "sun": {
    "name": "Sun",
    "kind": "Star",
    "color": "#ffcf78",
    "texture": "sun"
  },
  "mercury": {
    "name": "Mercury",
    "kind": "Terrestrial planet",
    "color": "#b9b4ab",
    "texture": "mercury"
  },
  "venus": {
    "name": "Venus",
    "kind": "Terrestrial planet",
    "color": "#e6c595",
    "texture": "venus_atmosphere"
  },
  "earth": {
    "name": "Earth",
    "kind": "Terrestrial planet",
    "color": "#7ec9e9",
    "texture": "earth_daymap"
  },
  "moon": {
    "name": "Moon",
    "kind": "Moon of Earth",
    "color": "#d0d2d6",
    "texture": "moon"
  },
  "mars": {
    "name": "Mars",
    "kind": "Terrestrial planet",
    "color": "#d88e69",
    "texture": "mars"
  },
  "jupiter": {
    "name": "Jupiter",
    "kind": "Gas giant",
    "color": "#d9b59b",
    "texture": "jupiter"
  },
  "saturn": {
    "name": "Saturn",
    "kind": "Gas giant",
    "color": "#e9cfa0",
    "texture": "saturn"
  },
  "uranus": {
    "name": "Uranus",
    "kind": "Ice giant",
    "color": "#b4e1e0",
    "texture": "uranus"
  },
  "neptune": {
    "name": "Neptune",
    "kind": "Ice giant",
    "color": "#739add",
    "texture": "neptune"
  },
  "phobos":{"name":"Phobos","kind":"Moon of Mars","color":"#978b7f","texture":null},
  "deimos":{"name":"Deimos","kind":"Moon of Mars","color":"#aaa093","texture":null},
  "io":{"name":"Io","kind":"Moon of Jupiter","color":"#e3c55f","texture":null},
  "europa":{"name":"Europa","kind":"Moon of Jupiter","color":"#c8b18e","texture":null},
  "ganymede":{"name":"Ganymede","kind":"Moon of Jupiter","color":"#95877b","texture":null},
  "callisto":{"name":"Callisto","kind":"Moon of Jupiter","color":"#70665e","texture":null},
  "mimas":{"name":"Mimas","kind":"Moon of Saturn","color":"#c8cbca","texture":null},
  "enceladus":{"name":"Enceladus","kind":"Moon of Saturn","color":"#d8edf2","texture":null},
  "tethys":{"name":"Tethys","kind":"Moon of Saturn","color":"#c6d3d9","texture":null},
  "dione":{"name":"Dione","kind":"Moon of Saturn","color":"#b6c3c7","texture":null},
  "rhea":{"name":"Rhea","kind":"Moon of Saturn","color":"#a7a7a3","texture":null},
  "titan":{"name":"Titan","kind":"Moon of Saturn","color":"#d3a35b","texture":null},
  "iapetus":{"name":"Iapetus","kind":"Moon of Saturn","color":"#8c7e72","texture":null},
  "miranda":{"name":"Miranda","kind":"Moon of Uranus","color":"#aaaeaa","texture":null},
  "ariel":{"name":"Ariel","kind":"Moon of Uranus","color":"#c2d1d2","texture":null},
  "umbriel":{"name":"Umbriel","kind":"Moon of Uranus","color":"#707576","texture":null},
  "titania":{"name":"Titania","kind":"Moon of Uranus","color":"#9da7a5","texture":null},
  "oberon":{"name":"Oberon","kind":"Moon of Uranus","color":"#817a75","texture":null},
  "triton":{"name":"Triton","kind":"Moon of Neptune","color":"#c6a9b0","texture":null}
};
