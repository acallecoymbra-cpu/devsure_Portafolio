import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vViewPosition;
  varying vec3 vViewNormal;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

// Original material: screen-space transmission plus a stylized chrome environment.
// The analytic softboxes keep empty/transparent parts of the scene reflective;
// visible cards contribute actual scene color through the offscreen texture.
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  varying vec3 vViewPosition;
  varying vec3 vViewNormal;

  vec3 iridescence(float phase) {
    return 0.5 + 0.5 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.67)));
  }

  vec3 sceneColor(vec2 uv) {
    vec2 border = 0.5 / uResolution;
    vec4 sampleColor = texture2D(uScene, clamp(uv, border, 1.0 - border));
    return mix(vec3(0.008, 0.014, 0.025), sampleColor.rgb, sampleColor.a);
  }

  void main() {
    vec3 normal = normalize(vViewNormal);
    vec3 viewDir = normalize(-vViewPosition);
    float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 3.0);
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    vec2 aspectScale = vec2(uResolution.y / uResolution.x, 1.0);
    vec2 bend = normal.xy * aspectScale * (0.055 + 0.045 * (1.0 - facing));
    vec3 transmitted = sceneColor(screenUv - bend);
    vec3 reflectedDirection = reflect(-viewDir, normal);
    vec3 reflectedScene = sceneColor(screenUv + reflectedDirection.xy * aspectScale * 0.22);

    float strip = pow(max(0.0, 1.0 - abs(reflectedDirection.x * 0.82 + reflectedDirection.y * 0.3 - 0.24)), 24.0);
    float rimStrip = pow(max(0.0, dot(reflectedDirection, normalize(vec3(-0.7, 0.25, 0.6)))), 12.0);
    vec3 rainbow = iridescence(fresnel * 0.65 + reflectedDirection.y * 0.22 + reflectedDirection.x * 0.16);
    vec3 chrome = vec3(0.035, 0.06, 0.085) + strip * vec3(0.7, 0.84, 0.9);
    chrome += rimStrip * vec3(0.12, 0.6, 0.49) + rainbow * (0.1 + fresnel * 0.42);
    vec3 color = mix(transmitted * vec3(0.78, 0.96, 1.0), chrome + reflectedScene * 0.3, 0.68 + fresnel * 0.25);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface SpineRefractionMaterial extends THREE.ShaderMaterial {
  uniforms: {
    uScene: { value: THREE.Texture };
    uResolution: { value: THREE.Vector2 };
  };
}

export function createSpineRefractionMaterial(texture: THREE.Texture): SpineRefractionMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  }) as SpineRefractionMaterial;
}
