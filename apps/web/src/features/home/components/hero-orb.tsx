'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

/**
 * Orbe iridiscente con anillo — hero de DevSure.
 *
 * Sin texturas ni modelos externos: toda la superficie es procedural (GLSL),
 * así que pesa lo que pesa el componente y no suma requests.
 *
 * Uso:
 *   <HeroOrb className="absolute right-0 top-0 h-[620px] w-[620px]" />
 */

type HeroOrbProps = {
  className?: string;
  /** Usá uno de los presets de PALETTES, o pasá tus propios hex. */
  palette?: {
    deep: string;
    mid: string;
    hot: string;
    light: string;
  };
};

/**
 * Presets. `brand` es el teal del botón "Ver servicios" (#2DD4BF) llevado a rampa.
 * La deriva hacia el cian profundo es lo que hace que la superficie lea como
 * aceite iridiscente y no como plástico pintado de un solo color.
 */
export const PALETTES = {
  brand: {
    deep: '#031F26',
    mid: '#0E7490',
    hot: '#2DD4BF',
    light: '#A7F3E4',
  },
  /** Más contraste: el fondo del orbe casi negro, el teal solo en las crestas. */
  brandDeep: {
    deep: '#02121A',
    mid: '#115E59',
    hot: '#2DD4BF',
    light: '#CCFBF1',
  },
  /** Teal de marca con vetas violeta: puente entre tu botón y la referencia. */
  duotone: {
    deep: '#1A0B33',
    mid: '#0F766E',
    hot: '#2DD4BF',
    light: '#C4B5FD',
  },
  violet: {
    deep: '#150630',
    mid: '#4C1D95',
    hot: '#7C3AED',
    light: '#C4B5FD',
  },
} as const;

const DEFAULT_PALETTE = PALETTES.brand;

