import * as THREE from 'three';

// Slice 9.5: user asked for the column itself to be a bit bigger,
// specifically (not just the whole scene reading bigger via camera zoom —
// see spine-engine.ts's fitDistanceForScene margin, which already handles
// that). Scaling the assembled group directly is the one lever that grows
// the column without the auto-fit camera just backing away to compensate
// (which is what would happen if this only changed how the *height* used
// for framing was computed). The exported dimensions below are kept in
// sync with this same factor so camera framing and particle placement
// (spine-particles.ts, spine-engine.ts) stay proportional to the column's
// actual new size instead of drifting out of sync with it.
const SPINE_SCALE = 1.15;
export const SPINE_HEIGHT = 5 * SPINE_SCALE;
export const SPINE_HALF_WIDTH = 0.9 * SPINE_SCALE;

/** Original bevelled vertebral body: four octagonal rings, triangulated flat faces. */
function createVertebraGeometry(): THREE.BufferGeometry {
  const rings = [
    { y: -0.14, radius: 0.76 },
    { y: -0.085, radius: 1 },
    { y: 0.085, radius: 1 },
    { y: 0.14, radius: 0.76 },
  ];
  const points: THREE.Vector3[][] = rings.map(({ y, radius }) =>
    Array.from({ length: 8 }, (_, index) => {
      const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
      return new THREE.Vector3(Math.cos(angle) * 0.39 * radius, y, Math.sin(angle) * 0.3 * radius);
    }),
  );
  const vertices: number[] = [];
  function triangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray());
  }
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let side = 0; side < 8; side += 1) {
      const next = (side + 1) % 8;
      triangle(points[ring][side], points[ring + 1][side], points[ring][next]);
      triangle(points[ring][next], points[ring + 1][side], points[ring + 1][next]);
    }
  }
  for (let side = 0; side < 8; side += 1) {
    const next = (side + 1) % 8;
    triangle(new THREE.Vector3(0, rings[0].y, 0), points[0][side], points[0][next]);
    triangle(new THREE.Vector3(0, rings[3].y, 0), points[3][next], points[3][side]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Deterministic stack, with lateral and posterior processes giving every
 * angle a real silhouette. The vertebrae live in an inner `bones` group,
 * scaled by `SPINE_SCALE` — kept separate from the returned outer `group`
 * (which stays at scale 1) because `spine-engine.ts` adds the particle aura
 * (spine-particles.ts) as a child of `group` too, already sized using the
 * `SPINE_SCALE`-adjusted `SPINE_HALF_WIDTH`/`SPINE_HEIGHT` exports above —
 * scaling the outer group as well would apply that factor to the particles
 * a second time, pushing them further out than intended.
 */
export function createSpineColumn(material: THREE.ShaderMaterial) {
  const group = new THREE.Group();
  const bones = new THREE.Group();
  bones.scale.setScalar(SPINE_SCALE);
  group.add(bones);

  const bodyGeometry = createVertebraGeometry();
  const processGeometry = new THREE.IcosahedronGeometry(1, 0);
  const segmentCount = 13;

  for (let index = 0; index < segmentCount; index += 1) {
    const t = index / (segmentCount - 1);
    const segment = new THREE.Group();
    const width = 0.72 + Math.sin(t * Math.PI) * 0.26;
    segment.position.set(Math.sin(t * Math.PI * 1.7) * 0.08, (t - 0.5) * 4.55, Math.sin(t * Math.PI * 2) * 0.12);
    segment.rotation.set(Math.sin(t * Math.PI * 2) * 0.08, Math.sin(index * 1.7) * 0.12, Math.sin(index * 1.3) * 0.045);
    segment.scale.set(width, 1, width);
    segment.add(new THREE.Mesh(bodyGeometry, material));

    for (const side of [-1, 1]) {
      const process = new THREE.Mesh(processGeometry, material);
      process.scale.set(0.32, 0.09, 0.15);
      process.position.set(side * 0.48, -0.025, -0.1);
      process.rotation.z = side * 0.22;
      segment.add(process);
    }
    const posterior = new THREE.Mesh(processGeometry, material);
    posterior.scale.set(0.12, 0.12, 0.36);
    posterior.position.set(0, -0.035, -0.37);
    posterior.rotation.x = -0.2;
    segment.add(posterior);
    bones.add(segment);
  }

  return {
    group,
    dispose: () => {
      bodyGeometry.dispose();
      processGeometry.dispose();
    },
  };
}
