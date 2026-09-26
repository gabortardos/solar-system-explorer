# Step 19 — Close-approach rendering

Implementation checkpoint: 2026-09-22. All eight priority bodies are implemented and inspected in the Canvas compatibility renderer at far, medium and close distances. **Step 19 is not yet signed off:** the available browser cannot create a WebGL context. GPU shader appearance, shadow/draw-call cost and physical mobile performance remain unverified. Do not start Step 20.

## Shared system

`app/body-lod.ts` is the reusable screen-space policy; `app/body-detail.ts` owns streaming, shader uniforms, atmosphere profiles, texture/geometry lifetime and diagnostics. `app/scene.ts` supplies the existing camera, groups, materials, focus and elapsed time. No orbital, spacecraft, scientific scale, AI, D1 or security architecture changed.

- A 512×256 base map is requested only when a body occupies more than 3 projected radius pixels. Seven small bases can remain cached; Titan uses a one-pixel catalog-color atmosphere material.
- Medium detail enters at 65 radius pixels and leaves below 45. Close detail enters at 220 and leaves below 165. Hysteresis avoids threshold thrashing.
- Medium maps are 1024×512. Close maps are 4096×2048 on desktop WebGL, capped to 2048×1024 on mobile/coarse pointers and compatibility rendering.
- Two desktop or one mobile/compatibility detail bundles, counting pending allocations. Visible focused bodies take priority over larger parent planets. Other candidates are ranked by projected size. Invisible bodies relinquish detail.
- A 0.8-second elapsed-time fade blends the base and detail maps. Replacement fades through the base before releasing the previous tier; this avoids retaining two expensive copies for one body. A brief softening during replacement is intentional. The software renderer includes fade state in its redraw signature.
- Detail geometry is created only for an allocated bundle: 96/128 longitudinal segments on desktop, 64 on mobile/compatibility, with half as many latitude segments. Eviction restores the original lightweight geometry and disposes the detailed mesh geometry.
- Fetches are abortable. Late completions are disposed; a failed map retains its safe base without an automatic retry loop. Teardown aborts requests and releases all managed textures. The software pixel cache listens for texture disposal and caps decoded width to 2048.
- Earth cloud/night maps and WebGL-only Moon relief belong to the evictable bundle. Saturn's compact existing ring map loads when Saturn becomes visible, including during moon approaches, and remains a small shared scene resource until teardown.

## Body implementation

| Body | Delivered treatment | Important limitation |
| --- | --- | --- |
| Earth | Four surface tiers, faded cloud/night layers, day-weighted atmosphere, night lights restricted to the dark hemisphere | Static maps, not current clouds or weather; ocean-specific roughness is not yet sourced |
| Moon | NASA LROC albedo tiers; NASA LOLA bump shading on WebGL; no wasted relief download on Canvas | Shading only, no displacement or landing terrain; polar source detail varies |
| Mars | Higher-resolution mapped terrain and restrained warm haze | Static source color treatment, not current dust/weather |
| Jupiter | Mapped cloud bands, storms/Great Red Spot, subtle atmospheric limb | Features and orientation are illustrative, not time-correct cloud motion |
| Saturn | Mapped bands/polar feature, limb haze, smoother WebGL ring geometry, corrected Canvas ring seams/depth split | Ring rendering is approximate; full GPU shadows still need inspection |
| Europa | NASA model's ice/fracture map at all tiers | Uneven source resolution and mosaic treatment; no invented displacement |
| Titan | Opaque orange atmospheric globe, wider soft limb, progressive sphere geometry | No fabricated visible surface, transparent atmosphere or methane-sea texture |
| Enceladus | NASA model's mapped icy/cratered/fractured terrain | Source imagery contains baked lighting; no invented terrain, plumes or landing mesh |

## Asset provenance

31 derived WebP files total 9,677,254 bytes on disk; they are **not** downloaded together at startup. Exact dimensions, sizes and SHA-256 hashes are in `BODY_TEXTURE_MANIFEST.json`.

