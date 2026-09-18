import * as THREE from 'three';

// Idle vertex wave (unchanged from the original glitch-only material): two
// overlapping sine waves along local Y/X, displaced along the plane's own
// normal so it reads as a gentle undulation regardless of the card's lean
// rotation. Needs interior vertices to look like a wave rather than a rigid
// rock — see `CARD_SEGMENTS_*` in spine-cards.ts's PlaneGeometry.
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

// Glassmorphic card: a rounded-rect SDF mask (so the plane's silhouette
// itself reads as rounded, not just its content), a cheap multi-tap blur of
// whatever the column/particles render to behind the cards (`uSceneBehindCards`
// — see spine-refraction.ts, the same screen-space-sampling technique the
// column's own material already uses, extended with a hidden-cards pass
// instead of a hidden-column one), tinted translucent, with the card's own
// photo blended on top — more strongly for the front-facing "hero" card
// (`uFocus` near 1), more like plain frosted glass for receded secondary
// cards (`uFocus` near 0). The existing RGB-split/banded glitch (unchanged
// logic, still driven by `uIntensity`) and fresnel rim glow layer on top of
// that, exactly as before.
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D uSceneBehindCards;
  uniform vec2 uResolution;
  uniform float uIntensity;
  uniform float uSeed;
  uniform float uFocus;
  uniform float uAspect;
  uniform vec2 uImageRepeat;
  uniform vec2 uImageOffset;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying vec3 vNormal;

  float hash(float value) {
    return fract(sin(value) * 43758.5453123);
  }

  // Inigo Quilez's rounded-box SDF: negative inside, 0 at the edge, positive outside.
  float roundedBoxSDF(vec2 point, vec2 halfSize, float radius) {
    vec2 q = abs(point) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    // Aspect-corrected so the corner radius reads as a physical circle
    // instead of an ellipse on a non-square plane.
    vec2 halfSize = vec2(uAspect, 1.0) * 0.5;
    float cornerRadius = 0.16;
    vec2 centered = (vUv - 0.5) * vec2(uAspect, 1.0);
    float sdf = roundedBoxSDF(centered, halfSize - cornerRadius, cornerRadius);
    float edgeAA = fwidth(sdf) * 1.5 + 0.0005;
    float roundedMask = 1.0 - smoothstep(-edgeAA, edgeAA, sdf);
    if (roundedMask <= 0.001) discard;

    // Existing glitch: horizontal "sliced band" displacement + RGB split on
    // the card's own photo, scaled by uIntensity (0 at rest, up to 1 during
    // a hero-card transition — see spine-engine.ts).
    float bandCount = 14.0;
    float band = floor(vUv.y * bandCount);
    float bandNoise = hash(band * 12.9898 + uSeed) - 0.5;
    float displace = bandNoise * 0.12 * uIntensity;
    float split = 0.01 * uIntensity;
    // Cover-fit (like CSS object-fit: cover): uImageRepeat/uImageOffset
    // (set once per texture from its real pixel size — see spine-cards.ts)
    // crop the source image to the card's own fixed aspect ratio instead of
    // stretching it, so any upload (any dimensions) fills the card without
    // distortion. The glitch band/RGB-split displacement is applied in this
    // same cropped space, after the cover transform, so it still reads as a
    // displacement of the visible photo, not of the untrimmed source.
    vec2 photoUv = vUv * uImageRepeat + uImageOffset;
    float r = texture2D(map, vec2(photoUv.x + displace + split, photoUv.y)).r;
    float g = texture2D(map, vec2(photoUv.x + displace, photoUv.y)).g;
    float b = texture2D(map, vec2(photoUv.x + displace - split, photoUv.y)).b;
    vec3 photo = vec3(r, g, b);

    // Frosted backdrop: a cheap 8-tap circular blur of the column/particles
    // rendered behind the cards, radius widening for receded cards (a rough
    // depth-of-field cue — the further a card sits from "hero", the blurrier
    // its glass reads).
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    float blurRadius = mix(0.014, 0.005, uFocus);
    vec3 backdrop = vec3(0.0);
    for (int i = 0; i < 8; i += 1) {
      float angle = 6.2831853 * float(i) / 8.0;
      vec2 offset = vec2(cos(angle), sin(angle)) * blurRadius;
      backdrop += texture2D(uSceneBehindCards, screenUv + offset).rgb;
    }
    backdrop /= 8.0;

    vec3 glassTint = vec3(0.05, 0.07, 0.12);
    vec3 glass = mix(backdrop, glassTint, 0.45);
    // Hero cards read mostly as their photo (through a faint glass sheen);
    // receded secondary cards read mostly as frosted glass with just a hint
    // of the photo showing through — the reference's "protagonist vs. side
    // panel" contrast, achieved by material blend instead of a second shader.
    vec3 color = mix(glass, photo, 0.3 + 0.6 * uFocus);

    float flicker = (hash(vUv.y * 97.0 + uSeed + band) - 0.5) * 0.08 * uIntensity;

    vec3 viewDir = normalize(-vViewPosition);
    float facing = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.5);
    vec3 rim = vec3(0.235, 0.847, 0.773) * fresnel * 0.6;

    // Thin bright edge along the rounded silhouette itself, the classic
    // acrylic-panel highlight — brighter where the SDF mask is just fading out.
    float edgeGlow = (1.0 - smoothstep(0.0, edgeAA * 3.0, abs(sdf))) * 0.35;

    float alpha = roundedMask * clamp(0.55 + 0.35 * uFocus, 0.0, 1.0);
    gl_FragColor = vec4(color + flicker + rim + edgeGlow, alpha);
  }
`;

export interface SpineCardMaterial extends THREE.ShaderMaterial {
  uniforms: {
    map: { value: THREE.Texture };
    uSceneBehindCards: { value: THREE.Texture };
    uResolution: { value: THREE.Vector2 };
    uIntensity: { value: number };
    uSeed: { value: number };
    uTime: { value: number };
    uFocus: { value: number };
    uAspect: { value: number };
    uImageRepeat: { value: THREE.Vector2 };
    uImageOffset: { value: THREE.Vector2 };
  };
}

/**
 * A glassmorphic card material: rounded corners (shader SDF mask, since
 * `PlaneGeometry` can't express `border-radius`), a frosted/blurred
 * translucent backdrop sampled from `uSceneBehindCards` (see
 * spine-refraction.ts), the card's own photo blended in by `uFocus`, and the
 * existing RGB-split glitch (`uIntensity`) + fresnel rim glow layered on
 * top — same glitch mechanism as the previous `glitch-card-material.ts`
 * (`three`'s built-in `GlitchPass` was considered and rejected early on
 * because it glitches the whole frame, not one card at a time; see
 * PLAN-CULTURA-SPINE-3D.md §4/decisiones abiertas).
 */
export function createSpineCardMaterial(
  fallbackTexture: THREE.Texture,
  sceneBehindCardsTexture: THREE.Texture,
  resolution: { width: number; height: number },
  aspect: number,
  seed: number,
): SpineCardMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: fallbackTexture },
      uSceneBehindCards: { value: sceneBehindCardsTexture },
      uResolution: { value: new THREE.Vector2(resolution.width, resolution.height) },
      uIntensity: { value: 0 },
      uSeed: { value: seed },
      uTime: { value: 0 },
      uFocus: { value: 0 },
      uAspect: { value: aspect },
      uImageRepeat: { value: new THREE.Vector2(1, 1) },
      uImageOffset: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
  }) as SpineCardMaterial;
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
