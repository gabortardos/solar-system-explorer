import { planetElements } from "./planet-elements";
import { planetPhysicalRows } from "./physical";
import { missing, quantity as q, type Quantity } from "./schema";

export type OrbitRecord = {
  parentId: string | null;
  model: "jpl-table-1" | "horizons-linear-fit-1800-2050" | "satellite-mean-elements" | "not-imported" | "origin";
  epoch: { jd: number; timeScale: "TDB" } | null;
  frame:
    | "ecliptic-J2000"
    | "parent-ecliptic"
    | "parent-equatorial"
    | "local-Laplace"
    | null;
  periodDays: Quantity;
  semimajorAxisKm: Quantity;
  eccentricity: Quantity;
  inclinationDeg: Quantity;
  argumentPeriapsisDeg: Quantity;
  meanAnomalyDeg: Quantity;
  nodeDeg: Quantity;
  sourceIds: string[];
  reference: string;
  // Table 1 only: a(au), e, I,L,varpi,node(deg), then per-century rates.
  elements?: number[][];
  referencePoleDeg?: { ra: number; dec: number };
  referencePoleSourceIds?: string[];
};
const absent = (parentId: string | null): OrbitRecord => ({
  parentId,
  model: parentId ? "not-imported" : "origin",
  epoch: null,
  frame: null,
  periodDays: missing(
    "d",
    parentId
      ? "Period not imported."
      : "Heliocentric orbital period does not apply to the Sun.",
  ),
  semimajorAxisKm: missing("km", "No imported element set."),
  eccentricity: missing("1", "No imported element set."),
  inclinationDeg: missing("deg", "No imported element set."),
  argumentPeriapsisDeg: missing("deg", "No imported element set."),
  meanAnomalyDeg: missing("deg", "No imported element set."),
  nodeDeg: missing("deg", "No imported element set."),
  sourceIds: [],
  reference: "",
});
export const orbits: Record<string, OrbitRecord> = { sun: absent(null) };
for (const [id, , , , , , year] of planetPhysicalRows) {
  const elements = planetElements[id];
  const orbit = absent("sun");
  orbit.periodDays = q(
    year * 365.25,
    "d",
    "jpl-physical",
    `${id}: sidereal orbital period, ref ${id === "ceres" ? "Q" : "B"}`,
    null,
    "reference",
    "Converted from source years using 365.25 days/year.",
  );
  orbit.sourceIds = ["jpl-physical"];
  if (elements) {
    const [a, e, I, L, P, N] = elements[0];
    Object.assign(orbit, {
      model: "jpl-table-1",
      epoch: { jd: 2451545, timeScale: "TDB" },
      frame: "ecliptic-J2000",
      elements,
      sourceIds: ["jpl-planets", "jpl-physical"],
      reference: `Table 1: ${id === "earth" ? "EM Bary" : id}`,
    });
    orbit.semimajorAxisKm = q(
      a * 149597870.7,
      "km",
      "jpl-planets",
      orbit.reference,
      null,
      "approximate",
      "Epoch value; varies with the published secular rate.",
    );
    orbit.eccentricity = q(
      e,
      "1",
      "jpl-planets",
      orbit.reference,
      null,
      "approximate",
    );
    orbit.inclinationDeg = q(
      I,
      "deg",
      "jpl-planets",
      orbit.reference,
      null,
      "approximate",
    );
    orbit.argumentPeriapsisDeg = q(
      P - N,
      "deg",
      "jpl-planets",
      orbit.reference,
      null,
      "derived",
      "Longitude of perihelion minus node at epoch.",
    );
    orbit.meanAnomalyDeg = q(
      L - P,
      "deg",
      "jpl-planets",
      orbit.reference,
      null,
      "derived",
      "Mean longitude minus longitude of perihelion at epoch.",
    );
    orbit.nodeDeg = q(
      N,
      "deg",
      "jpl-planets",
      orbit.reference,
      null,
      "approximate",
    );
  }
  orbits[id] = orbit;
}