- Earth, Mars, Jupiter and Saturn surface maps: [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), based on NASA imagery. Download names were `8k_earth_daymap.jpg`, `8k_mars.jpg`, `8k_jupiter.jpg`, `8k_saturn.jpg` under `https://www.solarsystemscope.com/textures/download/`. Actual Jupiter/Saturn source dimensions were 4096×2048; no upscaling was performed. SSS maps are visualization assets with color/gap-filling choices, not measurement products.
- Earth clouds/night lights: resized derivatives of the already-credited SSS maps in `public/textures/`. Saturn's existing `saturn_ring_alpha.png` attribution remains unchanged.
- Moon: [NASA/Goddard SVS Moon Kit](https://svs.gsfc.nasa.gov/4720/), LROC color/albedo and LOLA elevation. Downloaded `lroc_color_poles_4k.tif` and `ldem_16_uint.tif` from `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/`. Elevation half-meter samples span 2037–41371; normalization creates an approximately 19.7 km global relief span. Bump scale is approximately 0.0115 of presentation radius, not added geometry.
- Europa: [NASA Science Europa 3D model](https://science.nasa.gov/resource/europa-3d-model/); extracted the existing 4096×2048 base-color image from `https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Europa_1_3138.glb`.
- Enceladus: [NASA Science Enceladus 3D model](https://science.nasa.gov/resource/enceladus-3d-model/); extracted the existing 4096×2048 base-color image from `https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Enceladus_1_504.glb`.

Processing: Pillow Lanczos downsampling, RGB WebP quality 84 (512px bases: 78), clouds/night 85; normalized lunar height encoded losslessly. Source mosaics retain their available features. No generated imagery, procedural craters, fracture fabrication or albedo-derived fake normal maps. These assets do not change canonical scientific data, and map longitude/body spin remain the existing illustrative orientation model.

## Inspection and measured findings

The managed preview at 1363×936 reported `data-renderer="compatibility"`. Actual rendered screenshots were inspected for all eight bodies at approximately 18–30, 100–140 and 248–265 radius pixels; nearby larger bodies sometimes occupy the second part of the viewport. Earth was orbited to inspect its night side. Saturn's rings were also checked from its moons.

Corrections found during this pass:

- DataTexture placeholders now work in Canvas instead of reaching unsupported `drawImage` calls.
- Stationary views redraw during texture fades; rate-capped flight time no longer stretches LOD fades.
- Focused moons retain a detail slot when a much larger parent enters the frame.
- Detail cancellation and late-completion disposal are covered by tests.
- Saturn ring bands draw as compound paths rather than thousands of overlapping translucent fills. Front/back splitting uses the camera-facing plane, with consistent opacity; the former segment seams and brightness steps are removed.
- Saturn ring maps load on moon approaches, rather than requiring prior Saturn selection.
- Titan's detached halo was replaced with a continuous outward falloff. The GPU shell similarly fades to zero at its outer edge; GPU appearance remains to be checked.
- Earth night-layer tessellation/offset avoids intersection with the higher-detail globe; Canvas night lights follow the same terminator mask as WebGL.

Observed Canvas render work samples were roughly 19–54 ms for close bodies; Saturn's seam correction changed the sampled close rendering from 68.5 ms to 37.7 ms. These are development-browser snapshots, not controlled hardware benchmarks or GPU frame rates. The existing compatibility renderer remains capped near 9 redraws/second. Far Earth sampled 8.8 ms. CPU pixel storage fell with eviction; a traveled scene including pinned Sun/ring/base maps and close Earth sampled about 23.5 MiB decoded pixels.

Managed texture accounting is a conservative RGBA8+mip estimate, separate from measured CPU pixel storage and from the rest of the scene. One 4K color map is about 42.7 MiB; two desktop bundles plus seven bases and the largest optional layers are approximately 106 MiB. Mobile/compatibility uses one 2K bundle, with compatibility avoiding the 10.7 MiB lunar height allocation entirely. Mesh counts remain bounded; detail changes do not add another surface draw. Actual WebGL draw calls, GPU texture allocation, shadow costs and physical-device responsiveness must still be measured.

## Exact next action / sign-off gate

Do not repeat asset research or rebuild the LOD architecture. Open this checkpoint in a **WebGL-capable** browser and verify that the DOM reports `data-renderer="webgl"`. Inspect all eight bodies at far/medium/close range and during transitions. Pay particular attention to shader compilation, color decoding, Moon bump strength, atmosphere outer-edge fade, Earth cloud/night-layer depth and Saturn ring transparency/shadows. Read `data-detail` and `data-render-stats` for allocation/draw-call trends, travel through the bodies twice, and check memory returns to the bounded cache. Repeat on a real or supported mobile WebGL viewport/device. Fix only observed defects, rerun affected tests plus release build, then mark Step 19 complete and update the checkpoint. No landing, surface physics, Step 20 or unrelated UI work.
