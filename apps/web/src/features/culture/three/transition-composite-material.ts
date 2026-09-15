import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Original composite: a radial wipe band plus noise-driven UV jitter and an
// RGB-channel split, all scaled by `uProgress`. At uProgress = 0 every term
// collapses to zero and the three channels sample the same UV, so this is a
// plain pass-through of `uScene` when idle — no separate "clean" branch.
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uScene;
  uniform float uProgress;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453123);
  }

  void main() {
    float dist = distance(vUv, vec2(0.5));
    float band = 1.0 - smoothstep(0.0, 0.65, abs(dist - (1.0 - uProgress) * 0.75));
    float strength = uProgress * band;

    float grain = hash(floor(vUv * vec2(70.0, 40.0)));
    vec2 distortedUv = vUv + (grain - 0.5) * 0.05 * strength;

    float split = 0.014 * strength;
    float r = texture2D(uScene, distortedUv + vec2(split, 0.0)).r;
    vec4 centerSample = texture2D(uScene, distortedUv);
    float g = centerSample.g;
    float b = texture2D(uScene, distortedUv - vec2(split, 0.0)).b;

    // uScene is transparent wherever the 3D scene drew nothing (see
    // spine-engine.ts's renderer.setClearAlpha(0)) - passing that through
    // instead of hardcoding 1.0 lets the CSS pageBackdrop behind the canvas
    // show through everywhere the column/particles don't cover.
    gl_FragColor = vec4(r, g, b, centerSample.a);
  }
`;

export interface TransitionCompositeMaterial extends THREE.ShaderMaterial {
  uniforms: {
    uScene: { value: THREE.Texture | null };
    uProgress: { value: number };
    uSeed: { value: number };
  };
}

export function createTransitionCompositeMaterial(): TransitionCompositeMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: null },
      uProgress: { value: 0 },
      uSeed: { value: Math.random() * 100 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
  }) as TransitionCompositeMaterial;
}
