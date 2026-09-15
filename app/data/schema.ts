// Scientific records never contain colors, meshes, or compressed coordinates.
export type Quality = 'reference' | 'nominal' | 'approximate' | 'derived';
export type Quantity = {
  value: number | null;
  unit: 'km' | 'kg' | 'km3/s2' | 'm/s2' | 'h' | 'd' | 'au' | 'deg' | '1';
  sourceIds: string[];
  reference: string;
  quality: Quality;
  uncertainty: number | null; // same unit; null means not supplied, never zero error
  note: string;
  missingReason?: string;
};
export function quantity(value: number, unit: Quantity['unit'], sourceId: string, reference: string,
  uncertainty: number | null = null, quality: Quality = 'reference', note = ''): Quantity {
  return {value, unit, sourceIds:[sourceId], reference, quality, uncertainty, note};
}
export function missing(unit: Quantity['unit'], reason: string): Quantity {
  return {value:null, unit, sourceIds:[], reference:'', quality:'reference', uncertainty:null, note:'', missingReason:reason};
}
export type PhysicalProperties = {
  radiusKm: Quantity;
  massKg: Quantity;
  gmKm3S2: Quantity;
  gravityMS2: Quantity;
  rotationHours: Quantity;
};
export type ObjectCategory='star'|'planet'|'moon'|'dwarf-planet'|'asteroid'|'comet'|'spacecraft';
export type Identity = {id:string; name:string; aliases:readonly string[]; category:ObjectCategory; parentId:string|null};
export type EducationalEntry = {description:string; fact:string; atmosphere:string; source:string; reviewStatus:'legacy-curated'|'source-reviewed'; reviewedAt:string|null};
