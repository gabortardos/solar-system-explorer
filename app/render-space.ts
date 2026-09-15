import * as THREE from 'three';
import {writeRelativePositions} from './scale';

const absoluteGeometries = new WeakMap<THREE.BufferGeometry, Float64Array>();

function absoluteGeometry(absolute: Float64Array) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(absolute), 3));
  absoluteGeometries.set(geometry, absolute);
  return geometry;
}

/** Keep authoritative line vertices in doubles, not a GPU Float32 buffer. */
export function worldLineGeometry(points: THREE.Vector3[]) {
  const absolute = new Float64Array(points.length * 3);
  points.forEach((p, i) => p.toArray(absolute, i * 3));
  return absoluteGeometry(absolute);
}

/** Keep a bounded particle population camera-relative without losing its
 * authoritative double-precision display coordinates. */
export function worldPointGeometry(absolute: Float64Array) {
  if (absolute.length % 3) throw new RangeError('Invalid point buffer');
  return absoluteGeometry(absolute);
}

/** Navigation remains in double-precision display coordinates. Only the render
 * snapshot is rebased. Restore exact saved values, even if rendering throws.
 * Absolute line containers must have identity transforms.
 */
export function withRenderOrigin(scene: THREE.Scene, camera: THREE.PerspectiveCamera, sunPosition: THREE.Vector3, render: () => void) {
  const origin = camera.position.clone();
  const saved = scene.children.map(object => ({object, position: object.position.clone()}));
  scene.userData.renderOrigin = origin;
  try {
    for (const {object} of saved) {
      if (!object.userData.absoluteLine && !object.userData.absoluteLineContainer) object.position.sub(origin);
    }
    scene.traverse(object => {
      const geometry = (object as THREE.Line).geometry;
      const absolute = geometry && absoluteGeometries.get(geometry);
      if (!absolute) return;
      const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
      writeRelativePositions(absolute, [origin.x, origin.y, origin.z], attribute.array as Float32Array);
      attribute.needsUpdate = true;
      geometry.computeBoundingSphere();
    });
    camera.position.set(0, 0, 0);
    sunPosition.copy(origin).negate();
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    render();
  } finally {
    for (const {object, position} of saved) object.position.copy(position);
    camera.position.copy(origin);
    sunPosition.set(0, 0, 0);
    // Raycasting and DOM labels run in the authoritative navigation frame.
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
  }
}
