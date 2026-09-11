import * as THREE from 'three';

const PARTICLE_COUNT = 2200;
const TEAL = new THREE.Color(0x3cd8c5);
const CORAL = new THREE.Color(0xff8f6b);
const PALE = new THREE.Color(0xdfefff);

export interface SpineParticles {
  points: THREE.Points;
  /** Wall-clock-driven zero-gravity drift (Slice 9.5) — see the per-particle frequency/phase arrays below. */
  update: (elapsedSeconds: number) => void;
  dispose: () => void;
}

/**
 * A speckled point-cloud shell around the vertebral column, styled after the
 * reference clip (`videos muestra/ezgif-...`, see PLAN-CULTURA-SPINE-3D.md's
 * "Slice 9" bitácora entry): small teal/coral/pale dots scattered just
 * outside the procedural body's surface, so the column reads as a "data
 * visualization" dust aura rather than a bare, smooth mesh. Sampling is a
 * cheap cylindrical approximation around the column's own height/radius, not
 * a true triangle-surface sample of `spine-geometry.ts`'s mesh — good enough
 * for an aura, much simpler to build and cheaper to render.
 *
 * Meant to be added as a child of the column's own rotating group (see
 * `spine-engine.ts`), so it turns together with the vertebrae instead of
 * needing its own rotation bookkeeping.
 *
 * Slice 9.5 (user feedback: "quiero que las chispitas se muevan de forma
 * aleatoria y con gravedad cero"): each particle also drifts independently
 * around its own sampled "home" position — a small sine wobble per axis,
 * with a random frequency/phase *per particle*, so the cloud reads as many
 * independently-floating specks instead of one wave moving the whole cloud
 * in lockstep. `update()` recomputes the live position buffer from
 * `basePositions` each frame; it never accumulates drift onto itself, so
 * there's no risk of a particle wandering away for good.
 */
export function createSpineParticles(spineHeight: number, halfWidth: number): SpineParticles {
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const driftFrequency = new Float32Array(PARTICLE_COUNT * 3);
  const driftPhase = new Float32Array(PARTICLE_COUNT * 3);
  const driftAmplitude = halfWidth * 0.22;

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const y = (Math.random() - 0.5) * spineHeight * 0.94;
    const angle = Math.random() * Math.PI * 2;
    const radius = halfWidth * (0.82 + Math.random() * 0.55);
    const base = i * 3;
    basePositions[base] = Math.cos(angle) * radius;
    basePositions[base + 1] = y;
    basePositions[base + 2] = Math.sin(angle) * radius * 0.72;

    for (let axis = 0; axis < 3; axis += 1) {
      // Slow (a full wobble takes ~4.5-13s) so it reads as gentle
      // zero-gravity drift, not a jitter.
      driftFrequency[base + axis] = 0.08 + Math.random() * 0.22;
      driftPhase[base + axis] = Math.random() * Math.PI * 2;
    }

    const colorPick = Math.random();
    const color = colorPick < 0.55 ? TEAL : colorPick < 0.85 ? PALE : CORAL;
    colors[base] = color.r;
    colors[base + 1] = color.g;
    colors[base + 2] = color.b;
  }

  positions.set(basePositions);

  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    update: (elapsedSeconds: number) => {
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const base = i * 3;
        positions[base] =
          basePositions[base] + Math.sin(elapsedSeconds * driftFrequency[base] + driftPhase[base]) * driftAmplitude;
        positions[base + 1] =
          basePositions[base + 1] +
          Math.sin(elapsedSeconds * driftFrequency[base + 1] + driftPhase[base + 1]) * driftAmplitude;
        positions[base + 2] =
          basePositions[base + 2] +
          Math.sin(elapsedSeconds * driftFrequency[base + 2] + driftPhase[base + 2]) * driftAmplitude;
      }
      positionAttribute.needsUpdate = true;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
