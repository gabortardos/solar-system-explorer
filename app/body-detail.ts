import * as THREE from 'three';
import { DETAIL_BODIES, DETAIL_POLICY, detailLevel, detailWidth, isIdentityBody, projectedRadius, textureBytes, ATMOSPHERES, type DetailBody, type DetailLevel } from './body-lod';

type Uniform<T> = { value: T };
export type DetailLayer = { path: string; linear?: boolean; apply: (texture: THREE.Texture | null) => void; fade?: (amount: number) => void };
type Entry = {
  id: DetailBody; mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>; radius: number;
  base: THREE.Texture; baseReady: boolean; basePending: boolean;
  lowGeometry: THREE.SphereGeometry; detailGeometry?: THREE.SphereGeometry;
  level: DetailLevel; wanted: DetailLevel; width: number; mix: Uniform<number>; map: Uniform<THREE.Texture>;
  texture?: THREE.Texture; pending?: AbortController; layers: DetailLayer[]; layerTextures: THREE.Texture[];
  error: boolean; pixels: number;
};
type TextureFetcher = (path: string, signal: AbortSignal, linear?: boolean) => Promise<THREE.Texture>;

/** Abortable local assets only. No imagery requests to external sites at runtime. */
export async function fetchDetailTexture(path: string, signal: AbortSignal, linear = false) {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error('Surface map unavailable');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const texture = new THREE.Texture(image);
    texture.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  } finally { URL.revokeObjectURL(url); }
}

/** At most two desktop / one mobile detail bundles, including in-flight loads.
 * A bundle fades back to its small base before release or tier replacement.
 * No second high-resolution copy is kept during a tier change.
 */
export class BodyDetailManager {
  private entries: Entry[] = [];
  private disposed = false;
  private baseControllers = new Set<AbortController>();
  private frustum = new THREE.Frustum();
  private projection = new THREE.Matrix4();
  private center = new THREE.Vector3();
  private sphere = new THREE.Sphere();
  private elapsed = 1;
  constructor(private mobile: boolean, private software: boolean, private anisotropy: number, private fetchTexture: TextureFetcher = fetchDetailTexture) {}

