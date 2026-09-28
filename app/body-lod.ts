/** Screen-space detail policy; presentation distances are never scientific values. */
export type DetailLevel = 0 | 1 | 2;
export const CLOSE_APPROACH_BODIES = ['earth', 'moon', 'mars', 'jupiter', 'saturn', 'europa', 'titan', 'enceladus'] as const;
/** Identity maps use the same cache, with small bases and no terrain-level tiers. */
export const IDENTITY_BODIES = ['uranus', 'neptune', 'io', 'ganymede', 'callisto', 'mimas', 'tethys', 'dione', 'rhea', 'iapetus', 'miranda', 'ariel', 'umbriel', 'titania', 'oberon', 'triton', 'phobos', 'deimos'] as const;
export const DETAIL_BODIES = [...CLOSE_APPROACH_BODIES, ...IDENTITY_BODIES] as const;
export const isIdentityBody = (id: string) => IDENTITY_BODIES.some(body => body === id);
export type DetailBody = typeof DETAIL_BODIES[number];
export const DETAIL_POLICY = {
  desktopSlots: 2, mobileSlots: 1, fadeSeconds: 0.8,
  baseWidth: 512, mediumWidth: 1024, closeWidth: 4096, mobileCloseWidth: 2048,
} as const;
export function detailLevel(radiusPixels: number, previous: DetailLevel): DetailLevel {
  if (!Number.isFinite(radiusPixels) || radiusPixels < 0) return 0;
  if (radiusPixels >= (previous === 2 ? 165 : 220)) return 2;
  if (radiusPixels >= (previous > 0 ? 45 : 65)) return 1;
  return 0;
}
export function projectedRadius(radius: number, distance: number, fov: number, height: number) {
  return radius * height / (2 * Math.tan(fov * Math.PI / 360) * Math.sqrt(Math.max(radius * radius * 0.01, distance * distance - radius * radius)));
}
export function textureBytes(width: number, height = width / 2) {
  return Math.ceil(width * height * 4 * 4 / 3); // RGBA8 including mip chain
}
export function detailWidth(id: string, level: DetailLevel, mobile: boolean) {
  if (isIdentityBody(id)) return level === 0 ? 256 : 1024;
  const cap = mobile ? 2048 : 4096;
  return level === 0 ? 512 : level === 1 ? 1024 : cap;
}
export const ATMOSPHERES: Partial<Record<DetailBody, { color: string; extent: number; opacity: number }>> = {
  earth: { color: '#69b9ff', extent: 1.025, opacity: 0.48 },
  mars: { color: '#d99a74', extent: 1.012, opacity: 0.14 },
  jupiter: { color: '#e5d5bf', extent: 1.008, opacity: 0.12 },
  saturn: { color: '#e8d8ad', extent: 1.012, opacity: 0.17 },
  titan: { color: '#e8b45b', extent: 1.055, opacity: 0.65 },
  uranus: { color: '#b4e1e0', extent: 1.018, opacity: 0.24 },
  neptune: { color: '#a4d3df', extent: 1.014, opacity: 0.20 },
};
