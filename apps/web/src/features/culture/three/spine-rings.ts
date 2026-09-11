import * as THREE from 'three';

interface RingSpec {
  y: number;
  radius: number;
  tiltX: number;
  tiltZ: number;
  speed: number;
  color: number;
  opacity: number;
}

const RING_SPECS: RingSpec[] = [
  { y: -1.4, radius: 1.9, tiltX: 1.3, tiltZ: 0.15, speed: 0.12, color: 0x86e9db, opacity: 0.4 },
  { y: 0.3, radius: 2.3, tiltX: 1.15, tiltZ: -0.2, speed: -0.09, color: 0x3cd8c5, opacity: 0.32 },
  { y: 1.6, radius: 1.6, tiltX: 1.4, tiltZ: 0.3, speed: 0.16, color: 0xdfefff, opacity: 0.28 },
];

const SEGMENTS = 128;

function createRing(spec: RingSpec): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const angle = (i / SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * spec.radius, 0, Math.sin(angle) * spec.radius * 0.32));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.position.y = spec.y;
  line.rotation.x = spec.tiltX;
  line.rotation.z = spec.tiltZ;
  return line;
}

export interface SpineRings {
  group: THREE.Group;
  update: (elapsedSeconds: number) => void;
  dispose: () => void;
}

/**
 * Thin, tilted "data ring" loops orbiting the column, echoing the swirling
 * particle rings in the reference clip. Each spins slowly around its own Y
 * axis (on top of its fixed tilt), independent of the column's own
 * `spine.group.rotation.y` in spine-engine.ts — added directly to the scene,
 * not as a child of the column group, so the two rotations don't compound.
 * Driven by the idle loop's wall-clock `elapsedSeconds` (Slice 8.4), so the
 * rings keep drifting even while the viewer isn't scrolling.
 */
export function createSpineRings(): SpineRings {
  const group = new THREE.Group();
  const rings = RING_SPECS.map((spec) => {
    const ring = createRing(spec);
    group.add(ring);
    return { ring, spec };
  });

  return {
    group,
    update: (elapsedSeconds: number) => {
      rings.forEach(({ ring, spec }) => {
        ring.rotation.y = elapsedSeconds * spec.speed;
      });
    },
    dispose: () => {
      rings.forEach(({ ring }) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
    },
  };
}
