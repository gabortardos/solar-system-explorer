import { getBody } from "./catalog";
import { AU_KM, DAY_MS, J2000_UTC_APPROX } from "./sources";
export type Vector3 = [number, number, number];
export type PositionResult =
  | {
      status: "available";
      value: Vector3;
      unit: "au";
      frame: "heliocentric-ecliptic-J2000";
      atUtcMs: number;
      model: string;
      sourceIds: string[];
      quality: "approximate" | "illustrative" | "coordinate-origin";
      accuracyNote: string;
      nominalError?: {
        longitudeArcsec: number;
        latitudeArcsec: number;
        distanceKm: number;
      };
    }
  | { status: "unavailable"; value: null; atUtcMs: number; reason: string };
export const MODEL_START = Date.UTC(1800, 0, 1);
export const MODEL_END = Date.UTC(2050, 0, 1); // exclusive: avoid implying unbounded validity
const unavailable = (time: number, reason: string): PositionResult => ({
  status: "unavailable",
  value: null,
  atUtcMs: time,
  reason,
});
const planetNominalErrors: Record<
  string,
  { longitudeArcsec: number; latitudeArcsec: number; distanceKm: number }
> = {
  mercury: { longitudeArcsec: 15, latitudeArcsec: 1, distanceKm: 1000 },
  venus: { longitudeArcsec: 20, latitudeArcsec: 1, distanceKm: 4000 },
  earth: { longitudeArcsec: 20, latitudeArcsec: 8, distanceKm: 6000 },
  mars: { longitudeArcsec: 40, latitudeArcsec: 2, distanceKm: 25000 },
  jupiter: { longitudeArcsec: 400, latitudeArcsec: 10, distanceKm: 600000 },
  saturn: { longitudeArcsec: 600, latitudeArcsec: 25, distanceKm: 1500000 },
  uranus: { longitudeArcsec: 50, latitudeArcsec: 2, distanceKm: 1000000 },
  neptune: { longitudeArcsec: 10, latitudeArcsec: 1, distanceKm: 200000 },
};

