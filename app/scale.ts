/** Presentation only. Never use these coordinates to calculate scientific facts. */
export type ScaleMode = "scientific" | "exploration";
export type VectorAU = readonly [number, number, number];
export const SCIENTIFIC_UNITS_PER_AU = 100;
// Camera-relative visibility budget, not a physical boundary on the universe.
export const MAX_RENDER_DISTANCE = 1_000_000;
export const STAR_RADIUS = 14_000;

export function projectPosition(
  p: VectorAU,
  mode: ScaleMode,
): [number, number, number] {
  if (!p.every(Number.isFinite))
    throw new RangeError("Position must contain finite AU values");
  if (mode === "scientific")
    return [
      p[0] * SCIENTIFIC_UNITS_PER_AU,
      p[1] * SCIENTIFIC_UNITS_PER_AU,
      p[2] * SCIENTIFIC_UNITS_PER_AU,
    ];
  const r = Math.hypot(...p);
  if (r === 0) return [0, 0, 0];
  // Continuous at the Sun; asymptotically retains the established outer-system look.
  const distance = 24 * -Math.expm1(-r / 0.05) + 38 * Math.log1p(r);
  return [(p[0] / r) * distance, (p[1] / r) * distance, (p[2] / r) * distance];
}

/** Parent-local separation avoids normalizing a satellite's heliocentric vector. */
export function projectSatellite(
  parent: VectorAU,
  offset: VectorAU,
  mode: ScaleMode,
  localUnitsPerAU: number,
): [number, number, number] {
  const center = projectPosition(parent, mode);
  const scale =
    mode === "scientific" ? SCIENTIFIC_UNITS_PER_AU : localUnitsPerAU;
  return [
    center[0] + offset[0] * scale,
    center[1] + offset[1] * scale,
    center[2] + offset[2] * scale,
  ];
}

/** Exploration-scale moon systems use a monotonic radial compression. Direction,
 * ordering and orbital phase are preserved; scientific mode remains linear. */
export function projectSatelliteSystem(
  parent: VectorAU,
  offset: VectorAU,
  mode: ScaleMode,
  outerRadius: number,
  maxOrbitAU: number,
): [number, number, number] {
  if (
    ![...parent, ...offset, outerRadius, maxOrbitAU].every(Number.isFinite) ||
    outerRadius <= 0 ||
    maxOrbitAU <= 0
  )
    throw new RangeError("Invalid satellite-system projection input");
  const center = projectPosition(parent, mode),
    distance = Math.hypot(...offset);
  if (distance === 0) return [...center];
  const rendered =
    mode === "scientific"
      ? distance * SCIENTIFIC_UNITS_PER_AU
      : outerRadius * Math.pow(distance / maxOrbitAU, 0.3);
  return [
    center[0] + (offset[0] / distance) * rendered,
    center[1] + (offset[1] / distance) * rendered,
    center[2] + (offset[2] / distance) * rendered,
  ];
}

export function displayRadius(
  radiusKm: number,
  isSun: boolean,
  mode: ScaleMode,
): number {
  return (
    (isSun ? 5 : Math.max(0.38, Math.sqrt(radiusKm / 6371) * 1.4)) *
    (mode === "scientific" ? 0.05 : 1)
  );
}

/** Convert the camera into a scientific coordinate for read-only distance estimates.
 * Scientific mode is globally linear. Exploration mode is anchored to the focused
 * body's physical radius because compressed parent-local/enlarged geometry has no
 * single global inverse.
 */
export function estimateSpacecraftPosition(
  camera: VectorAU,
  anchorModel: VectorAU,
  anchorVisual: VectorAU,
  anchorRadiusKm: number,
  anchorDisplayRadius: number,
  mode: ScaleMode,
  auKm: number,
): [number, number, number] {
  if (
    ![
      ...camera,
      ...anchorModel,
      ...anchorVisual,
      anchorRadiusKm,
      anchorDisplayRadius,
      auKm,
    ].every(Number.isFinite) ||
    anchorRadiusKm <= 0 ||
    anchorDisplayRadius <= 0 ||
    auKm <= 0
  )
    throw new RangeError("Invalid spacecraft projection input");
  if (mode === "scientific")
    return camera.map((value) => value / SCIENTIFIC_UNITS_PER_AU) as [
      number,
      number,
      number,
    ];
  const auPerUnit = anchorRadiusKm / auKm / anchorDisplayRadius;
  return camera.map(
    (value, index) =>
      anchorModel[index] + (value - anchorVisual[index]) * auPerUnit,
  ) as [number, number, number];
}

export function clippingRange(
  surfaceClearance: number,
  farthestExtent: number,
) {
  const near = Math.max(0.0001, Math.min(10, surfaceClearance * 0.02));
  const far = Math.max(
    STAR_RADIUS * 1.1,
    Math.min(MAX_RENDER_DISTANCE, farthestExtent * 1.1),
  );
  return { near, far };
}

/** Upload only an already selected, bounded active tile; never a whole catalogue.
 * Float64/JS subtraction MUST precede the Float32 write. Output is caller-owned.
 */
export function writeRelativePositions(
  absolute: Float64Array,
  origin: VectorAU,
  output: Float32Array,
): number {
  if (absolute.length % 3 || output.length < absolute.length)
    throw new RangeError("Invalid position buffer");
  for (let i = 0; i < absolute.length; i += 3) {
    output[i] = absolute[i] - origin[0];
    output[i + 1] = absolute[i + 1] - origin[1];
    output[i + 2] = absolute[i + 2] - origin[2];
  }
  return absolute.length / 3;
}
