import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Digital-corruption composite: a radial wipe band gates *when* the glitch
// is visible (same envelope as before — full strength right after
// `trigger()`, collapsing to 0 as `uProgress` decays, so idle frames are a
// plain pass-through of `uScene`); within that band three independent
// distortions stack, matched to the specific look the user asked for
// (block-based displacement + RGB split + horizontal tearing + ghosting,
// explicitly *not* a per-pixel blur/pixelation):
//   1. Block displacement: a coarse grid of rectangular cells, a random
//      subset of which snap their UV sample to a shifted position — reads
//      as chunks of the render corrupting/misplacing, not a smooth ripple.
//      Fewer, larger cells than the first pass at this (16x9, ~45% of them
//      active at peak strength instead of 28x16 at ~80%) — a real bug the
//      user caught: the previous tuning fired so many small blocks at once
//      that the *un*corrupted screen area shrank to almost nothing, and
//      every one of the scene's ~2200 bright drifting particles
//      (spine-particles.ts) got a full-screen RGB split on top of that
//      (see point 3 below), so the whole frame read as scattered pixel
//      noise/confetti instead of a handful of legible corrupted panels.
//   2. Horizontal tearing: a random subset of whole scanline rows shift
//      sideways by varying amounts — the classic "line slipped out of
//      sync" look, independent of the block grid above. Thicker/fewer
//      bands than the first pass (48 rows, ~35% active) for the same
//      "restraint over static" reason as point 1.
//   3. Ghosting: a faint trail of the *previous* rendered frame
//      (`uPrevScene`, see transition-composite.ts's double-buffered
//      targets) blended in only while the glitch is strong, offset
//      slightly so it reads as a leftover after-image, not a static double
//      exposure.
// RGB-channel split (kept from the original version) is applied on top of
// the already-displaced UV, so the channel separation itself also jumps
// with the blocks/rows — but its *strength* is now localized to whichever
// blocks/rows are actually corrupt this frame (`localGlitch`), with only a
// faint residual split (15%) elsewhere. Previously it was uniform across
// the whole screen at full `strength`, which is what produced that
// "confetti" reading against the particle field even after point 1's
// fine-noise term was removed — chromatic aberration is inherently
// speckle-prone against many small bright points, so the fix isn't a
// noise function to delete, it's *where* the split gets applied.
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uScene;
  uniform sampler2D uPrevScene;
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

    // 1. Block displacement.
    vec2 blockGrid = vec2(16.0, 9.0);
    vec2 blockId = floor(vUv * blockGrid);
    float blockPick = hash(blockId);
    float blockActive = step(1.0 - strength * 0.45, blockPick);
    vec2 blockOffset = (vec2(hash(blockId + 1.0), hash(blockId + 7.0)) - 0.5) * 0.09 * strength;
    vec2 uv = vUv + blockOffset * blockActive;

    // 2. Horizontal tearing.
    float rowCount = 48.0;
    float rowId = floor(uv.y * rowCount);
    float rowPick = hash(vec2(rowId, uSeed));
    float rowActive = step(1.0 - strength * 0.35, rowPick);
    float rowShift = (hash(vec2(rowId, uSeed + 3.1)) - 0.5) * 0.24 * strength;
    uv.x += rowShift * rowActive;

    // RGB split, localized to the blocks/rows that are actually glitching
    // this frame — see the comment above the shader for why a uniform
    // full-screen split was the real source of the "pixel noise" look.
    float localGlitch = max(blockActive, rowActive);
    float split = 0.02 * strength * mix(0.15, 1.0, localGlitch);
    float r = texture2D(uScene, uv + vec2(split, 0.0)).r;
    vec4 centerSample = texture2D(uScene, uv);
    float g = centerSample.g;
    float b = texture2D(uScene, uv - vec2(split, 0.0)).b;
    vec3 color = vec3(r, g, b);

    // 3. Ghosting from the previous frame.
    vec3 ghost = texture2D(uPrevScene, uv + vec2(0.01, -0.006) * strength).rgb;
    color = mix(color, ghost, 0.22 * strength);

    // uScene is transparent wherever the 3D scene drew nothing (see
    // spine-engine.ts's renderer.setClearAlpha(0)) - passing that through
    // instead of hardcoding 1.0 lets the CSS pageBackdrop behind the canvas
    // show through everywhere the column/particles don't cover.
    gl_FragColor = vec4(color, centerSample.a);
  }
`;

export interface TransitionCompositeMaterial extends THREE.ShaderMaterial {
  uniforms: {
    uScene: { value: THREE.Texture | null };
    uPrevScene: { value: THREE.Texture | null };
    uProgress: { value: number };
    uSeed: { value: number };
  };
}

export function createTransitionCompositeMaterial(): TransitionCompositeMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: null },
      uPrevScene: { value: null },
      uProgress: { value: 0 },
      uSeed: { value: Math.random() * 100 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
  }) as TransitionCompositeMaterial;
}
