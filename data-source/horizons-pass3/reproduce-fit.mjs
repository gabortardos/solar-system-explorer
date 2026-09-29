import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const AU_KM = 149_597_870.7;
const J2000_JD = 2_451_545.0;

const snapshots = {
  ceres: {
    a: 2.766496019994375,
    e: 0.07837562647163041,
    I: 10.58336045805628,
    O: 80.49435747295276,
    w: 73.92286274285223,
    M: 6.176654513180486,
    n: 0.2141948374796613,
  },
  pluto: {
    a: 39.57126152242962,
    e: 0.2494484952274253,
    I: 17.23565301572196,
    O: 110.03993995362,
    w: 115.178665976094,
    M: 14.14365453678677,
    n: 0.003959444244668256,
  },
};

function parseHorizons(name) {
  const file = path.join(root, `horizons-${name}-elements-1800-2050-1y.txt`);
  const rows = [];
  let inTable = false;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (line === "$$SOE") {
      inTable = true;
      continue;
    }
    if (line === "$$EOE") break;
    if (!inTable) continue;
    const p = line.split(",").map((value) => value.trim());
    rows.push({
      jd: Number(p[0]),
      calendar: p[1],
      e: Number(p[2]),
      I: Number(p[4]),
      O: Number(p[5]),
      w: Number(p[6]),
      M: Number(p[9]),
      a: Number(p[11]),
    });
  }
  return rows;
}

function nearestTurn(value, target) {
  return value + 360 * Math.round((target - value) / 360);
}

function unwrap(values) {
  const output = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    output.push(nearestTurn(values[i], output[i - 1]));
  }
  return output;
}

function linearFit(x, y) {
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
  const slope = x.reduce(
    (sum, value, i) => sum + (value - meanX) * (y[i] - meanY),
    0,
  ) / x.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  return [meanY - slope * meanX, slope];
}

function position({ a, e, I, O, w, M }) {
  const radians = Math.PI / 180;
  const inclination = I * radians;
  const node = O * radians;
  const periapsis = w * radians;
  const mean = (((M + 180) % 360) + 360) % 360 * radians - Math.PI;
  let eccentric = mean;
  for (let i = 0; i < 15; i += 1) {
    eccentric -= (eccentric - e * Math.sin(eccentric) - mean)
      / (1 - e * Math.cos(eccentric));
  }
  const x = a * (Math.cos(eccentric) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(eccentric);
  return [
    (Math.cos(periapsis) * Math.cos(node) - Math.sin(periapsis) * Math.sin(node) * Math.cos(inclination)) * x
      + (-Math.sin(periapsis) * Math.cos(node) - Math.cos(periapsis) * Math.sin(node) * Math.cos(inclination)) * y,
    (Math.cos(periapsis) * Math.sin(node) + Math.sin(periapsis) * Math.cos(node) * Math.cos(inclination)) * x
      + (-Math.sin(periapsis) * Math.sin(node) + Math.cos(periapsis) * Math.cos(node) * Math.cos(inclination)) * y,
    Math.sin(periapsis) * Math.sin(inclination) * x
      + Math.cos(periapsis) * Math.sin(inclination) * y,
  ];
}

function error(actual, model) {
  const distanceAu = Math.hypot(...actual.map((value, i) => value - model[i]));
  const actualRadius = Math.hypot(...actual);
  const modelRadius = Math.hypot(...model);
  const dot = actual.reduce((sum, value, i) => sum + value * model[i], 0);
  const angularDeg = Math.acos(Math.max(-1, Math.min(1, dot / actualRadius / modelRadius))) * 180 / Math.PI;
  return { distanceAu, angularDeg };
}

function summarize(errors) {
  const rms = (key) => Math.sqrt(errors.reduce((sum, item) => sum + item[key] ** 2, 0) / errors.length);
  return {
    maxDistanceAu: Math.max(...errors.map((item) => item.distanceAu)),
    rmsDistanceAu: rms("distanceAu"),
    maxDistanceMillionKm: Math.max(...errors.map((item) => item.distanceAu)) * AU_KM / 1e6,
    maxAngularDeg: Math.max(...errors.map((item) => item.angularDeg)),
    rmsAngularDeg: rms("angularDeg"),
  };
}

for (const name of ["ceres", "pluto"]) {
  const rows = parseHorizons(name);
  const centuries = rows.map((row) => (row.jd - J2000_JD) / 36_525);
  const series = {
    a: rows.map((row) => row.a),
    e: rows.map((row) => row.e),
    I: rows.map((row) => row.I),
    L: unwrap(rows.map((row) => row.O + row.w + row.M)),
    varpi: unwrap(rows.map((row) => row.O + row.w)),
    O: unwrap(rows.map((row) => row.O)),
  };
  const fit = Object.fromEntries(
    Object.entries(series).map(([key, values]) => [key, linearFit(centuries, values)]),
  );
  const fitErrors = [];
  const fixedErrors = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const t = centuries[i];
    const fitted = Object.fromEntries(
      Object.entries(fit).map(([key, [base, rate]]) => [key, base + rate * t]),
    );
    const actual = position(row);
    fitErrors.push(error(actual, position({
      a: fitted.a,
      e: fitted.e,
      I: fitted.I,
      O: fitted.O,
      w: fitted.varpi - fitted.O,
      M: fitted.L - fitted.varpi,
    })));
    const snapshot = snapshots[name];
    fixedErrors.push(error(actual, position({
      ...snapshot,
      M: snapshot.M + snapshot.n * (row.jd - J2000_JD),
    })));
  }
  const modulo360 = (value) => ((value % 360) + 360) % 360;
  const tupleKeys = ["a", "e", "I", "L", "varpi", "O"];
  console.log(JSON.stringify({
    body: name,
    rowCount: rows.length,
    firstEpochJdTdb: rows[0].jd,
    lastEpochJdTdb: rows.at(-1).jd,
    baseAtJ2000: tupleKeys.map((key) => key === "L" || key === "varpi" || key === "O" ? modulo360(fit[key][0]) : fit[key][0]),
    ratePerCentury: tupleKeys.map((key) => fit[key][1]),
    fitValidation: summarize(fitErrors),
    fixedJ2000Validation: summarize(fixedErrors),
  }, null, 2));
}