const NOISE_GLSL = /* glsl */ `
  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float gnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(dot(hash3(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
            dot(hash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
        mix(dot(hash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
            dot(hash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
      mix(
        mix(dot(hash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
            dot(hash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
        mix(dot(hash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
            dot(hash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y),
      u.z);
  }

  float fbm(vec3 p) {
    float amp = 0.5;
    float sum = 0.0;
    for (int i = 0; i < 4; i++) {
      sum += amp * gnoise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return sum;
  }
`;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uDisplace;
  uniform float uNoiseScale;
  uniform float uFlow;

  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosO;

  ${NOISE_GLSL}

  float displace(vec3 p) {
    return fbm(p * uNoiseScale + vec3(0.0, 0.0, uTime * uFlow));
  }

  void main() {
    vec3 p = position + normal * displace(position) * uDisplace;

    vec3 helper = abs(normal.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 t1 = normalize(cross(normal, helper));
    vec3 t2 = normalize(cross(normal, t1));
    float e = 0.06;

    vec3 pa = (position + t1 * e) + normal * displace(position + t1 * e) * uDisplace;
    vec3 pb = (position + t2 * e) + normal * displace(position + t2 * e) * uDisplace;

    vec3 n = normalize(cross(pa - p, pb - p));
    if (dot(n, normal) < 0.0) n = -n;

    vPosO = position;
    vNormalW = normalize(mat3(modelMatrix) * n);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vPosW = world.xyz;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBands;
  uniform float uSheen;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uHot;
  uniform vec3 uLight;

  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosO;

  ${NOISE_GLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);

    vec3 q = vPosO * 2.1;
    vec3 warp = vec3(
      fbm(q + vec3(0.0, 0.0, uTime * 0.06)),
      fbm(q + vec3(5.2, 1.3, 0.0)),
      fbm(q + vec3(9.7, 4.1, 0.0))
    );
    float band = fbm(q * 1.5 + warp * 2.6 + N * 0.7) * 0.5 + 0.5;

    vec3 col = mix(uDeep, uMid, smoothstep(0.18, 0.62, band));
    col = mix(col, uHot, smoothstep(0.52, 0.86, band));
    col = mix(col, uLight, pow(smoothstep(0.76, 1.0, band), 2.0));

    float filament = smoothstep(0.90, 1.0, abs(sin(band * uBands + uTime * 0.25)));
    col += vec3(1.0) * filament * uSheen;

    vec3 L = normalize(vec3(0.55, 0.85, 0.75));
    vec3 H = normalize(L + V);
    col += vec3(1.0) * pow(max(dot(N, H), 0.0), 72.0) * 0.7;
    col += uLight * fresnel * 0.5;

    gl_FragColor = vec4(col, uOpacity);
  }
`;

export default function HeroOrb({ className, palette = DEFAULT_PALETTE }: HeroOrbProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const group = new THREE.Group();
    group.rotation.z = 0.18;
    scene.add(group);

    const makeUniforms = (over: Record<string, THREE.IUniform>) => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uDisplace: { value: 0.24 },
      uNoiseScale: { value: 1.35 },
      uFlow: { value: 0.1 },
      uBands: { value: 15.0 },
      uSheen: { value: 0.45 },
      uDeep: { value: new THREE.Color(palette.deep) },
      uMid: { value: new THREE.Color(palette.mid) },
      uHot: { value: new THREE.Color(palette.hot) },
      uLight: { value: new THREE.Color(palette.light) },
      ...over,
    });

    const makeMaterial = (over: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: makeUniforms(over),
        transparent: true,
      });

    const blobMat = makeMaterial({});
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 24), blobMat);
    blob.rotation.set(0.3, 0.6, 0.1);
    group.add(blob);

    const ringMat = makeMaterial({
      uDisplace: { value: 0.05 },
      uNoiseScale: { value: 2.4 },
      uFlow: { value: 0.16 },
      uBands: { value: 26.0 },
      uSheen: { value: 0.7 },
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.3, 40, 220), ringMat);
    ring.rotation.set(0.12, 1.12, 0.44);
    group.add(ring);

    const satMats: THREE.ShaderMaterial[] = [];
    const satellites: Array<{ mesh: THREE.Mesh; radius: number; speed: number; phase: number; y: number }> = [
      { radius: 3.0, speed: 0.16, phase: 0.4, y: 1.5 },
      { radius: 3.3, speed: -0.11, phase: 2.6, y: -1.1 },
      { radius: 2.7, speed: 0.09, phase: 4.4, y: -1.9 },
    ].map((cfg) => {
      const mat = makeMaterial({ uDisplace: { value: 0.1 }, uNoiseScale: { value: 2.8 }, uBands: { value: 20.0 } });
      satMats.push(mat);
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 12), mat);
      group.add(mesh);
      return { mesh, ...cfg };
    });

    const allMats = [blobMat, ringMat, ...satMats];

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduced) window.addEventListener('pointermove', onPointerMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);

      for (const m of allMats) m.uniforms.uTime.value = reduced ? 0.0 : t;

      if (!reduced) {
        group.rotation.y += dt * 0.14;
        ring.rotation.z += dt * 0.06;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        group.rotation.x = 0.1 + pointer.y * 0.12;
        camera.position.x = pointer.x * 0.35;
        camera.lookAt(0, 0, 0);

        for (const s of satellites) {
          const a = t * s.speed + s.phase;
          s.mesh.position.set(Math.cos(a) * s.radius, s.y + Math.sin(a * 1.3) * 0.2, Math.sin(a) * s.radius);
        }
      } else {
        for (const s of satellites) {
          s.mesh.position.set(Math.cos(s.phase) * s.radius, s.y, Math.sin(s.phase) * s.radius);
        }
      }

      renderer.render(scene, camera);
    });

    const tl = gsap.timeline();
    tl.to(
      allMats.map((m) => m.uniforms.uOpacity),
      { value: 1, duration: reduced ? 0 : 1.1, ease: 'power2.out', stagger: 0.06 },
    ).from(group.scale, { x: 0.86, y: 0.86, z: 0.86, duration: reduced ? 0 : 1.4, ease: 'power3.out' }, 0);

    return () => {
      tl.kill();
      renderer.setAnimationLoop(null);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [palette]);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
