"""Offline extraction/downsampling of sourced maps; no generated terrain.

Usage: python scripts/prepare-identity-textures.py SOURCE_DIRECTORY
Source metadata is recorded separately in docs/VISUAL_IDENTITY.md.
"""
import hashlib
import io
import json
from pathlib import Path
import struct
import sys
from PIL import Image, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[1]
sources = Path(sys.argv[1])
out = ROOT / 'public/textures/detail'
manifest = []
glb_bodies = ['io', 'ganymede', 'callisto', 'tethys', 'dione', 'rhea', 'iapetus', 'triton']
image_bodies = ['miranda', 'ariel', 'umbriel', 'titania', 'oberon']

def base_color(path):
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    model = json.loads(data[20:20 + length])
    texture = model['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
    source = model['textures'][texture]['source']
    view = model['bufferViews'][model['images'][source]['bufferView']]
    offset = 28 + length + view.get('byteOffset', 0)
    return Image.open(io.BytesIO(data[offset:offset + view['byteLength']]))

for body in glb_bodies + image_bodies + ['mimas', 'phobos', 'deimos', 'uranus', 'neptune']:
    path = sources / (body + ('.glb' if body in glb_bodies else '.jpg'))
    if body == 'oberon':
        path = sources / 'oberon.tif'  # NASA page's JPEG incorrectly links to Ariel.
    if body == 'mimas':
        path = sources / 'saturn-mimas.jpg'
    if body in ['phobos', 'deimos']:
        path = sources / f'mars-{body}.jpg'
    if body in ['uranus', 'neptune']:
        path = ROOT / 'public/textures' / (body + '.jpg')
    source = base_color(path) if body in glb_bodies else Image.open(path)
    source = source.convert('RGB')
    # Missing northern coverage is black in the USGS maps, not a dark terrain unit.
    # Fill only the top-connected no-data region with a featureless mean tone.
    # Never mirror, synthesize or tile terrain into unobserved hemispheres.
    if body in image_bodies:
        mask = Image.new('L', source.size, 0)
        pixels, coverage = source.load(), mask.load()
        for x in range(source.width):
            for y in range(source.height):
                if max(pixels[x, y]) > 8:
                    break
                coverage[x, y] = 255
        observed = mask.point(lambda value: 255 - value)
        mean = tuple(round(value) for value in ImageStat.Stat(source, observed).mean)
        # Discard a narrow no-data edge before feathering; JPEG ringing there
        # otherwise makes a false dark coastline around the coverage boundary.
        expanded = mask.filter(ImageFilter.MaxFilter(15))
        source = Image.composite(Image.new('RGB', source.size, mean), source, expanded.filter(ImageFilter.GaussianBlur(2)))
    if body == 'neptune':
        # SSS uses enhanced Voyager blue. Keep its mapped cloud structure, but
        # use a restrained blue-green presentation (Irwin et al. 2024), not a
        # claim of calibrated reflectance or present-day weather.
        luminance = source.convert('L')
        mean = ImageStat.Stat(luminance).mean[0]
        source = Image.merge('RGB', tuple(luminance.point(lambda value, c=c: round(c + .45 * (value - mean))) for c in (158, 193, 200)))
    if source.width != source.height * 2:
        raise ValueError(f'{body}: expected equirectangular 2:1 image, got {source.size}')
    for width in [256, 1024]:
        if width > source.width:
            raise ValueError(f'{body}: refusing to upscale {source.width} to {width}')
        image = source.resize((width, width // 2), Image.Resampling.LANCZOS)
        target = out / f'{body}-{width}.webp'
        image.save(target, quality=80 if width == 256 else 84, method=6)
        content = target.read_bytes()
        manifest.append({'body': body, 'file': str(target.relative_to(ROOT)), 'width': width,
                         'height': width // 2, 'bytes': len(content),
                         'sha256': hashlib.sha256(content).hexdigest(),
                         'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest()})
(ROOT / 'docs/IDENTITY_TEXTURE_MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{len(manifest)} maps, {sum(item["bytes"] for item in manifest):,} bytes')