  register(id: string, mesh: THREE.Mesh, radius: number, layers: DetailLayer[] = []) {
    if (!DETAIL_BODIES.includes(id as DetailBody)) return;
    const surface = mesh as Entry['mesh'];
    const color = surface.material.color.clone().convertLinearToSRGB();
    const base = new THREE.DataTexture(new Uint8Array([color.r * 255, color.g * 255, color.b * 255, 255]), 1, 1);
    base.colorSpace = THREE.SRGBColorSpace; base.needsUpdate = true;
    surface.material.map = base; surface.material.color.set('white');
    const entry: Entry = { id: id as DetailBody, mesh: surface, radius, base, baseReady: id === 'titan', basePending: false, lowGeometry: surface.geometry, level: 0, wanted: 0, width: 0, mix: { value: 0 }, map: { value: base }, layers, layerTextures: [], error: false, pixels: 0 };
    if (!this.software) {
      surface.material.onBeforeCompile = shader => {
        shader.uniforms.closeMap = entry.map; shader.uniforms.closeMix = entry.mix;
        shader.fragmentShader = 'uniform sampler2D closeMap;\nuniform float closeMix;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
          #ifdef USE_MAP
            vec4 sampledDiffuseColor = mix(texture2D(map, vMapUv), texture2D(closeMap, vMapUv), closeMix);
            diffuseColor *= sampledDiffuseColor;
          #endif
        `);
      };
      surface.material.customProgramCacheKey = () => 'body-detail-v1';
    } else {
      surface.userData.detailMap = entry.map;
      surface.userData.detailMix = entry.mix;
    }
    this.entries.push(entry);
  }

  /**
   * Keeps a conventional surface map visible while the bounded local-detail
   * stream is unavailable. The streamer may still replace this fallback with
   * its compact base tier once it has decoded successfully.
   */
  setBaseFallback(id: string, texture: THREE.Texture) {
    const entry = this.entries.find(candidate => candidate.id === id);
    if (!entry || entry.baseReady || this.disposed) return false;
    const old = entry.base;
    entry.base = texture;
    entry.mesh.material.map = texture;
    entry.map.value = texture;
    old.dispose();
    return true;
  }

  private base(entry: Entry) {
    if (entry.baseReady || entry.basePending || this.disposed) return;
    entry.basePending = true;
    const controller = new AbortController(); this.baseControllers.add(controller);
    void this.fetchTexture(`/textures/detail/${entry.id}-${detailWidth(entry.id, 0, this.mobile)}.webp`, controller.signal).then(texture => {
      if (this.disposed) { texture.dispose(); return; }
      texture.anisotropy = this.anisotropy;
      const old = entry.base; entry.base = texture; entry.baseReady = true;
      entry.mesh.material.map = texture; entry.map.value = texture; old.dispose();
    }).catch(() => { entry.error = true; /* Keep the catalog color; no automatic retry loop. */ })
      .finally(() => this.baseControllers.delete(controller));
  }

  private release(entry: Entry) {
    entry.pending?.abort(); entry.pending = undefined;
    entry.mesh.material.map = entry.base; entry.map.value = entry.base; entry.mix.value = 0;
    for (const layer of entry.layers) layer.apply(null);
    entry.layerTextures.forEach(texture => texture.dispose()); entry.layerTextures = [];
    entry.texture?.dispose(); entry.texture = undefined;
    entry.mesh.geometry = entry.lowGeometry;
    entry.detailGeometry?.dispose(); entry.detailGeometry = undefined;
    entry.level = 0; entry.width = 0;
  }

  private async load(entry: Entry) {
    const level = entry.wanted, width = detailWidth(entry.id, level, this.mobile || this.software);
    const controller = new AbortController(); entry.pending = controller; entry.width = width;
    const loaded: THREE.Texture[] = [];
    try {
      // Titan stays an opaque atmospheric globe; do not invent a visible surface.
      if (entry.id !== 'titan') loaded.push(await this.fetchTexture(`/textures/detail/${entry.id}-${width}.webp`, controller.signal));
      for (const layer of entry.layers) loaded.push(await this.fetchTexture(layer.path, controller.signal, layer.linear));
      if (this.disposed || controller.signal.aborted || entry.pending !== controller) { loaded.forEach(t => t.dispose()); return; }
      for (const texture of loaded) texture.anisotropy = this.anisotropy;
      entry.texture = entry.id === 'titan' ? undefined : loaded.shift();
      entry.layerTextures = loaded;
      entry.layers.forEach((layer, index) => layer.apply(loaded[index]));
      entry.map.value = entry.texture ?? entry.base;
      const segments = this.mobile || this.software || isIdentityBody(entry.id) ? 64 : level === 2 ? 128 : 96;
      entry.detailGeometry = new THREE.SphereGeometry(entry.radius, segments, segments / 2);
      entry.mesh.geometry = entry.detailGeometry;
      entry.level = level;
    } catch {
      loaded.forEach(texture => texture.dispose());
      if (entry.pending === controller) {
        if (!controller.signal.aborted) entry.error = true;
        entry.width = 0;
      }
    } finally { if (entry.pending === controller) entry.pending = undefined; }
  }

  update(camera: THREE.PerspectiveCamera, height: number, dt: number, focused?: string) {
    if (this.disposed) return;
    this.elapsed += dt;
    if (this.elapsed >= 0.15) {
      this.elapsed = 0;
      this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projection);
      for (const entry of this.entries) {
        entry.mesh.getWorldPosition(this.center);
        this.sphere.set(this.center, entry.radius);
        const visible = entry.mesh.parent?.visible && this.frustum.intersectsSphere(this.sphere);
        entry.pixels = visible ? projectedRadius(entry.radius, camera.position.distanceTo(this.center), camera.fov, height) : 0;
        entry.wanted = detailLevel(entry.pixels, entry.wanted);
        // One identity tier: crossing the close threshold must not reload the same map.
        if (isIdentityBody(entry.id) && entry.wanted === 2) entry.wanted = 1;
        if (entry.pixels > 3) this.base(entry);
      }
      const candidates = this.entries.filter(e => e.wanted > 0 && !e.error).sort((a, b) =>
        Number(b.id === focused) - Number(a.id === focused) || b.pixels - a.pixels);
      const slots = this.mobile || this.software ? DETAIL_POLICY.mobileSlots : DETAIL_POLICY.desktopSlots;
      const selected = new Set(candidates.slice(0, slots));
      for (const entry of this.entries) if (!selected.has(entry)) entry.wanted = 0;
    }
    for (const entry of this.entries) {
      const correct = entry.level === entry.wanted && entry.wanted > 0;
      const direction = correct ? 1 : -1;
      entry.mix.value = THREE.MathUtils.clamp(entry.mix.value + direction * dt / DETAIL_POLICY.fadeSeconds, 0, 1);
      entry.layers.forEach(layer => layer.fade?.(entry.mix.value));
      const obsoleteLoad = entry.pending && (!entry.wanted || entry.width !== detailWidth(entry.id, entry.wanted, this.mobile || this.software));
      if (!correct && entry.mix.value === 0 && (entry.level || obsoleteLoad)) this.release(entry);
    }
    const slots = this.mobile || this.software ? DETAIL_POLICY.mobileSlots : DETAIL_POLICY.desktopSlots;
    let occupied = this.entries.filter(e => e.level || e.pending).length;
    for (const entry of [...this.entries].sort((a, b) => b.pixels - a.pixels)) {
      if (occupied >= slots) break;
      if (entry.wanted && entry.baseReady && !entry.level && !entry.pending && !entry.error) {
        occupied++; void this.load(entry);
      }
    }
  }

  diagnostics() {
    return {
      renderer: this.software ? 'compatibility' : 'webgl',
      slots: this.mobile || this.software ? 1 : 2,
      // Conservative allocated/reserved RGBA+mip estimate, not a GPU measurement.
      estimatedTextureBytes: this.entries.reduce((sum, e) => sum + (e.baseReady ? textureBytes(e.id === 'titan' ? 1 : detailWidth(e.id, 0, this.mobile)) : 4) + (e.width && e.id !== 'titan' ? textureBytes(e.width) : 0) + e.layerTextures.reduce((s, t) => { const image = t.image as { width: number; height: number }; return s + textureBytes(image.width, image.height); }, 0), 0),
      bodies: this.entries.map(e => ({ id: e.id, level: e.level, wanted: e.wanted, pixels: Math.round(e.pixels), loading: !!e.pending, failed: e.error })),
    };
  }

  dispose() {
    this.disposed = true;
    this.baseControllers.forEach(controller => controller.abort()); this.baseControllers.clear();
    for (const entry of this.entries) { this.release(entry); entry.base.dispose(); }
  }
}

export function createAtmosphere(id: string, radius: number, sunPosition: THREE.Vector3) {
  const profile = ATMOSPHERES[id as DetailBody];
  if (!profile) return null;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * profile.extent, 64, 40), new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(profile.color) }, strength: { value: profile.opacity }, limbWidth: { value: Math.sqrt(1 - 1 / (profile.extent * profile.extent)) }, sunPosition: { value: sunPosition } },
    vertexShader: 'varying vec3 n;varying vec3 v;varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;n=normalize(mat3(modelMatrix)*normal);v=normalize(cameraPosition-wp);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 n;varying vec3 v;varying vec3 wp;uniform vec3 tint;uniform float strength;uniform float limbWidth;uniform vec3 sunPosition;void main(){float rim=smoothstep(0.,limbWidth,abs(dot(normalize(n),normalize(v))));float day=smoothstep(-.18,.3,dot(normalize(n),normalize(sunPosition-wp)));gl_FragColor=vec4(tint,rim*strength*(.02+.98*day));}',
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  mesh.name = `${id}-atmosphere`;
  return mesh;
}
