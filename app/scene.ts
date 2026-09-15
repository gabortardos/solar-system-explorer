import * as THREE from "three";
import { SoftwareRenderer } from "./software-renderer";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bodies, position, Body, AU } from "./astronomy";
import {
  projectPosition,
  projectSatelliteSystem,
  displayRadius,
  clippingRange,
  estimateSpacecraftPosition,
  MAX_RENDER_DISTANCE,
  overviewDistance,
} from "./scale";
import { withRenderOrigin, worldLineGeometry, worldPointGeometry } from "./render-space";
import { SimulationClock, type SimulationRate } from "./simulation-clock";
import {
  FLIGHT_RESPONSE,
  motionHasStopped,
  normalizedFlightAxes,
  responseFactor,
  stepMotionVelocity,
} from "./navigation-motion";
import {minorScenePosition,minorLOD,MINOR_BUDGET,type MinorBody} from './minor-bodies';
import { buildPopulationSamples, projectPopulation, type PopulationId } from "./populations";
export type SceneOptions = {
  scientific: boolean;
  orbits: boolean;
  populations: boolean;
  labels: boolean;
  reduced: boolean;
  rate: SimulationRate;
};
type AssistedFlight = {
  id: string;
  start: number;
  from: THREE.Vector3;
  look: THREE.Vector3;
  control: THREE.Vector3;
  duration: number;
};
type ViewTransition = {
  start: number;
  from: THREE.Vector3;
  look: THREE.Vector3;
  to: THREE.Vector3;
  target: THREE.Vector3;
  duration: number;
  completeStatus?: string;
};
export function createScene(
  host: HTMLDivElement,
  onSelect: (id: string) => void,
  onStatus: (s: string) => void,
  onTime: (t: number) => void,
  onVisit: (id: string) => void,
  onError: (s: string) => void,
) {
  let renderer: THREE.WebGLRenderer | SoftwareRenderer;
  const webglCanvas = document.createElement("canvas");
  const webglContext =
    webglCanvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    }) ||
    webglCanvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  try {
    renderer = webglContext
      ? new THREE.WebGLRenderer({
          canvas: webglCanvas,
          context: webglContext,
          logarithmicDepthBuffer: true,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        })
      : new SoftwareRenderer();
  } catch {
    renderer = new SoftwareRenderer();
  }
  if (renderer instanceof SoftwareRenderer)
    host.dataset.renderer = "compatibility";
  if (!host.dataset.renderer) host.dataset.renderer = "webgl";
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.85));
  renderer.setClearColor("#01040a");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive 3D solar system. Drag to look around; use WASD to fly.",
  );
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(43, 1, 0.01, 100000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.maxDistance = MAX_RENDER_DISTANCE;
  controls.minDistance = 0.05;
  const mobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const ambient = new THREE.AmbientLight("#7891ad", 0.055);
  scene.add(ambient);
  const sunlight = new THREE.PointLight("#fff1d5", 4.5, 0, 0);
  scene.add(sunlight);
  const renderSunPosition = new THREE.Vector3();
  if (renderer instanceof THREE.WebGLRenderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    sunlight.shadow.camera.near = 0.1;
    sunlight.shadow.camera.far = 4500;
    sunlight.shadow.bias = -0.00035;
  }
  let options: SceneOptions = {
    scientific: false,
    orbits: false,
    populations: true,
    labels: true,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    rate: 1,
  };
  let time = Date.now(),
    focused = "earth",
    follow = true,
    disposed = false,
    flight: AssistedFlight | null = null,
    viewTransition: ViewTransition | null = null,
    last = performance.now(),
    lastNotify = 0,
    lastFlightStatus = 0,
    frame = 0;
  const clock = new SimulationClock(time, options.rate, last);
  const minorActive=new Map<string,{body:MinorBody;mesh:THREE.Mesh}>();
  let minorSelected:string|null=null;
  const minorLabel=document.createElement('div');minorLabel.className='world-label';minorLabel.style.pointerEvents='none';minorLabel.style.position='absolute';host.appendChild(minorLabel);
  const minorWorld=(body:MinorBody,at=time)=>{const p=minorScenePosition(body,at);return p?new THREE.Vector3(...projectPosition(p,mode())):null;};
  function clearMinorBodies(){for(const {mesh} of minorActive.values()){scene.remove(mesh);mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}minorActive.clear();minorSelected=null;minorLabel.style.display='none';}
  const keys = new Set<string>();
  const manualVelocity = new THREE.Vector3();
  const steeringVelocity = new THREE.Vector2();
  const loader = new THREE.TextureLoader(),
    textures: THREE.Texture[] = [];
  const labels: HTMLButtonElement[] = [];
  const groups = new Map<string, THREE.Group>(),
    meshes: THREE.Mesh[] = [];
  const sizes = new Map<string, number>(),
    surfaceMaterials = new Map<
      string,
      THREE.MeshBasicMaterial | THREE.MeshStandardMaterial
    >();
  const loadedSurfaces = new Set<string>();
  const orbits = new THREE.Group(),
    satelliteOrbits = new THREE.Group(),
    orbitMaterials = new Map<string, THREE.LineBasicMaterial>(),
    satelliteOrbitLines = new Map<string, THREE.Line>();
  const populations = new Map<PopulationId, THREE.Points>();
  let populationEpoch = time;
  let cloudMaterial: THREE.MeshStandardMaterial | null = null,
    nightMaterial: THREE.ShaderMaterial | null = null,
    ringMaterial: THREE.MeshStandardMaterial | null = null,
    routeLine: THREE.Line | null = null;
  orbits.userData.absoluteLineContainer = true;
  scene.add(orbits, satelliteOrbits);
  const loadTexture = (
    name: string,
    onLoad: (texture: THREE.Texture) => void,
    colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace,
  ) => {
    const t = loader.load(
      "/textures/" + name,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        onLoad(texture);
      },
      undefined,
      () => onError("A surface map could not load. Refresh to retry."),
    );
    t.colorSpace = colorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(t);
  };
  const bodyById = new Map(bodies.map((b) => [b.id, b]));
  const satelliteOuterRadius: Record<string, number> = {
    earth: 6,
    mars: 7,
    jupiter: 18,
    saturn: 27,
    uranus: 14,
    neptune: 9,
  };
  const satelliteMaxOrbit = new Map<string, number>();
  for (const b of bodies)
    if (b.category === "moon" && b.parentId && b.semimajorAxisAU !== null)
      satelliteMaxOrbit.set(
        b.parentId,
        Math.max(satelliteMaxOrbit.get(b.parentId) ?? 0, b.semimajorAxisAU),
      );
  const mode = () =>
    options.scientific ? ("scientific" as const) : ("exploration" as const);
  const populationStyle: Record<PopulationId, {color: string; opacity: number}> = {
    "asteroid-belt": { color: "#b8a894", opacity: 0.48 },
    "kuiper-belt": { color: "#7399ad", opacity: 0.4 },
    "jupiter-trojans-leading": { color: "#c7a56d", opacity: 0.58 },
    "jupiter-trojans-trailing": { color: "#c7a56d", opacity: 0.58 },
  };
  function clearPopulations() {
    for (const points of populations.values()) {
      scene.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    }
    populations.clear();
  }
  function rebuildPopulations() {
    clearPopulations();
    const jupiter = position(bodyById.get("jupiter")!, time),
      longitude = Math.atan2(jupiter[2], jupiter[0]);
    for (const sample of buildPopulationSamples(longitude)) {
      const style = populationStyle[sample.id],
        points = new THREE.Points(
          worldPointGeometry(projectPopulation(sample.positionsAU, mode())),
          new THREE.PointsMaterial({
            color: style.color,
            size: 1.65,
            sizeAttenuation: false,
            transparent: true,
            opacity: Math.min(0.72, style.opacity + 0.22),
            depthWrite: false,
          }),
        );
      points.name = sample.id;
      points.userData.absoluteLine = true;
      points.userData.population = true;
      points.frustumCulled = false;
      points.visible = options.populations;
      populations.set(sample.id, points);
      scene.add(points);
    }
    populationEpoch = time;
  }
  function world(b: Body, at = time, anomaly?: number): THREE.Vector3 {
    const p = position(b, at, anomaly);
    if (b.category === "moon" && b.parentId) {
      const parent = position(bodyById.get(b.parentId)!, at);
      const offset: [number, number, number] = [
        p[0] - parent[0],
        p[1] - parent[1],
        p[2] - parent[2],
      ];
      return new THREE.Vector3(
        ...projectSatelliteSystem(
          parent,
          offset,
          mode(),
          satelliteOuterRadius[b.parentId] ?? 8,
          satelliteMaxOrbit.get(b.parentId) ?? b.semimajorAxisAU!,
        ),
      );
    }
    return new THREE.Vector3(...projectPosition(p, mode()));
  }
  function radius(b: Body) {
    return displayRadius(b.radius, b.id === "sun", "exploration");
  }
  for (const b of bodies) {
    const r = radius(b);
    sizes.set(b.id, r);
    const g = new THREE.Group();
    g.position.copy(world(b));
    scene.add(g);
    groups.set(b.id, g);
    const material =
      b.id === "sun"
        ? new THREE.MeshBasicMaterial({ color: b.color })
        : new THREE.MeshStandardMaterial({
            color: b.color,
            roughness:
              b.id === "earth" ? 0.7 : b.kind.includes("giant") ? 0.9 : 0.84,
            metalness: 0,
          });
    surfaceMaterials.set(b.id, material);
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(
        r,
        b.category === "moon" ? (mobile ? 24 : 32) : mobile ? 48 : 72,
        b.category === "moon" ? (mobile ? 16 : 20) : mobile ? 32 : 48,
      ),
      material,
    );
    m.rotation.z =
      ((b.id === "uranus"
        ? 97.8
        : b.id === "earth"
          ? 23.44
          : b.id === "saturn"
            ? 26.7
            : 3) *
        Math.PI) /
      180;
    m.userData.id = b.id;
    m.castShadow = b.id !== "sun";
    m.receiveShadow = b.id !== "sun";
    g.add(m);
    meshes.push(m);
    if (b.id === "sun") {
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 256;
      const ctx = glowCanvas.getContext("2d")!,
        gradient = ctx.createRadialGradient(128, 128, 26, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255,247,219,.34)");
      gradient.addColorStop(0.18, "rgba(255,211,130,.16)");
      gradient.addColorStop(0.5, "rgba(255,150,58,.05)");
      gradient.addColorStop(1, "rgba(255,105,24,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      textures.push(glowTexture);
      const corona = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: "#ffd9a3",
          transparent: true,
          opacity: 0.58,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      corona.scale.setScalar(r * 7);
      g.add(corona);
    }
    if (b.id === "earth") {
      cloudMaterial = new THREE.MeshStandardMaterial({
        color: "white",
        roughness: 1,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.008, mobile ? 40 : 56, mobile ? 28 : 40),
        cloudMaterial,
      );
      cloud.name = "earth-clouds";
      m.add(cloud);
      nightMaterial = new THREE.ShaderMaterial({
        uniforms: {
          nightMap: { value: null },
          sunPosition: { value: renderSunPosition },
        },
        vertexShader:
          "varying vec2 vUv;varying vec3 worldNormal;varying vec3 worldPosition;void main(){vUv=uv;worldNormal=normalize(mat3(modelMatrix)*normal);worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}",
        fragmentShader:
          "uniform sampler2D nightMap;uniform vec3 sunPosition;varying vec2 vUv;varying vec3 worldNormal;varying vec3 worldPosition;void main(){float sunward=dot(normalize(worldNormal),normalize(sunPosition-worldPosition));float night=1.-smoothstep(-.12,.18,sunward);vec3 lights=texture2D(nightMap,vUv).rgb;float intensity=night*night*.72;gl_FragColor=vec4(lights*intensity,max(max(lights.r,lights.g),lights.b)*intensity);}",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const night = new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.002, mobile ? 48 : 72, mobile ? 32 : 48),
        nightMaterial,
      );
      night.name = "earth-night-lights";
      m.add(night);
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.035, 64, 48),
        new THREE.ShaderMaterial({
          uniforms: {
            tint: { value: new THREE.Color("#54a8e8") },
            sunPosition: { value: renderSunPosition },
          },
          vertexShader:
            "varying vec3 n;varying vec3 v;varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;n=normalize(mat3(modelMatrix)*normal);v=normalize(cameraPosition-wp);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader:
            "varying vec3 n;varying vec3 v;varying vec3 wp;uniform vec3 tint;uniform vec3 sunPosition;void main(){float rim=pow(1.-max(dot(normalize(n),normalize(v)),0.),3.5);float day=smoothstep(-.28,.18,dot(normalize(n),normalize(sunPosition-wp)));gl_FragColor=vec4(tint,rim*(.055+.32*day));}",
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      g.add(glow);
    }
    if (b.id === "saturn") {
      const ringGeo = new THREE.RingGeometry(r * 1.24, r * 2.3, 192, 4);
      const uv = ringGeo.attributes.uv,
        p = ringGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const len = Math.hypot(p.getX(i), p.getY(i));
        uv.setXY(i, (len - r * 1.24) / (r * 1.06), 0.5);
      }
      ringMaterial = new THREE.MeshStandardMaterial({
        color: "#c9b58f",
        roughness: 0.94,
        metalness: 0,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        alphaTest: 0.025,
        opacity: 0.82,
      });
      const ring = new THREE.Mesh(ringGeo, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.castShadow = true;
      ring.receiveShadow = true;
      const tilt = new THREE.Group();
      tilt.rotation.z = (26.7 * Math.PI) / 180;
      tilt.add(ring);
      g.add(tilt);
    }
    const label = document.createElement("button");
    label.className = "world-label";
    label.textContent = b.name;
    label.setAttribute("aria-label", "Select " + b.name);
    label.addEventListener("click", () => onSelect(b.id));
    host.appendChild(label);
    labels.push(label);
  }
  // Custom atmospheric layers share the renderer's logarithmic depth convention.
  scene.traverse((object) => {
    const material = (object as THREE.Mesh).material;
    if (material instanceof THREE.ShaderMaterial) {
      material.vertexShader =
        "#include <common>\n#include <logdepthbuf_pars_vertex>\n" +
        material.vertexShader.replace(
          /}$/,
          "\n#include <logdepthbuf_vertex>\n}",
        );
      material.fragmentShader =
        "#include <logdepthbuf_pars_fragment>\n" +
        material.fragmentShader.replace(
          /}$/,
          "\n#include <logdepthbuf_fragment>\n}",
        );
    }
  });
  function preload(id: string) {
    if (loadedSurfaces.has(id)) return;
    const body = bodies.find((b) => b.id === id);
    const material = surfaceMaterials.get(id);
    if (!body || !material) return;
    loadedSurfaces.add(id);
    if (body.texture)
      loadTexture(body.texture + ".jpg", (texture) => {
        material.map = texture;
        material.color.set("#ffffff");
        material.needsUpdate = true;
      });
    if (id === "earth" && cloudMaterial) {
      loadTexture(
        "earth_clouds.jpg",
        (texture) => {
          if (!cloudMaterial) return;
          cloudMaterial.alphaMap = texture;
          cloudMaterial.opacity = 0.62;
          cloudMaterial.needsUpdate = true;
        },
        THREE.NoColorSpace,
      );
      loadTexture("earth_nightmap.jpg", (texture) => {
        if (!nightMaterial) return;
        nightMaterial.uniforms.nightMap.value = texture;
        nightMaterial.needsUpdate = true;
      });
    }
    if (id === "saturn" && ringMaterial)
      loadTexture("saturn_ring_alpha.png", (texture) => {
        if (!ringMaterial) return;
        ringMaterial.map = texture;
        ringMaterial.color.set("#ffffff");
        ringMaterial.opacity = 0.92;
        ringMaterial.needsUpdate = true;
      });
  }
  preload("earth");
  preload("sun");
  // A decorative star field, not a catalogue of observed stellar positions.
  const stars = new Float32Array(15000),
    starColors = new Float32Array(15000);
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < stars.length; i += 3) {
    const z = rand() * 2 - 1,
      a = rand() * Math.PI * 2,
      r = 14000,
      warm = rand(),
      brightness = 0.43 + Math.pow(rand(), 6) * 0.57;
    stars[i] = Math.sqrt(1 - z * z) * Math.cos(a) * r;
    stars[i + 1] = z * r;
    stars[i + 2] = Math.sqrt(1 - z * z) * Math.sin(a) * r;
    starColors[i] = brightness * (warm > 0.9 ? 1 : 0.78);
    starColors[i + 1] = brightness * (warm > 0.9 ? 0.87 : 0.88);
    starColors[i + 2] = brightness * (warm > 0.9 ? 0.72 : 1);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(stars, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const starfield = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      vertexColors: true,
      size: 1.1,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  scene.add(starfield);
  function rebuildOrbits() {
    for (const container of [orbits, satelliteOrbits])
      for (const c of [...container.children]) {
        container.remove(c);
        (c as THREE.Line).geometry.dispose();
        ((c as THREE.Line).material as THREE.Material).dispose();
      }
    satelliteOrbitLines.clear();
    orbitMaterials.clear();
    for (const b of bodies.filter((b) => b.elements)) {
      const points = [];
      for (let i = 0; i <= 256; i++) {
        points.push(
          new THREE.Vector3(
            ...projectPosition(
              position(b, time, (i / 256) * Math.PI * 2),
              mode(),
            ),
          ),
        );
      }
      const material = new THREE.LineBasicMaterial({
        color: "#6f8b96",
        transparent: true,
        opacity: b.id === focused ? 0.72 : 0.38,
        depthWrite: false,
      });
      orbitMaterials.set(b.id, material);
      orbits.add(new THREE.Line(worldLineGeometry(points), material));
    }
    for (const b of bodies.filter((b) => b.category === "moon")) {
      const parent = bodyById.get(b.parentId!)!,
        center = world(parent),
        points = [];
      for (let i = 0; i <= 96; i++)
        points.push(world(b, time, (i / 96) * Math.PI * 2).sub(center));
      const material = new THREE.LineBasicMaterial({
        color: "#78929b",
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        material,
      );
      line.position.copy(center);
      line.userData.parentId = b.parentId;
      satelliteOrbits.add(line);
      satelliteOrbitLines.set(b.id, line);
      orbitMaterials.set(b.id, material);
    }
    orbits.visible = satelliteOrbits.visible = options.orbits;
  }
  rebuildOrbits();
  rebuildPopulations();
  function styleOrbits() {
    for (const [id, material] of orbitMaterials) {
      material.opacity = id === focused ? 0.72 : 0.38;
      material.color.set(id === focused ? "#c5e6de" : "#91aab6");
    }
  }
  function systemRelevant(b: Body) {
    if (b.category !== "moon") return true;
    const focus = bodyById.get(focused);
    return (
      focused === b.id ||
      focused === b.parentId ||
      focus?.parentId === b.parentId
    );
  }
  function destination(id: string) {
    const p = world(bodies.find((b) => b.id === id)!);
    const dir =
      p.length() > 0.1
        ? p.clone().normalize().negate()
        : new THREE.Vector3(0.5, 0.2, 1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.6);
    dir.y = 0.35;
    dir.normalize();
    return {
      p,
      c: p
        .clone()
        .addScaledVector(dir, sizes.get(id)! * (id === "saturn" ? 8.6 : 4.6)),
    };
  }
  function clearRoute() {
    if (!routeLine) return;
    scene.remove(routeLine);
    routeLine.geometry.dispose();
    (routeLine.material as THREE.Material).dispose();
    routeLine = null;
  }
  function flightPoint(
    from: THREE.Vector3,
    control: THREE.Vector3,
    to: THREE.Vector3,
    t: number,
  ) {
    const a = (1 - t) * (1 - t),
      b = 2 * (1 - t) * t,
      c = t * t;
    return from
      .clone()
      .multiplyScalar(a)
      .addScaledVector(control, b)
      .addScaledVector(to, c);
  }
  function focus(id: string, instant = false) {
    minorSelected=null;
    focused = id;
    follow = false;
    viewTransition = null;
    camera.fov = 43;
    camera.updateProjectionMatrix();
    keys.clear();
    manualVelocity.set(0, 0, 0);
    steeringVelocity.set(0, 0);
    preload(id);
    styleOrbits();
    const body = bodies.find((b) => b.id === id)!;
    onStatus(instant ? "Target locked" : "Plotting course to " + body.name);
    const d = destination(id);
    controls.minDistance = sizes.get(id)! * 1.12;
    clearRoute();
    if (instant || options.reduced) {
      camera.position.copy(d.c);
      controls.target.copy(d.p);
      flight = null;
      follow = true;
      onStatus("Target locked");
      onVisit(id);
    } else {
      const from = camera.position.clone(),
        span = from.distanceTo(d.c),
        control = from.clone().lerp(d.c, 0.5),
        outward = control.clone().normalize();
      if (outward.lengthSq() < 0.01) outward.set(0, 1, 0);
      control.addScaledVector(outward, Math.min(90, Math.max(5, span * 0.2)));
      control.y += Math.min(45, span * 0.1);
      const duration = Math.min(
        6500,
        Math.max(2600, 2300 + Math.log1p(span) * 850),
      );
      const points = [];
      for (let i = 0; i <= 48; i++)
        points.push(flightPoint(from, control, d.c, i / 48));
      routeLine = new THREE.Line(
        worldLineGeometry(points),
        new THREE.LineDashedMaterial({
          color: "#99c4bd",
          transparent: true,
          opacity: 0.24,
          dashSize: 1.4,
          gapSize: 1.1,
          depthWrite: false,
        }),
      );
      routeLine.userData.absoluteLine = true;
      routeLine.computeLineDistances();
      scene.add(routeLine);
      flight = {
        id,
        start: performance.now(),
        from,
        look: controls.target.clone(),
        control,
        duration,
      };
    }
  }
  focus("earth", true);
  onTime(time);
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const stop = (preserveManualMotion = false) => {
    minorSelected=null;
    flight = null;
    viewTransition = null;
    camera.fov = 43;
    camera.updateProjectionMatrix();
    clearRoute();
    follow = false;
    if (!preserveManualMotion) stopManualMotion();
    onStatus("Free flight");
  };
  const stopManualMotion = () => {
    manualVelocity.set(0, 0, 0);
    steeringVelocity.set(0, 0);
  };
  controls.addEventListener("start", () => {
    if (flight || viewTransition) stop();
  });
  const down = (e: KeyboardEvent) => {
    if (
      (e.target as HTMLElement).closest(
        'input,textarea,select,[role="dialog"],[role="combobox"]',
      )
    )
      return;
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "KeyQ",
        "KeyE",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ShiftLeft",
        "ShiftRight",
        "Space",
        "Escape",
      ].includes(e.code)
    ) {
      e.preventDefault();
      if (e.code === "Space" || e.code === "Escape") {
        keys.clear();
        stopManualMotion();
        flight = null;
        viewTransition = null;
        camera.fov = 43;
        camera.updateProjectionMatrix();
        clearRoute();
        onStatus("Braked");
        return;
      }
      keys.add(e.code);
      stop(true);
    }
  };
  const up = (e: KeyboardEvent) => keys.delete(e.code),
    blur = () => {
      keys.clear();
      stopManualMotion();
    };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  let pointerStart = [0, 0];
  const pd = (e: PointerEvent) => {
    pointerStart = [e.clientX, e.clientY];
  };
  const pu = (e: PointerEvent) => {
    if (
      Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) > 5
    )
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = ray.intersectObjects(meshes.filter(mesh=>mesh.parent?.visible), false)[0];
    if (hit) onSelect(hit.object.userData.id);
  };
  renderer.domElement.addEventListener("pointerdown", pd);
  renderer.domElement.addEventListener("pointerup", pu);
  const contextLost = (e: Event) => {
    e.preventDefault();
    onError("The 3D connection was interrupted. Refresh this page to restart.");
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  function animate(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const elapsed = Math.min((now - last) / 1000, 0.25);
    const dt = Math.min(elapsed, 0.05);
    last = now;
    const previous = world(bodies.find((b) => b.id === focused)!);
    const minorTarget=minorSelected?minorActive.get(minorSelected):undefined;
    const minorPrevious=minorTarget?minorWorld(minorTarget.body):null;
    time = clock.read(now);
    // Keep the representative Trojan clouds aligned with Jupiter without
    // turning the bounded region layer into a per-frame ephemeris workload.
    if (options.populations && Math.abs(time - populationEpoch) >= 30 * 86400000)
      rebuildPopulations();
    for(const {body,mesh} of minorActive.values()){
      const p=minorWorld(body);if(!p){mesh.visible=false;continue;}mesh.position.copy(p);
      const distance=camera.position.distanceTo(p),lod=minorLOD(distance,body.id===minorSelected);
      mesh.visible=lod!=='hidden';mesh.scale.setScalar(lod==='selected'?1:Math.max(.1,Math.min(.4,distance*.002)));
    }
    if(minorTarget&&minorPrevious&&!viewTransition){const p=minorWorld(minorTarget.body);if(p){const delta=p.clone().sub(minorPrevious);camera.position.add(delta);controls.target.add(delta);}}
    minorLabel.style.display='none';
    if(minorTarget&&options.labels&&minorTarget.mesh.visible){const p=minorTarget.mesh.position.clone().project(camera);if(p.z>=-1&&p.z<=1){minorLabel.textContent=minorTarget.body.name+' · illustrative orbit';minorLabel.style.display='block';minorLabel.style.left=((p.x*.5+.5)*host.clientWidth)+'px';minorLabel.style.top=((-p.y*.5+.5)*host.clientHeight-30)+'px';}}
    for (const b of bodies) {
      const group = groups.get(b.id)!;
      group.position.copy(world(b));
      group.visible = systemRelevant(b);
      const orbit = satelliteOrbitLines.get(b.id);
      if (orbit) {
        orbit.position.copy(world(bodyById.get(b.parentId!)!));
        orbit.visible = systemRelevant(b);
      }
      const mesh = meshes[bodies.indexOf(b)];
      if (
        !options.reduced &&
        host.dataset.renderer !== "compatibility" &&
        b.day !== null
      ) {
        mesh.rotation.y =
          (((time - Date.UTC(2000, 0, 1, 12)) / 3600000 / b.day) *
            Math.PI *
            2) %
          (Math.PI * 2);
        const cloud = mesh.getObjectByName("earth-clouds");
        if (cloud) cloud.rotation.y = mesh.rotation.y * 0.07;
      }
    }
    const current = world(bodies.find((b) => b.id === focused)!);
    if (follow && !flight && !viewTransition) {
      const delta = current.clone().sub(previous);
      camera.position.add(delta);
      controls.target.add(delta);
    }
    if (viewTransition) {
      const t = Math.min(
          1,
          (now - viewTransition.start) / viewTransition.duration,
        ),
        e = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
      camera.position.lerpVectors(viewTransition.from, viewTransition.to, e);
      controls.target.lerpVectors(
        viewTransition.look,
        viewTransition.target,
        e,
      );
      camera.fov = 43 + Math.sin(Math.PI * t) * 1.4;
      camera.updateProjectionMatrix();
      if (t === 1) {
        const completeStatus = viewTransition.completeStatus;
        viewTransition = null;
        camera.fov = 43;
        camera.updateProjectionMatrix();
        onStatus(minorSelected ? minorActive.get(minorSelected)!.body.name+' · illustrative orbit · enlarged marker' : (completeStatus ?? "Solar system overview"));
      }
    }
    if (flight) {
      const t = Math.min(1, (now - flight.start) / flight.duration),
        e = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
        d = destination(flight.id);
      camera.position.copy(flightPoint(flight.from, flight.control, d.c, e));
      controls.target.lerpVectors(flight.look, d.p, e);
      camera.fov = 43 + Math.sin(Math.PI * t) * 3.2;
      camera.updateProjectionMatrix();
      if (now - lastFlightStatus > 400 && t < 1) {
        lastFlightStatus = now;
        onStatus(
          `Cruising to ${bodies.find((b) => b.id === flight.id)!.name} · ${Math.round(t * 100)}%`,
        );
      }
      if (t === 1) {
        onVisit(flight.id);
        flight = null;
        camera.fov = 43;
        camera.updateProjectionMatrix();
        clearRoute();
        follow = true;
        onStatus("Target locked");
      }
    }
    const translationAxes = normalizedFlightAxes(
      (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0),
      (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
      (keys.has("KeyE") ? 1 : 0) - (keys.has("KeyQ") ? 1 : 0),
    );
    const baseSpeed = Math.max(
      sizes.get(focused)! * 0.8,
      camera.position.distanceTo(controls.target) * 0.3,
    );
    const speed = baseSpeed *
      (keys.has("ShiftLeft") || keys.has("ShiftRight")
        ? FLIGHT_RESPONSE.boost
        : 1);
    const hasTranslationInput = translationAxes.some((axis) => axis !== 0);
    if (hasTranslationInput || !motionHasStopped(manualVelocity.toArray())) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const right = new THREE.Vector3()
        .crossVectors(direction, camera.up)
        .normalize();
      const desiredVelocity = direction
        .clone()
        .multiplyScalar(translationAxes[0] * speed)
        .addScaledVector(right, translationAxes[1] * speed)
        .addScaledVector(camera.up, translationAxes[2] * speed);
      manualVelocity.fromArray(
        stepMotionVelocity(
          manualVelocity.toArray(),
          desiredVelocity.toArray(),
          dt,
        ),
      );
      if (motionHasStopped(manualVelocity.toArray())) manualVelocity.set(0, 0, 0);
      const move = manualVelocity.clone().multiplyScalar(dt);
      camera.position.add(move);
      controls.target.add(move);
    }
    const desiredYaw =
      (keys.has("ArrowLeft") ? 1 : 0) - (keys.has("ArrowRight") ? 1 : 0);
    const desiredPitch =
      (keys.has("ArrowUp") ? 1 : 0) - (keys.has("ArrowDown") ? 1 : 0);
    const steeringBlend = responseFactor(
      desiredYaw || desiredPitch
        ? FLIGHT_RESPONSE.steering
        : FLIGHT_RESPONSE.steeringRelease,
      dt,
    );
    steeringVelocity.x += (desiredYaw - steeringVelocity.x) * steeringBlend;
    steeringVelocity.y += (desiredPitch - steeringVelocity.y) * steeringBlend;
    if (steeringVelocity.lengthSq() > FLIGHT_RESPONSE.stopEpsilon ** 2) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const right = new THREE.Vector3()
        .crossVectors(direction, camera.up)
        .normalize();
      direction.applyAxisAngle(camera.up, dt * steeringVelocity.x);
      direction.applyAxisAngle(right, dt * steeringVelocity.y);
      controls.target
        .copy(camera.position)
        .addScaledVector(
          direction,
          Math.max(1, camera.position.distanceTo(controls.target)),
        );
    } else {
      steeringVelocity.set(0, 0);
    }
    // Keep the camera outside each exaggerated body, including when manual flight crosses a surface.
    for (const b of bodies.filter(systemRelevant)) {
      const p = groups.get(b.id)!.position,
        r = sizes.get(b.id)! * 1.08,
        offset = camera.position.clone().sub(p);
      if (offset.length() < r) {
        const surfaceNormal = offset.lengthSq()
          ? offset.clone().normalize()
          : new THREE.Vector3(0, 0, 1);
        const correction = (
          offset.lengthSq() ? offset.normalize() : offset.set(0, 0, 1)
        )
          .multiplyScalar(r)
          .add(p)
          .sub(camera.position);
        camera.position.add(correction);
        controls.target.add(correction);
        const inwardSpeed = manualVelocity.dot(surfaceNormal);
        if (inwardSpeed < 0)
          manualVelocity.addScaledVector(surfaceNormal, -inwardSpeed);
      }
    }
    controls.update();
    satelliteOrbits.visible = options.orbits;
    starfield.position.copy(camera.position);
    let clearance = Infinity,
      farthest = 0;
    for (const b of bodies.filter(systemRelevant)) {
      const d = camera.position.distanceTo(groups.get(b.id)!.position),
        extent = sizes.get(b.id)! * (b.id === "saturn" ? 2.3 : 1.04);
      clearance = Math.min(clearance, Math.max(0.001, d - extent));
      farthest = Math.max(farthest, d + extent);
    }
    for(const {mesh} of minorActive.values())if(mesh.visible){const d=camera.position.distanceTo(mesh.position);clearance=Math.min(clearance,Math.max(.001,d-.12));farthest=Math.max(farthest,d+.12);}
    if (options.populations)
      farthest = Math.max(
        farthest,
        camera.position.length() +
          Math.hypot(...projectPosition([50, 0, 0], mode())),
      );
    const clip = clippingRange(clearance, farthest);
    if (camera.near !== clip.near || camera.far !== clip.far) {
      camera.near = clip.near;
      camera.far = clip.far;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    bodies.forEach((b, i) => {
      const p = world(b),
        r = sizes.get(b.id)!;
      const visible =
        options.labels &&
        systemRelevant(b) &&
        p.clone().sub(camera.position).dot(viewDirection) > 0;
      const screen = p
        .clone()
        .add(new THREE.Vector3(0, r * 1.25, 0))
        .project(camera);
      const label = labels[i];
      label.style.display =
        visible &&
        Math.abs(screen.x) < 0.95 &&
        Math.abs(screen.y) < 0.86 &&
        screen.z < 1
          ? "block"
          : "none";
      label.style.left = (screen.x * 0.5 + 0.5) * host.clientWidth + "px";
      label.style.top = (-screen.y * 0.5 + 0.5) * host.clientHeight + "px";
    });
    if (!document.querySelector('[role="dialog"][data-state="open"]'))
      withRenderOrigin(scene, camera, renderSunPosition, () =>
        renderer.render(scene, camera),
      );
    if (now - lastNotify > 500) {
      lastNotify = now;
      onTime(time);
    }
  }
  frame = requestAnimationFrame(animate);
  return {
    clearMinorBodies,
    showMinorBody(body:MinorBody,travel=false){
      const p=minorWorld(body);if(!p){onError('No supported position model for this object.');return;}
      stop();follow=false;minorSelected=body.id;
      if(!minorActive.has(body.id)){
        if(minorActive.size>=MINOR_BUDGET.visible){const victim=[...minorActive.values()].sort((a,b)=>a.body.importance-b.body.importance)[0];scene.remove(victim.mesh);victim.mesh.geometry.dispose();(victim.mesh.material as THREE.Material).dispose();minorActive.delete(victim.body.id);}
        const mesh=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:body.kind==='comet'?'#bed6d9':'#b1a497'}));mesh.userData.id=body.id;mesh.position.copy(p);scene.add(mesh);minorActive.set(body.id,{body,mesh});
      }
      controls.minDistance=.3;const to=p.clone().add(new THREE.Vector3(1,0.65,1.4));
      if(!travel||options.reduced){camera.position.copy(to);controls.target.copy(p);}else viewTransition={start:performance.now(),from:camera.position.clone(),look:controls.target.clone(),to,target:p,duration:2600};
      onStatus(body.name+' · illustrative orbit · enlarged marker');
    },
    focus,
    preload,
    getGuideNavigation() {
      const anchor=bodyById.get(focused);
      const craft=anchor&&!minorSelected?estimateSpacecraftPosition(camera.position.toArray(),position(anchor,time),world(anchor).toArray(),anchor.radius,sizes.get(anchor.id)!,mode(),AU):options.scientific?camera.position.toArray().map(v=>v/100):null;
      return {
        atUtcMs:time,
        positionAU:craft?[craft[0],-craft[2],craft[1]] as [number,number,number]:null,
        basis:craft?(options.scientific?'linear-camera' as const:'navigation-estimate' as const):'unavailable' as const,
        anchorId:focused,
        note:options.scientific?'Scientific Scale: linear camera conversion; not a physical spacecraft trajectory.':minorSelected?'Spacecraft coordinates unavailable while focused on a minor body in Exploration Scale.':'Exploration Scale: focused-body-local navigation estimate, not a globally physical position.',
        selectedMinor:minorSelected?structuredClone(minorActive.get(minorSelected)?.body??null):null,
      };
    },
    getSpacecraftDistance(id: string) {
      const anchor = bodyById.get(focused),
        target = bodyById.get(id);
      if (!anchor || !target) return null;
      const anchorModel = position(anchor, time),
        targetModel = position(target, time),
        anchorVisual = world(anchor),
        craft = estimateSpacecraftPosition(
          camera.position.toArray(),
          anchorModel,
          anchorVisual.toArray(),
          anchor.radius,
          sizes.get(anchor.id)!,
          mode(),
          AU,
        );
      return {
        valueKm:
          Math.hypot(
            ...targetModel.map((value, index) => value - craft[index]),
          ) * AU,
        atUtcMs: time,
        note: options.scientific
          ? "Camera position converted through the linear Scientific Scale; the body position uses the displayed simulation time."
          : "Navigation estimate anchored to the focused body. Exploration Scale compresses distance and enlarges bodies, so this is not a spacecraft-navigation measurement.",
      };
    },
    overview() {
      minorSelected=null;
      stop();
      focused = "sun";
      preload("sun");
      styleOrbits();
      controls.minDistance = 0.05;
      const range = options.scientific ? 5600 : 285,
        offset = range * 0.11,
        to = new THREE.Vector3(offset, range * 1.3, range * 0.65),
        target = new THREE.Vector3(offset, 0, 0);
      if (options.reduced) {
        camera.position.copy(to);
        controls.target.copy(target);
        onStatus("Solar system overview");
      } else {
        viewTransition = {
          start: performance.now(),
          from: camera.position.clone(),
          look: controls.target.clone(),
          to,
          target,
          duration: 1800,
          completeStatus: "Solar system overview",
        };
        onStatus("Opening solar system view…");
      }
    },
    populationOverview() {
      minorSelected=null;
      stop();
      focused = "sun";
      preload("sun");
      styleOrbits();
      controls.minDistance = 0.05;
      const populationExtent = Math.hypot(
          ...projectPosition([50, 0, 0], mode()),
        ),
        range =
          overviewDistance(
            populationExtent,
            camera.fov,
            camera.aspect,
            1.15,
          ) / Math.hypot(1.3, 0.65),
        offset = range * 0.11,
        to = new THREE.Vector3(offset, range * 1.3, range * 0.65),
        target = new THREE.Vector3(offset, 0, 0);
      if (options.reduced) {
        camera.position.copy(to);
        controls.target.copy(target);
        onStatus("Small-body regions overview");
      } else {
        viewTransition = {
          start: performance.now(),
          from: camera.position.clone(),
          look: controls.target.clone(),
          to,
          target,
          duration: 1800,
          completeStatus: "Small-body regions overview",
        };
        onStatus("Opening small-body regions…");
      }
    },
    brake() {
      keys.clear();
      stopManualMotion();
      flight = null;
      viewTransition = null;
      camera.fov = 43;
      camera.updateProjectionMatrix();
      clearRoute();
      onStatus("Braked");
    },
    setMovement(code: string, active: boolean) {
      if (active) {
        keys.add(code);
        stop(true);
      } else keys.delete(code);
    },
    setOptions(next: SceneOptions) {
      const scale = options.scientific !== next.scientific;
      if (options.rate !== next.rate) {
        time = clock.setRate(next.rate, performance.now());
        onTime(time);
      }
      options = next;
      orbits.visible = options.orbits;
      for (const points of populations.values()) points.visible = options.populations;
      if (scale) {
        for (const b of bodies) {
          const scaleFactor = options.scientific ? 0.05 : 1;
          groups.get(b.id)!.scale.setScalar(scaleFactor);
          sizes.set(b.id, displayRadius(b.radius, b.id === "sun", mode()));
          groups.get(b.id)!.position.copy(world(b));
        }
        rebuildOrbits();
        rebuildPopulations();
        focus(focused, true);
      }
    },
    dispose() {
      clearPopulations();
      clearMinorBodies();minorLabel.remove();
      disposed = true;
      keys.clear();
      stopManualMotion();
      clearRoute();
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      controls.dispose();
      textures.forEach((t) => t.dispose());
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          (Array.isArray(m.material) ? m.material : [m.material]).forEach(
            (mat) => mat.dispose(),
          );
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      labels.forEach((l) => l.remove());
    },
  };
}