// JPL Horizons geometric heliocentric osculating elements at J2000 TDB.
// Storage matches the JPL Table 1 tuple: a(au), e, I, L, varpi, node,
// followed by per-Julian-century rates. Only mean longitude advances in this
// deliberately bounded two-body visualization; this is not a live ephemeris.
const horizonsRows: Record<string, { initial: number[]; fit: number[]; rates: number[]; period: number; reference: string }> = {
  ceres: {
    initial: [2.766496019994375, 0.07837562647163041, 10.58336045805628, 160.5938747289855, 154.417220215805, 80.49435747295276],
    fit: [2.767093330640196, 0.07780958083579775, 10.595362950834687, 160.79660603385, 153.1364636879727, 80.55973024004254],
    rates: [0.00002740697218683614, -0.00044031266624446394, -0.01657097038089709, 7819.531083123371, 1.7711037809224706, -1.4910977408267387],
    period: 1680.712776442072,
    reference: "Horizons target 1; center 500@10; epoch JD 2451545.0 TDB",
  },
  pluto: {
    initial: [39.57126152242962, 0.2494484952274253, 17.23565301572196, 239.36226046650074, 225.218605929714, 110.03993995362],
    fit: [39.561019386876936, 0.2497730196720672, 17.140965673810655, 238.9365497650023, 224.07066992374308, 110.31143552118756],
    rates: [0.024787038942038774, 0.0010145711760755694, 0.002405285993980041, 145.22227259521634, -0.04687464122582008, -0.003635126059502941],
    period: 90921.85108674582,
    reference: "Horizons target 999; center 500@10; epoch JD 2451545.0 TDB",
  },
};
for (const [id, row] of Object.entries(horizonsRows)) {
  const [a, e, I, L, P, N] = row.initial;
  const field = (value: number, unit: Quantity["unit"], column: string, quality: "approximate" | "derived" = "approximate") =>
    q(value, unit, "jpl-horizons-elements", `${row.reference}; ${column}`, null, quality,
      "J2000 osculating value; fixed two-body propagation omits perturbations.");
  orbits[id] = {
    parentId: "sun",
    model: "horizons-linear-fit-1800-2050",
    epoch: { jd: 2451545, timeScale: "TDB" },
    frame: "ecliptic-J2000",
    periodDays: field(row.period, "d", "PR"),
    semimajorAxisKm: field(a * 149597870.7, "km", "A"),
    eccentricity: field(e, "1", "EC"),
    inclinationDeg: field(I, "deg", "IN"),
    argumentPeriapsisDeg: field(P - N, "deg", "W", "derived"),
    meanAnomalyDeg: field(L - P, "deg", "MA", "derived"),
    nodeDeg: field(N, "deg", "OM"),
    sourceIds: ["jpl-horizons-elements"],
    reference: `${row.reference}; annual Horizons OLS fit 1800–2050`,
    elements: [row.fit, row.rates],
  };
}

