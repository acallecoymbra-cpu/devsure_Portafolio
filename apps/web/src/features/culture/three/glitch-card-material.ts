import * as THREE from 'three';

// Idle vertex wave (Slice 8.4): two overlapping sine waves along local Y/X,
// displaced along the plane's own normal so it reads as a gentle undulation
// regardless of the card's lean rotation. Needs interior vertices to look
// like a wave rather than a rigid rock — see `CARD_SEGMENTS` in
// spine-engine.ts's PlaneGeometry.
const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    float wave = sin(uTime * 0.6 + position.y * 2.2 + uSeed) * 0.05
      + sin(uTime * 0.9 - position.x * 1.6 + uSeed * 1.7) * 0.03;
    vec3 displaced = position + normal * wave;

    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// RGB-split + horizontal "sliced band" displacement, scaled by uIntensity,
// plus an always-on fresnel rim glow (Slice 8.4) so cards read as alive even
// at rest, independent of the glitch. At uIntensity = 0 every glitch offset
// collapses to 0, so that part of the shader reduces to a plain texture
// sample — no separate "clean" code path needed.
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform float uIntensity;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying vec3 vNormal;

  float hash(float value) {
    return fract(sin(value) * 43758.5453123);
  }

  void main() {
    float bandCount = 14.0;
    float band = floor(vUv.y * bandCount);
    float bandNoise = hash(band * 12.9898 + uSeed) - 0.5;
    float displace = bandNoise * 0.12 * uIntensity;
    float split = 0.01 * uIntensity;

    float r = texture2D(map, vec2(vUv.x + displace + split, vUv.y)).r;
    float g = texture2D(map, vec2(vUv.x + displace, vUv.y)).g;
    float b = texture2D(map, vec2(vUv.x + displace - split, vUv.y)).b;

    float flicker = (hash(vUv.y * 97.0 + uSeed + band) - 0.5) * 0.08 * uIntensity;

    vec3 viewDir = normalize(-vViewPosition);
    float facing = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.5);
    vec3 rim = vec3(0.235, 0.847, 0.773) * fresnel * 0.6;

    gl_FragColor = vec4(vec3(r, g, b) + flicker + rim, 1.0);
  }
`;

export interface GlitchCardMaterial extends THREE.ShaderMaterial {
  uniforms: {
    map: { value: THREE.Texture };
    uIntensity: { value: number };
    uSeed: { value: number };
    uTime: { value: number };
  };
}

/**
 * A card material that samples `map` with an RGB-split/banded-displacement
 * glitch, whose strength is `uniforms.uIntensity` (0 = the plain texture, 1
 * = full glitch). Driving that uniform per frame (see
 * `spine-engine.ts::applyProgress`) is how the glitch pulses in as a card
 * approaches the camera and settles clean once centered, without a
 * full-screen postprocessing pass — `three`'s built-in `GlitchPass` was
 * considered first (plan §4) but rejected because it glitches the whole
 * render target, not one card at a time.
 */
export function createGlitchCardMaterial(fallbackTexture: THREE.Texture, seed: number): GlitchCardMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: fallbackTexture },
      uIntensity: { value: 0 },
      uSeed: { value: seed },
      uTime: { value: 0 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  }) as GlitchCardMaterial;
}

/** A 1x1 texture in `CARD_FALLBACK_COLOR`, shared by every card until its real image loads. */
export function createFallbackTexture(hexColor: number): THREE.DataTexture {
  const color = new THREE.Color(hexColor);
  const data = new Uint8Array([
    Math.round(color.r * 255),
    Math.round(color.g * 255),
    Math.round(color.b * 255),
    255,
  ]);
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}