// Double precision ecliptic Cartesian AU, before any scene-axis or scale transform.
export function keplerCartesian(
  a: number,
  e: number,
  i: number,
  w: number,
  node: number,
  M: number,
): Vector3 {
  const rad = Math.PI / 180,
    I = i * rad,
    W = w * rad,
    N = node * rad,
    m = ((((M + 180) % 360) + 360) % 360) * rad - Math.PI;
  let E = m;
  for (let k = 0; k < 12; k++)
    E -= (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
  const x = a * (Math.cos(E) - e),
    y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return [
    (Math.cos(W) * Math.cos(N) - Math.sin(W) * Math.sin(N) * Math.cos(I)) * x +
      (-Math.sin(W) * Math.cos(N) - Math.cos(W) * Math.sin(N) * Math.cos(I)) *
        y,
    (Math.cos(W) * Math.sin(N) + Math.sin(W) * Math.cos(N) * Math.cos(I)) * x +
      (-Math.sin(W) * Math.sin(N) + Math.cos(W) * Math.cos(N) * Math.cos(I)) *
        y,
    Math.sin(W) * Math.sin(I) * x + Math.cos(W) * Math.sin(I) * y,
  ];
}
/** Convert coordinates expressed in a plane whose pole is given in ICRF
 * right ascension/declination into the J2000 ecliptic frame. JPL defines the
 * element node from the reference plane's ascending node on the ICRF equator. */
export function referencePlaneToEcliptic(
  vector: Vector3,
  pole: { ra: number; dec: number },
): Vector3 {
  const rad = Math.PI / 180,
    ra = pole.ra * rad,
    dec = pole.dec * rad;
  const normal: Vector3 = [
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec),
  ];
  const length = Math.hypot(normal[0], normal[1]);
  if (length < 1e-12)
    throw new RangeError("Reference-plane pole is too close to the ICRF pole.");
  const xAxis: Vector3 = [-normal[1] / length, normal[0] / length, 0];
  const yAxis: Vector3 = [
    normal[1] * xAxis[2] - normal[2] * xAxis[1],
    normal[2] * xAxis[0] - normal[0] * xAxis[2],
    normal[0] * xAxis[1] - normal[1] * xAxis[0],
  ];
  const equatorial: Vector3 = [0, 1, 2].map(
    (j) => vector[0] * xAxis[j] + vector[1] * yAxis[j] + vector[2] * normal[j],
  ) as Vector3;
  const obliquity = 23.439291111 * rad,
    c = Math.cos(obliquity),
    s = Math.sin(obliquity);
  return [
    equatorial[0],
    c * equatorial[1] + s * equatorial[2],
    -s * equatorial[1] + c * equatorial[2],
  ];
}
export function calculatePosition(
  id: string,
  time: number,
  anomalyRad?: number,
): PositionResult {
  const body = getBody(id);
  if (!body) return unavailable(time, `Unknown catalogue ID: ${id}`);
  if (!Number.isFinite(time) || time < MODEL_START || time >= MODEL_END)
    return unavailable(
      time,
      "Date outside the application model interval [1800, 2050), or invalid date.",
    );
  if (anomalyRad !== undefined && !Number.isFinite(anomalyRad))
    return unavailable(time, "Invalid orbit-sampling anomaly.");
  const base = {
    status: "available" as const,
    unit: "au" as const,
    frame: "heliocentric-ecliptic-J2000" as const,
    atUtcMs: time,
  };
  if (id === "sun")
    return {
      ...base,
      value: [0, 0, 0],
      model: "heliocentric-origin",
      sourceIds: [],
      quality: "coordinate-origin",
      accuracyNote:
        "The Sun defines this coordinate origin; not a barycentric solar trajectory.",
    };
  if (body.orbit.model === "jpl-table-1") {
    const t = (time - J2000_UTC_APPROX) / DAY_MS / 36525;
    const [initial, rates] = body.orbit.elements!;
    const [a, e, I, L, P, N] = initial.map((n, j) => n + t * rates[j]);
    return {
      ...base,
      value: keplerCartesian(
        a,
        e,
        I,
        P - N,
        N,
        anomalyRad === undefined ? L - P : (anomalyRad * 180) / Math.PI,
      ),
      model: "jpl-table-1",
      sourceIds: ["jpl-planets"],
      quality: "approximate",
      nominalError: planetNominalErrors[id],
      accuracyNote:
        "JPL 1800–2050 approximation; UTC substituted for TDB. Earth represents the Earth–Moon barycenter. Geometric simultaneous position, no light-time correction.",
    };
  }
  if (body.orbit.model === "satellite-mean-elements") {
    const parentId = body.parentId;
    if (!parentId)
      return unavailable(time, "Satellite record has no parent body.");
    const parent = calculatePosition(parentId, time);
    if (parent.status === "unavailable")
      return unavailable(
        time,
        `Parent ${getBody(parentId)?.name ?? parentId} position unavailable: ${parent.reason}`,
      );
    const o = body.orbit;
    const phase =
      anomalyRad === undefined
        ? o.meanAnomalyDeg.value! +
          ((time - J2000_UTC_APPROX) / DAY_MS / o.periodDays.value!) * 360
        : (anomalyRad * 180) / Math.PI;
    let relative = keplerCartesian(
      o.semimajorAxisKm.value! / AU_KM,
      o.eccentricity.value!,
      o.inclinationDeg.value!,
      o.argumentPeriapsisDeg.value!,
      o.nodeDeg.value!,
      phase,
    );
    if (o.frame === "local-Laplace" || o.frame === "parent-equatorial") {
      if (!o.referencePoleDeg)
        return unavailable(
          time,
          `No validated ICRF pole is stored for the ${o.frame} reference plane.`,
        );
      relative = referencePlaneToEcliptic(relative, o.referencePoleDeg);
    } else if (o.frame !== "parent-ecliptic")
      return unavailable(
        time,
        `Unsupported satellite reference frame: ${o.frame ?? "none"}.`,
      );
    const sourceIds = [
      ...new Set([
        ...parent.sourceIds,
        ...o.sourceIds,
        ...(o.referencePoleSourceIds ?? []),
      ]),
    ];
    return {
      ...base,
      value: relative.map((n, j) => n + parent.value[j]) as Vector3,
      model: "fixed-satellite-mean-ellipse",
      sourceIds,
      quality: "illustrative",
      accuracyNote:
        "Parent-centered J2000 mean ellipse propagated at a fixed period, transformed from its published reference plane and added to the approximate parent position. Nodal and apsidal precession, perturbations, light time and body orientation are omitted. No validated position-error bound; not an observing or navigation ephemeris.",
    };
  }
  return unavailable(
    time,
    "No validated positional element set imported for this body.",
  );
}
// Three.js y-up axes: ecliptic [X,Y,Z] -> scene [X,Z,-Y]. No scale change.
export function toSceneAxes([x, y, z]: Vector3): Vector3 {
  return [x, z, -y];
}