// JPL mean-element snapshot at JD2451545 TDB. id,parent,frame,ephemeris,
// a(km),e,omega,M,i,node(deg),P(days), optional Laplace-pole RA/Dec(deg).
// These rounded element sets describe mean ellipses, not precision ephemerides.
const rows: [
  string,
  string,
  OrbitRecord["frame"],
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number?,
  number?,
][] = [
  [
    "moon",
    "earth",
    "parent-ecliptic",
    "DE405/LE405",
    384400,
    0.0554,
    318.15,
    135.27,
    5.16,
    125.08,
    27.322,
  ],
  [
    "phobos",
    "mars",
    "local-Laplace",
    "MAR099",
    9375,
    0.015,
    216.3,
    189.7,
    1.1,
    169.2,
    0.3187,
    317.7,
    52.9,
  ],
  [
    "deimos",
    "mars",
    "local-Laplace",
    "MAR099",
    23457,
    0,
    0,
    205,
    1.8,
    54.3,
    1.2625,
    316.6,
    53.5,
  ],
  [
    "io",
    "jupiter",
    "local-Laplace",
    "JUP365",
    421800,
    0.004,
    49.1,
    330.9,
    0,
    0,
    1.762732,
    268.1,
    64.5,
  ],
  [
    "europa",
    "jupiter",
    "local-Laplace",
    "JUP365",
    671100,
    0.009,
    45,
    345.4,
    0.5,
    184,
    3.525463,
    268.1,
    64.5,
  ],
  [
    "ganymede",
    "jupiter",
    "local-Laplace",
    "JUP365",
    1070400,
    0.001,
    198.3,
    324.8,
    0.2,
    58.5,
    7.155588,
    268.2,
    64.6,
  ],
  [
    "callisto",
    "jupiter",
    "local-Laplace",
    "JUP365",
    1882700,
    0.007,
    43.8,
    87.4,
    0.3,
    309.1,
    16.69044,
    268.7,
    64.8,
  ],
  [
    "mimas",
    "saturn",
    "local-Laplace",
    "SAT441",
    186000,
    0.02,
    160.4,
    275.3,
    1.6,
    66.2,
    0.942422,
    40.6,
    83.5,
  ],
  [
    "enceladus",
    "saturn",
    "local-Laplace",
    "SAT441",
    238400,
    0.005,
    119.5,
    57,
    0,
    0,
    1.370218,
    40.6,
    83.5,
  ],
  [
    "tethys",
    "saturn",
    "local-Laplace",
    "SAT441",
    295000,
    0.001,
    335.3,
    0,
    1.1,
    273,
    1.887802,
    40.6,
    83.5,
  ],
  [
    "dione",
    "saturn",
    "local-Laplace",
    "SAT441",
    377700,
    0.002,
    116,
    212,
    0,
    0,
    2.736916,
    40.6,
    83.5,
  ],
  [
    "rhea",
    "saturn",
    "local-Laplace",
    "SAT441",
    527200,
    0.001,
    44.3,
    31.5,
    0.3,
    133.7,
    4.517503,
    40.6,
    83.5,
  ],
  [
    "titan",
    "saturn",
    "local-Laplace",
    "SAT441",
    1221900,
    0.029,
    78.3,
    11.7,
    0.3,
    78.6,
    15.945448,
    36.4,
    84,
  ],
  [
    "iapetus",
    "saturn",
    "local-Laplace",
    "SAT441",
    3561700,
    0.028,
    254.5,
    74.8,
    7.6,
    86.5,
    79.331002,
    288.7,
    78.9,
  ],
  [
    "ariel",
    "uranus",
    "parent-equatorial",
    "URA182",
    190929,
    0.001,
    9.6,
    193.5,
    0,
    0,
    2.520379,
  ],
  [
    "umbriel",
    "uranus",
    "parent-equatorial",
    "URA182",
    265986,
    0.004,
    183.4,
    253,
    0.1,
    174.8,
    4.144177,
  ],
  [
    "titania",
    "uranus",
    "parent-equatorial",
    "URA182",
    436298,
    0.002,
    184,
    68.1,
    0.1,
    29.5,
    8.705869,
  ],
  [
    "oberon",
    "uranus",
    "parent-equatorial",
    "URA182",
    583511,
    0.002,
    132.2,
    143.6,
    0.1,
    76.8,
    13.463237,
  ],
  [
    "miranda",
    "uranus",
    "parent-equatorial",
    "URA182",
    129846,
    0.001,
    154.8,
    73,
    4.4,
    100.9,
    1.413479,
  ],
  [
    "triton",
    "neptune",
    "local-Laplace",
    "NEP097",
    354800,
    0,
    0,
    63,
    157.3,
    178.1,
    5.876994,
    299.8,
    43.1,
  ],
  [
    "charon",
    "pluto",
    "parent-equatorial",
    "PLU060",
    19600,
    0,
    0,
    304.1,
    0,
    0,
    6.387222,
  ],
];
for (const [
  id,
  parentId,
  frame,
  reference,
  a,
  e,
  w,
  M,
  i,
  N,
  P,
  ra,
  dec,
] of rows) {
  const field = (value: number, unit: Quantity["unit"], column: string) =>
    q(
      value,
      unit,
      "jpl-sat-elements",
      `${id}: ${reference}, ${column}`,
      null,
      "approximate",
      "Rounded mean elements at epoch.",
    );
  orbits[id] = {
    parentId,
    model: "satellite-mean-elements",
    epoch: { jd: 2451545, timeScale: "TDB" },
    frame,
    reference,
    sourceIds: ["jpl-sat-elements"],
    semimajorAxisKm: field(a, "km", "a"),
    eccentricity: field(e, "1", "e"),
    inclinationDeg: field(i, "deg", "i"),
    argumentPeriapsisDeg: field(w, "deg", "omega"),
    meanAnomalyDeg: field(M, "deg", "M"),
    nodeDeg: field(N, "deg", "node"),
    periodDays: field(P, "d", "P"),
    ...(ra !== undefined && dec !== undefined
      ? {
          referencePoleDeg: { ra, dec },
          referencePoleSourceIds: ["jpl-sat-elements"],
        }
      : {}),
  };
}
// JPL's Uranian elements are referred to Uranus's equator. The IAU/NAIF pole
// supplies that plane in ICRF coordinates; it does not turn these means into an ephemeris.
for (const id of ["miranda", "ariel", "umbriel", "titania", "oberon"]) {
  orbits[id].referencePoleDeg = { ra: 257.311, dec: -15.175 };
  orbits[id].referencePoleSourceIds = ["naif-pck"];
  orbits[id].sourceIds.push("naif-pck");
}
// Charon's published elements are referred to Pluto's equator.
orbits.charon.referencePoleDeg = { ra: 132.993, dec: -6.163 };
orbits.charon.referencePoleSourceIds = ["naif-pck"];
orbits.charon.sourceIds.push("naif-pck");
