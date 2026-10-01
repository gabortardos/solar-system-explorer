"""Offline extraction/downsampling of sourced maps; no generated terrain.

Usage: python scripts/prepare-identity-textures.py IDENTITY_SOURCE_DIRECTORY [DESTINATION_SOURCE_DIRECTORY]
Source metadata is recorded separately in docs/VISUAL_IDENTITY.md.
"""
import hashlib
import io
import json
import random
from pathlib import Path
import struct
import sys
from statistics import median
from PIL import Image, ImageChops, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[1]
sources = Path(sys.argv[1])
destination_sources = Path(sys.argv[2]) if len(sys.argv) > 2 else sources
out = ROOT / 'public/textures/detail'
# Ceres was prepared by the Destination Readiness pass from its differently
# colour-managed spectral mosaic. Preserve those reviewed outputs here.
manifest_path = ROOT / 'docs/IDENTITY_TEXTURE_MANIFEST.json'
manifest = [item for item in json.loads(manifest_path.read_text()) if item['body'] == 'ceres']
for item in manifest:
    content = (ROOT / item['file']).read_bytes()
    item['bytes'] = len(content)
    item['sha256'] = hashlib.sha256(content).hexdigest()
glb_bodies = ['io', 'ganymede', 'callisto', 'tethys', 'dione', 'rhea', 'iapetus', 'triton']
image_bodies = ['miranda', 'ariel', 'umbriel', 'titania', 'oberon']
body_order = glb_bodies + image_bodies + ['mimas', 'phobos', 'deimos', 'uranus', 'neptune', 'ceres', 'pluto', 'charon']

def edge_no_data_mask(image, edge, threshold=48):
    """Mark only dark pixels connected to one polar edge of a 2:1 map."""
    mask = Image.new('L', image.size, 0)
    pixels, missing = image.load(), mask.load()
    ys = range(image.height) if edge == 'top' else range(image.height - 1, -1, -1)
    for x in range(image.width):
        for y in ys:
            if max(pixels[x, y]) > threshold:
                break
            missing[x, y] = 255
    return mask

