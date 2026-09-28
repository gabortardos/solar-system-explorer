# Solar System visual identity pass — 2026-09-28

Unnumbered quality pass before Step 20. Step 19 remains complete; its eight
priority bodies, assets, lighting/shadow policy and close-approach tiers are unchanged.

## Delivered scope

| Bodies | Identity treatment | Limits |
| --- | --- | --- |
| Uranus | Existing subtly banded cyan map, existing 97.8° tilt, restrained atmospheric limb; now streamed through shared cache | Intentionally subdued visible-light appearance; no new rings or seasonal weather |
| Neptune | Existing mapped clouds/storms with restrained blue-green palette and atmospheric limb | Approximate color, not calibrated reflectance or current weather |
| Io | NASA volcanic yellow/brown/white mosaic | No lava animation, plume or fabricated relief |
| Ganymede, Callisto | NASA mixed bright/dark terrain and cratered surface maps | Uneven source coverage/resolution and baked shading |
| Mimas, Tethys, Dione, Rhea, Iapetus | Sourced cratered ice; Herschel and Iapetus's dark/bright terrain provide distinctive identity | Mimas uses a partial Voyager mosaic; no invented topography |
| Miranda, Ariel, Umbriel, Titania, Oberon | USGS/JPL Voyager maps retain observed southern features | Missing northern coverage is featureless mean-tone fill, explicitly disclosed |
| Triton | NASA icy terrain mosaic and subtle source coloration | Uneven/unobserved regions; not a complete survey |
| Phobos, Deimos | NASA/JPL Viking-derived rocky maps | Existing spherical proxies retained; not claimed as shape models |

## Sources and reproducibility

`IDENTITY_TEXTURE_SOURCES.json` records exact source pages, downloads, credits and
coverage caveats. `IDENTITY_TEXTURE_MANIFEST.json` records source/output SHA-256
hashes, dimensions and sizes. NASA assets are used under [educational/informational
media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), without
endorsement. Credits: NASA VTAD; NASA/JPL/Solar System Simulator; USGS/Tammy Becker
and JPL/Caltech. Existing ice-giant maps remain Solar System Scope / INOVE, CC BY 4.0.

`scripts/prepare-identity-textures.py SOURCE_DIRECTORY` extracts the GLB's actual
base-color image (not its normal map), downsamples without upscaling, and exports
RGB WebP at 256×128 and 1024×512. Download source files using the names in the
source manifest. No original models are downloaded by visitors.

Mimas's square model atlas was rejected for spherical UVs; its cylindrical NASA
map is used instead. The NASA Oberon JPEG link incorrectly points to Ariel, so
the correct Oberon TIFF is used. A partial Dione download failed decoding and
was replaced by a fully decoded source before integration.

Top-connected black no-data pixels in the five Uranian moon maps are filled
with the observed map's mean tone. A narrow no-data edge is discarded and
feathered to prevent false dark coverage boundaries. This is a neutral unknown
region, not inferred terrain. Mosaics retain baked illumination and source gaps.

Neptune's enhanced-blue legacy map is converted to luminance and recolored with
a low-contrast blue-green palette, preserving existing mapped structures. This
qualitative rendering choice follows [Irwin et al.'s 2024 appearance research](https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0),
not a photometric reconstruction. Uranus stays pale and subtly banded. In-app
Surface imagery disclosure includes these limitations and credits.

## Performance and lifetime

- Same `BodyDetailManager`, thresholds, 0.8-second fades, culling, abort/disposal
  and shared two-desktop/one-mobile-or-Canvas detail slots.
- Eighteen identity bodies use lazy 256px bases and one 1024px detail tier.
  Medium-to-close approach does not re-fetch the image or rebuild geometry.
- All 18 retained bases total approximately 3 MiB RGBA+mips after every body has
  been seen; one detail map is approximately 2.67 MiB. Identity-only mobile tour
  remains below 6 MiB managed estimate. This is not measured GPU memory.
- 36 WebP files total 1,290,596 bytes, never downloaded together at startup.
- Detail geometry capped at 64×32 segments. Two atmosphere meshes are the only
  extra scene meshes; no additional surface draw per moon.
- Uranus/Neptune no longer use the persistent 2K loader: the existing preload
  guard skips every registered managed body.
- No new runtime dependencies, remote requests, terrain or rendering subsystem.

## Verification and remaining acceptance

Asset images were visually inspected and decoded; source hashes and size/tier
contracts are tested. Regressions cover every identity destination, medium/close
stability, disposal, shared-slot competition with Earth, and all Step 19 lifetime
cases. Production build, all 109 automated tests and lint passed on 2026-09-28.
The pre-existing production bundle warning above 500 kB remains.

**Actual application-rendered/WebGL inspection is not completed for this pass.**
Managed preview requires a control-browser skill unavailable in this session;
no alternate browser path was used. Asset inspection and mocked Three.js tests
are not rendered visual QA. Owner mobile acceptance for version 35 remains
Step 19 evidence only, not acceptance of these maps. Inspect both hemispheres at
far/medium/close range, lighting/seams/haze during motion, and memory after a
repeated tour when a supported browser/device is available. Step 20 has not started.
