import { getBody } from "./data/catalog";
import { education } from "./data/education";
import { presentation } from "./body-presentation";
import { calculatePosition, toSceneAxes } from "./data/positions";
import { calculateDistance } from "./data/dynamic";
import { AU_KM, J2000_UTC_APPROX } from "./data/sources";
import type { Quantity } from "./data/schema";
export const AU = AU_KM;
export const EPOCH = J2000_UTC_APPROX;
// Compatibility view for the ten existing scene destinations; canonical science is app/data.
export type Body = {
  id: string;
  name: string;
  kind: string;
  category: "star" | "planet" | "dwarf-planet" | "moon";
  parentId: string | null;
  radius: number;
  gravity: number;
  day: number | null;
  year: number | null;
  semimajorAxisAU: number | null;
  color: string;
  texture: string | null;
  description: string;
  fact: string;
  atmosphere: string;
  source: string;
  elements?: number[][];
};
function required(field: Quantity, id: string) {
  if (field.value === null) throw new Error(`${id}: ${field.missingReason}`);
  return field.value;
}
export const bodies: Body[] = Object.entries(presentation).map(
  ([id, visual]) => {
    const science = getBody(id)!;
    const copy = education[id];
    if (!copy) throw new Error(`${id}: no educational profile`);
    return {
      id,
      ...visual,
      ...copy,
      category: science.category as Body["category"],
      parentId: science.parentId,
      radius: required(science.physical.radiusKm, id),
      gravity: required(science.physical.gravityMS2, id),
      day: science.physical.rotationHours.value,
      year:
        science.orbit.periodDays.value === null
          ? null
          : science.orbit.periodDays.value / 365.25,
      semimajorAxisAU:
        science.orbit.semimajorAxisKm.value === null
          ? null
          : science.orbit.semimajorAxisKm.value / AU,
      elements: science.orbit.elements,
    };
  },
);
const primaryIds = new Set([
  "sun",
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
]);
export const primaryBodies = bodies.filter((body) => primaryIds.has(body.id));
export function position(
  body: Body,
  time: number,
  anomaly?: number,
): [number, number, number] {
  const result = calculatePosition(body.id, time, anomaly);
  if (result.status === "unavailable") throw new RangeError(result.reason);
  return toSceneAxes(result.value);
}
export function distance(a: Body, b: Body, time: number) {
  const result = calculateDistance(a.id, b.id, time);
  if (result.status === "unavailable") throw new RangeError(result.reason);
  return result.value;
}
export function formatKm(km: number) {
  return !Number.isFinite(km)
    ? "Unavailable"
    : km < 1e6
      ? Math.round(km).toLocaleString() + " km"
      : (km / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }) +
        " million km";
}