def neutralize_unknown_edge(image, edge, body):
    """Use neutral observed mean tone and a broad feather at a coverage edge."""
    mask = edge_no_data_mask(image, edge)
    observed = mask.point(lambda value: 255 - value)
    mean = tuple(round(value) for value in ImageStat.Stat(image, observed).mean)
    tone_scale = {'pluto': 1.07, 'charon': 1.12}.get(body, 1)
    mean = tuple(min(255, round(value * tone_scale)) for value in mean)
    # The owner WebGL review exposed narrow feathers as false terrain/cap edges.
    # Expand past source JPEG ringing, then blend across about ten degrees.
    expand = max(3, round(image.width * .06)) | 1
    feather = max(6, round(image.width * .06))
    soft = mask.filter(ImageFilter.MaxFilter(expand)).filter(ImageFilter.GaussianBlur(feather))
    # A latitude-wide ramp prevents an irregular mission-footprint silhouette
    # from reading as a detached cap on a lit sphere. It only suppresses source
    # detail into the same neutral unknown tone; it does not extend terrain.
    latitude = Image.new('L', image.size)
    latitude_pixels = latitude.load()
    start, end = ((.45, .78) if edge == 'top' else (.53, .86))
    for y in range(image.height):
        t = (y / image.height - start) / (end - start)
        amount = 1 - max(0, min(1, t)) if edge == 'top' else max(0, min(1, t))
        value = round(255 * amount * amount * (3 - 2 * amount))
        for x in range(image.width):
            latitude_pixels[x, y] = value
    soft = ImageChops.lighter(soft, latitude)
    # Very low-amplitude deterministic grain keeps the neutral material from
    # looking like a second mesh. It carries no craters, ridges or inferred
    # geography and is disclosed as presentation, not observation.
    rng = random.Random(sum((index + 1) * ord(char) for index, char in enumerate(body)))
    grain_size = (max(16, image.width // 12), max(8, image.height // 12))
    grain = Image.new('L', grain_size)
    grain.putdata([rng.randrange(256) for _ in range(grain_size[0] * grain_size[1])])
    grain = grain.filter(ImageFilter.GaussianBlur(.7)).resize(image.size, Image.Resampling.BICUBIC)
    fill = Image.merge('RGB', tuple(
        grain.point(lambda value, tone=tone: max(0, min(255, round(tone + (value - 128) * .14))))
        for tone in mean
    ))
    return Image.composite(fill, image, soft)

def reduce_baked_illumination(image):
    """Suppress horizontal source-mosaic lighting while retaining local texture."""
    luminance = image.convert('L')
    profile = luminance.resize((1, image.height), Image.Resampling.BOX)
    profile = profile.filter(ImageFilter.GaussianBlur(max(4, round(image.height * .045))))
    target = median(profile.get_flattened_data())
    correction = profile.point(lambda value: max(0, min(255, round(128 + .72 * (target - value)))))
    correction = correction.resize(image.size, Image.Resampling.BILINEAR)
    corrected = Image.merge('RGB', tuple(
        ImageChops.add(channel, correction, scale=1, offset=-128)
        for channel in image.split()
    ))
    corrected = Image.blend(image, corrected, .82)
    # The GLB's featureless northern source area meets the observed mosaic in a
    # dark horizontal strip. Fade that unknown cap into a neutral observed tone.
    mean = tuple(round(value) for value in ImageStat.Stat(corrected).mean)
    mask = Image.new('L', corrected.size)
    pixels = mask.load()
    solid, end = .22 * corrected.height, .44 * corrected.height
    for y in range(corrected.height):
        amount = 1 if y <= solid else 0 if y >= end else (end - y) / (end - solid)
        value = round(255 * amount * amount * (3 - 2 * amount))
        for x in range(corrected.width):
            pixels[x, y] = value
    return Image.composite(Image.new('RGB', corrected.size, mean), corrected, mask)

def base_color(path):
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    model = json.loads(data[20:20 + length])
    texture = model['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
    source = model['textures'][texture]['source']
    view = model['bufferViews'][model['images'][source]['bufferView']]
    offset = 28 + length + view.get('byteOffset', 0)
    return Image.open(io.BytesIO(data[offset:offset + view['byteLength']]))

for body in (body for body in body_order if body != 'ceres'):
    source_root = destination_sources if body in ['pluto', 'charon'] else sources
    path = source_root / (body + ('.glb' if body in glb_bodies else '.jpg'))
    if body == 'oberon':
        path = sources / 'oberon.tif'  # NASA page's JPEG incorrectly links to Ariel.
    if body == 'mimas':
        path = sources / 'saturn-mimas.jpg'
    if body in ['phobos', 'deimos']:
        path = sources / f'mars-{body}.jpg'
    if body in ['uranus', 'neptune']:
        path = ROOT / 'public/textures' / (body + '.jpg')
    if body == 'pluto':
        path = source_root / 'pluto-global-color-map.jpg'
    if body == 'charon':
        path = source_root / 'charon-global-map-pia19866.jpg'
    source = base_color(path) if body in glb_bodies else Image.open(path)
    source = source.convert('RGB')
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
        # Voyager 2 and New Horizons maps end in irregular black polar masks.
        # Preserve unknown areas, but never render the data boundary as a hard
        # coastline or false spherical cap. No terrain is mirrored or invented.
        if body in image_bodies:
            image = neutralize_unknown_edge(image, 'top', body)
        if body in ['pluto', 'charon']:
            image = neutralize_unknown_edge(image, 'bottom', body)
        if body == 'triton':
            image = reduce_baked_illumination(image)
        target = out / f'{body}-{width}.webp'
        image.save(target, quality=80 if width == 256 else 84, method=6)
        content = target.read_bytes()
        item = {'body': body, 'file': str(target.relative_to(ROOT)), 'width': width,
                'height': width // 2, 'bytes': len(content),
                'sha256': hashlib.sha256(content).hexdigest(),
                'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        if body in image_bodies + ['pluto', 'charon']:
            item['coverageTreatment'] = 'neutral-unknown-feather-v2'
        if body == 'triton':
            item['coverageTreatment'] = 'source-illumination-normalization-v1'
        manifest.append(item)
manifest.sort(key=lambda item: (body_order.index(item['body']), item['width']))
(ROOT / 'docs/IDENTITY_TEXTURE_MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{len(manifest)} maps, {sum(item["bytes"] for item in manifest):,} bytes')
