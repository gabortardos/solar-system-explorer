import type { ScaleMode, VectorAU } from "./scale";
import { projectPosition } from "./scale";

export type PopulationId =
  | "asteroid-belt"
  | "kuiper-belt"
  | "jupiter-trojans-leading"
  | "jupiter-trojans-trailing";

export type PopulationSample = {
  id: PopulationId;
  positionsAU: Float64Array;
};

export const POPULATION_COUNTS: Record<PopulationId, number> = {
  "asteroid-belt": 420,
  "kuiper-belt": 520,
  "jupiter-trojans-leading": 80,
  "jupiter-trojans-trailing": 80,
};

function generator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function disk(
  id: PopulationId,
  count: number,
  innerAU: number,
  outerAU: number,
  inclinationDegrees: number,
  seed: number,
): PopulationSample {
  const random = generator(seed),
    positionsAU = new Float64Array(count * 3),
    inclination = (inclinationDegrees * Math.PI) / 180;
  for (let i = 0; i < count; i++) {
    // Area-weighted radius avoids implying that the displayed points are a
    // measured radial-density distribution.
    const radius = Math.sqrt(
        innerAU * innerAU + random() * (outerAU * outerAU - innerAU * innerAU),
      ),
      angle = random() * Math.PI * 2,
      vertical = (random() + random() + random() - 1.5) * inclination;
    const planarRadius = Math.cos(vertical) * radius;
    positionsAU[i * 3] = Math.cos(angle) * planarRadius;
    positionsAU[i * 3 + 1] = Math.sin(vertical) * radius;
    positionsAU[i * 3 + 2] = Math.sin(angle) * planarRadius;
  }
  return { id, positionsAU };
}

function trojans(id: PopulationId, centerRadians: number, seed: number) {
  const random = generator(seed),
    count = POPULATION_COUNTS[id],
    positionsAU = new Float64Array(count * 3);
  for (let i = 0; i < count; i++) {
    // A broad statistical cloud around L4/L5, intentionally not ephemerides.
    const radius = 4.75 + random() * 0.95,
      angle = centerRadians + (random() + random() - 1) * 0.42,
      vertical = (random() + random() - 1) * 0.15;
    const planarRadius = Math.cos(vertical) * radius;
    positionsAU[i * 3] = Math.cos(angle) * planarRadius;
    positionsAU[i * 3 + 1] = Math.sin(vertical) * radius;
    positionsAU[i * 3 + 2] = Math.sin(angle) * planarRadius;
  }
  return { id, positionsAU };
}

/** Deterministic representative markers. Counts are a rendering budget and
 * have no relationship to the true number of objects in each population. */
export function buildPopulationSamples(jupiterLongitude = 0): PopulationSample[] {
  return [
    disk(
      "asteroid-belt",
      POPULATION_COUNTS["asteroid-belt"],
      2.1,
      3.3,
      10,
      0xa57e10,
    ),
    disk(
      "kuiper-belt",
      POPULATION_COUNTS["kuiper-belt"],
      30,
      50,
      16,
      0xb3175,
    ),
    trojans(
      "jupiter-trojans-leading",
      jupiterLongitude + Math.PI / 3,
      0x14a4,
    ),
    trojans(
      "jupiter-trojans-trailing",
      jupiterLongitude - Math.PI / 3,
      0x15a5,
    ),
  ];
}

export function projectPopulation(
  positionsAU: Float64Array,
  mode: ScaleMode,
): Float64Array {
  const projected = new Float64Array(positionsAU.length);
  for (let i = 0; i < positionsAU.length; i += 3) {
    const point = projectPosition(
      [positionsAU[i], positionsAU[i + 1], positionsAU[i + 2]] as VectorAU,
      mode,
    );
    projected.set(point, i);
  }
  return projected;
}
