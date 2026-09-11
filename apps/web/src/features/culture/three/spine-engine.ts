import * as THREE from 'three';
import {
  createFallbackTexture,
  createGlitchCardMaterial,
  type GlitchCardMaterial,
} from '@/features/culture/three/glitch-card-material';

import { createSpineColumn, SPINE_HEIGHT, SPINE_HALF_WIDTH } from '@/features/culture/three/spine-geometry';
import { createSpineParticles } from '@/features/culture/three/spine-particles';
import { createSpineRefraction } from '@/features/culture/three/spine-refraction';
import { createSpineRings } from '@/features/culture/three/spine-rings';
import { createTransitionComposite } from '@/features/culture/three/transition-composite';

export interface SpineCardInput {
  id: string;
  imageSrc: string;
}

export interface SpineEngineElements {
  /** The element whose bounding rect drives scroll progress — the combined background region spanning the story cards *and* the sections that scroll over the pinned column as foreground content (Slice 9). */
  scrollTrigger: HTMLElement;
  /** The `position: sticky` element the canvas is sized to and appended into. */
  canvasMount: HTMLElement;
  /** Empty spacer, first in the foreground content, giving the 3 story cards their scroll room before the real foreground sections begin — see `computeStoryProgress`. */
  storySpacer: HTMLElement;
  /** Overlay dimmed in behind the foreground sections (Slice 9) so the busy particle/ring column doesn't fight with their text — see `applyProgress`'s `dimAmount`. */
  scrim: HTMLElement;
}

export interface SpineEngineHandle {
  dispose: () => void;
}

// Slice 9: user feedback was that the column and cards read as too small
// against the reference (activetheory.net/work) — bumped from 2.
const CARD_WIDTH = 2.4;
const CARD_ASPECT = 1672 / 941; // apps/web/src/features/culture/culture-content.ts image dimensions
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
// Interior vertices so the idle wave (Slice 8.4) reads as a surface ripple
// instead of the whole plane rocking rigidly around its 4 corners.
const CARD_SEGMENTS_X = 12;
const CARD_SEGMENTS_Y = 18;
const CARD_FALLBACK_COLOR = 0x172236; // --surface-raised, shown until a texture loads or if it fails

// Slice 9 (second pass): cards now orbit the column on a fixed-radius ring
// instead of sliding in from a side — the user pointed at a reference
// (videos muestra/fotos referencia) showing panels arranged *around* a
// central column, not flat cards parked beside it. One full orbit
// (`ORBIT_TURNS`) happens across the story cards' sub-range of the combined
// scroll (see `computeStoryProgress`), so with 3 evenly-spaced cards each
// gets one turn facing the camera, same spirit as the old 3-band system.
const ORBIT_RADIUS = 2.6;
const ORBIT_TURNS = 1;
// Slow, small, independent-per-card bobbing so the cards read as floating
// in zero-gravity rather than rigidly locked to the orbit ring, per the
// user's "floating slowly, like in space" request — driven by the idle
// clock (elapsed wall-clock time), not scroll progress.
const CARD_FLOAT_AMPLITUDE = 0.18;
const CARD_FLOAT_SPEED = 0.35;

// Half-width of the whole scene (spine + the orbit ring the cards travel
// on), used to keep the camera fit from clipping cards horizontally.
const SCENE_HALF_WIDTH = ORBIT_RADIUS + CARD_WIDTH / 2;

// Slice 9: the column now keeps rotating across a much longer combined
// scroll range (stories + the sections that scroll over it as background,
// see `computeStoryProgress`), so a single 2π turn across the whole thing
// (the original Slice 8.1 value) would read as barely moving during that
// extra distance. First-pass tuning, not calibrated against the user yet.
const SPINE_ROTATION_CYCLES = 2.5;

// How quickly the rendered progress catches up to the raw scroll-derived
// value (Slice 9, "more fluid" feedback) — see `THREE.MathUtils.damp`.
// Lower = softer/laggier, higher = snappier/closer to 1:1 with scroll.
const PROGRESS_DAMPING = 4.5;

interface CardsResult {
  group: THREE.Group;
  materials: GlitchCardMaterial[];
  meshes: THREE.Mesh[];
  dispose: () => void;
}

/**
 * One flat card per story, orbiting the column on a ring of radius
 * `ORBIT_RADIUS` (see `applyProgress` for the angle math). Textures load
 * asynchronously; each card shows `CARD_FALLBACK_COLOR` until its image
 * resolves (or forever, if it fails — same spirit as the CSS fallback's
 * `mediaFallback`, without trying to render the `alt` text inside WebGL,
 * since the real alt text already lives in the HTML caption
 * `CultureSpineScene` renders alongside this canvas).
 */
function createCards(stories: readonly SpineCardInput[], onTextureLoaded: () => void): CardsResult {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_SEGMENTS_X, CARD_SEGMENTS_Y);
  const loader = new THREE.TextureLoader();
  const fallbackTexture = createFallbackTexture(CARD_FALLBACK_COLOR);
  const textures: THREE.Texture[] = [];
  const materials: GlitchCardMaterial[] = [];
  const meshes: THREE.Mesh[] = [];
  // A texture load can resolve after `dispose()` already ran (fast
  // navigation away). Guard against assigning it to an about-to-be-freed
  // material and instead dispose it immediately on arrival.
  let disposed = false;

  stories.forEach((story, index) => {
    const material = createGlitchCardMaterial(fallbackTexture, index * 13.37);
    materials.push(material);

    loader.load(
      story.imageSrc,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (disposed) {
          texture.dispose();
          return;
        }
        textures.push(texture);
        material.uniforms.map.value = texture;
        onTextureLoaded();
      },
      undefined,
      () => {
        // Keep the fallback texture; the accessible caption still carries
        // the real copy and alt text regardless of whether this loaded.
      },
    );

    const mesh = new THREE.Mesh(geometry, material);
    meshes.push(mesh);
    group.add(mesh);
  });

  return {
    group,
    materials,
    meshes,
    dispose: () => {
      disposed = true;
      geometry.dispose();
      fallbackTexture.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}

/** Distance along +z needed for the whole scene (spine + the cards' orbit ring) to fit, at any aspect ratio. */
function fitDistanceForScene(camera: THREE.PerspectiveCamera, aspect: number): number {
  // Slice 9: reduced from 1.35 — less headroom means the camera sits
  // closer, so the column/cards fill noticeably more of the frame (bigger
  // *is* mostly a "camera distance" question here: fitDistanceForScene
  // already auto-fits the whole scene, so scaling up the geometry itself
  // wouldn't look any bigger on screen — the camera would just back away
  // by the same factor). Still enough headroom for the camera path's own
  // lateral/vertical drift (buildCameraPath) not to clip anything.
  const margin = 1.12;

  const verticalFov = (camera.fov * Math.PI) / 180;
  const distanceForHeight = SPINE_HEIGHT / 2 / Math.tan(verticalFov / 2);

  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const distanceForWidth = SCENE_HALF_WIDTH / Math.tan(horizontalFov / 2);

  return Math.max(distanceForHeight, distanceForWidth) * margin;
}

/**
 * Slice 8.2: the camera's *path*, not just a static point — a closed set of
 * control points orbiting loosely around `distance` (the still-image fit
 * from `fitDistanceForScene`), so scrolling through it feels like a real
 * camera move (banking side to side, dollying slightly in/out) on top of
 * the column's own rotation from Slice 8.1 (untouched, orthogonal to this).
 * Offsets are kept well inside `fitDistanceForScene`'s margin so neither the
 * spine nor the orbiting cards clip at any point on the path.
 */
function buildCameraPath(distance: number): THREE.CatmullRomCurve3 {
  const lateral = distance * 0.1;
  const vertical = distance * 0.05;
  const depth = distance * 0.08;
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-lateral, vertical * 0.6, distance + depth * 0.4),
      new THREE.Vector3(lateral * 0.7, -vertical, distance - depth),
      new THREE.Vector3(-lateral * 0.4, vertical, distance + depth),
      new THREE.Vector3(lateral, -vertical * 0.5, distance - depth * 0.6),
      new THREE.Vector3(-lateral * 0.8, vertical * 0.3, distance + depth * 0.7),
      new THREE.Vector3(lateral * 0.5, -vertical * 0.8, distance - depth * 0.3),
    ],
    false,
    'catmullrom',
    0.5,
  );
}

/**
 * Scrolling rotates the real vertebral geometry around its vertical axis,
 * moves the camera along `cameraPath`, and orbits each story card around
 * the column (Slice 9). `rawProgress` is a *damped* value, not the raw
 * scroll-derived one (see `PROGRESS_DAMPING` in the render loop below) —
 * that's what makes the motion read as fluid/eased rather than snapping
 * directly to scroll position.
 *
 * Never pins the section or alters native scroll behavior — layout is only
 * ever read (`getBoundingClientRect()`), never written.
 * `CultureSpineScene` already gates on `prefers-reduced-motion` before this
 * engine ever mounts, so there's no second check here.
 *
 * `onActiveIndexChange` fires only when the front-facing card changes (at
 * most `stories.length - 1` times across the story cards' sub-range), never
 * every frame, so the caller can safely drive React state from it. It's
 * called with `-1` once scrolling moves past the story cards into the
 * foreground content (Slice 9) — the caller's cue to stop showing a story
 * caption over the now-background column.
 */
export function mountSpineEngine(
  { scrollTrigger, canvasMount, storySpacer, scrim }: SpineEngineElements,
  stories: readonly SpineCardInput[],
  onActiveIndexChange?: (index: number) => void,
): SpineEngineHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    canvasMount.clientWidth / Math.max(canvasMount.clientHeight, 1),
    0.1,
    100,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvasMount.clientWidth, canvasMount.clientHeight);
  canvasMount.appendChild(renderer.domElement);

  const refraction = createSpineRefraction(renderer);
  const transition = createTransitionComposite(renderer);
  const spine = createSpineColumn(refraction.material);
  scene.add(spine.group);

  // Slice 9: a particle "dust aura" (rotates with the column, so it's a
  // child of spine.group) plus a few independently-spinning tilted rings
  // (added straight to the scene instead), styled after the reference clip
  // — see spine-particles.ts/spine-rings.ts for why each is structured
  // that way.
  const particles = createSpineParticles(SPINE_HEIGHT, SPINE_HALF_WIDTH);
  spine.group.add(particles.points);
  const rings = createSpineRings();
  scene.add(rings.group);

  const cards = createCards(stories, () => {
    /* texture arriving mid-frame just shows up on the next scheduled render — no extra render() call needed now that the loop below always runs. */
  });
  scene.add(cards.group);

  let activeIndex = 0;
  let cameraPath = buildCameraPath(fitDistanceForScene(camera, camera.aspect));

  /**
   * 0 at the very start, reaching 1 exactly when `storySpacer` (the empty
   * div marking the story cards' scroll room, before the real foreground
   * sections in the DOM — see culture-spine-3d.tsx) has scrolled enough
   * that its *bottom* edge reaches the viewport's bottom — i.e. the instant
   * before any pixel of the real foreground content (starting with
   * `principlesSection`'s heading) could possibly appear on screen, entering
   * from below. Deliberately **not** "the spacer has fully scrolled past
   * the viewport's top" (`rect.bottom <= 0`, a first cut at this that
   * still had a bug): that leaves a whole viewport-height's worth of
   * scroll distance during which the spacer's bottom is still inside the
   * viewport (so this progress hadn't reached 1 yet, and the story caption
   * was still showing) while `principlesSection`'s heading had *already*
   * scrolled up into view from below — caught overlapping the caption on a
   * 360px-wide screenshot. Measured fresh every call (same "no cached
   * layout" rule as `progressFromLayout`), directly from the spacer's own
   * geometry — not a fraction of some other element's height — so it stays
   * correct regardless of viewport size or any section's real content
   * length.
   *
   * Also returns `headerClearAmount`: 0 while `storySpacer`'s *top* hasn't
   * reached the viewport's top yet, ramping to 1 over the following
   * `HEADER_CLEAR_DISTANCE` px — i.e. whether (and how fully) the header
   * content before it (Slice 9.6: the hero and "Quiénes somos" heading, now
   * foreground content scrolling over the column too) has scrolled out of
   * the pinned viewport. Story progress alone reaching >0 doesn't imply
   * this — with real header content before the spacer, `progress` can
   * already be 0 (its natural resting value before any scroll into this
   * element at all) while the header still fills the screen, which without
   * this check left the story caption showing — and overlapping the hero's
   * own heading — at the very top of the page, a real bug caught on a
   * screenshot. A smoothed ramp rather than a hard boolean so the cards
   * fade in gently instead of popping in at a specific scroll pixel.
   */
  function computeStoryState(): { progress: number; headerClearAmount: number } {
    const rect = storySpacer.getBoundingClientRect();
    const revealDistance = Math.max(1, rect.height - window.innerHeight);
    const scrolled = rect.height - rect.bottom;
    const HEADER_CLEAR_DISTANCE = 120;
    return {
      progress: Math.min(1, Math.max(0, scrolled / revealDistance)),
      headerClearAmount: THREE.MathUtils.smoothstep(-rect.top, 0, HEADER_CLEAR_DISTANCE),
    };
  }

  function applyProgress(rawProgress: number, elapsed: number) {
    // The column keeps rotating and the camera keeps drifting along its
    // path for the *entire* combined range, story cards or not — this is
    // what makes the column read as a continuous animated backdrop while
    // "Lo que cuidamos"/"Nuestra medida"/"Confianza compartida" scroll past.
    spine.group.rotation.y = rawProgress * Math.PI * 2 * SPINE_ROTATION_CYCLES + 0.3;

    const here = cameraPath.getPointAt(rawProgress);
    const ahead = cameraPath.getPointAt(Math.min(1, rawProgress + 0.02));
    camera.position.copy(here);
    // Look mostly at the column (origin's x/y), biased slightly toward
    // where the path is heading next, so turns read as the camera
    // steering rather than just sliding sideways.
    camera.lookAt(2 * (ahead.x - here.x), 2 * (ahead.y - here.y), 0);

    // The story cards only exist for the *first* sub-range of the combined
    // scroll distance (there's no card content for the sections beyond
    // them) — 0..1 over just that sub-range, reaching 1 exactly when the
    // foreground's real content is about to appear on screen, and holding
    // there for the rest of the scroll.
    const { progress: storyProgress, headerClearAmount } = computeStoryState();

    // Slice 9: dim the column once we're past the story cards, so the busy
    // particle/ring surface doesn't compete with the foreground sections'
    // text — a scrim faded in over the last stretch of the story range
    // (see `scrim` in culture-spine-3d.tsx / .spineScrim in
    // culture.module.css), not a hard cut.
    const dimAmount = THREE.MathUtils.smoothstep(storyProgress, 0.82, 1);
    scrim.style.opacity = String(dimAmount * 0.72);

    // Cards orbit together on one ring, `ORBIT_TURNS` full turns across the
    // story sub-range; each starts at its own evenly-spaced angle so with 3
    // cards every one gets a turn facing the camera (angle ≈ 0). A plane's
    // default normal is +Z, so `rotation.y = angle` keeps each card facing
    // outward along its own orbit position — which also means a card on the
    // far side (angle ≈ π) faces away from the camera and is naturally
    // backface-culled instead of needing separate hide logic.
    const orbitAngle = storyProgress * Math.PI * 2 * ORBIT_TURNS;
    // Fade out (via scale, not opacity — the shader has no alpha control)
    // over the last stretch of the story range so nothing lingers, visible
    // at a screen edge, once scrolling moves into the foreground content —
    // a real bug found by scrolling past this point and screenshotting it.
    // Also faded in only once `headerClearAmount` ramps up (Slice 9.6):
    // while the hero/heading are still on screen, there's no reason for a
    // card to be floating over them either.
    const fadeOut = headerClearAmount * (1 - THREE.MathUtils.smoothstep(storyProgress, 0.92, 1));
    cards.group.visible = fadeOut > 0.001;

    let frontIndex = 0;
    let frontBest = -Infinity;

    cards.meshes.forEach((mesh, index) => {
      const baseAngle = (index / stories.length) * Math.PI * 2;
      const angle = baseAngle + orbitAngle;
      const frontAmount = (Math.cos(angle) + 1) / 2; // 1 facing the camera, 0 at the back
      if (frontAmount > frontBest) {
        frontBest = frontAmount;
        frontIndex = index;
      }

      // Slow, per-card bob driven by wall-clock time, not scroll — the
      // "floating slowly, like in space" feel the user asked for, layered
      // on top of the scroll-driven orbit position.
      const floatY = Math.sin(elapsed * CARD_FLOAT_SPEED + index * 2.1) * CARD_FLOAT_AMPLITUDE;

      mesh.position.set(Math.sin(angle) * ORBIT_RADIUS, floatY, Math.cos(angle) * ORBIT_RADIUS);
      mesh.rotation.y = angle;
      mesh.scale.setScalar(fadeOut);
      cards.materials[index].uniforms.uIntensity.value = 1 - frontAmount;
    });

    const nextActiveIndex = headerClearAmount >= 1 && storyProgress < 1 ? frontIndex : -1;
    if (nextActiveIndex !== activeIndex) {
      activeIndex = nextActiveIndex;
      onActiveIndexChange?.(activeIndex);
      transition.trigger();
      runTransitionFrames();
    }
  }

  function render() {
    refraction.render(scene, camera, spine.group, transition.sceneTarget());
    transition.blit();
  }

  // The transition's glitch decays over wall-clock time (see
  // transition-composite.ts), not scroll progress. Now that the main loop
  // below renders every frame regardless, this is technically redundant
  // (the loop alone would keep the decay visible), but it's left as its own
  // short-lived, self-terminating loop rather than folded away — it stops
  // itself as soon as `transition.isActive()` goes false, cheap insurance
  // if the main loop's gating ever changes independently of this one.
  let transitionFrame = 0;
  function runTransitionFrames() {
    if (disposed || !transition.isActive()) return;
    render();
    transitionFrame = requestAnimationFrame(runTransitionFrames);
  }

  /** Fresh every call — 0 when `scrollTrigger`'s top reaches the viewport's bottom, 1 when its bottom reaches the viewport's top. */
  function progressFromLayout(): number {
    const rect = scrollTrigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const span = viewportHeight + rect.height;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (viewportHeight - rect.top) / span));
  }

  let disposed = false;

  // Slice 9: a single continuous render loop, replacing the older split
  // between a scroll/resize-triggered `applyProgress` call and a separate
  // idle rAF loop (Slice 8.4) for the cards' wave/fresnel time uniform.
  // Two reasons to merge them:
  //   1. "More fluid" motion (user feedback) needs `smoothedProgress` to
  //      ease toward the raw scroll-derived value every frame
  //      (`THREE.MathUtils.damp`), which only makes sense driven by a
  //      continuous loop, not discrete scroll events.
  //   2. With that loop already running every frame, there's no reason left
  //      to *also* listen for `scroll` — `progressFromLayout()` is cheap
  //      (one `getBoundingClientRect()`, no forced reflow) and reading it
  //      fresh every animation frame is simpler than throttling scroll
  //      events, and can never fall behind or need its own rAF throttle.
  // `resize` is still a real event listener below — camera aspect/renderer
  // size/render-target recreation are comparatively expensive and only
  // need to happen when the viewport actually changes, not every frame.
  const clock = new THREE.Clock();
  let smoothedProgress = progressFromLayout();
  let frameId = 0;
  function frame() {
    if (disposed) return;
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    const targetProgress = progressFromLayout();
    smoothedProgress = THREE.MathUtils.damp(smoothedProgress, targetProgress, PROGRESS_DAMPING, delta);
    applyProgress(smoothedProgress, elapsed);
    cards.materials.forEach((material) => {
      material.uniforms.uTime.value = elapsed;
    });
    rings.update(elapsed);
    particles.update(elapsed);
    render();
    frameId = requestAnimationFrame(frame);
  }

  applyProgress(smoothedProgress, 0);
  render();
  frameId = requestAnimationFrame(frame);

  function handleResize() {
    const { clientWidth, clientHeight } = canvasMount;
    if (clientWidth === 0 || clientHeight === 0) return;
    camera.aspect = clientWidth / clientHeight;
    cameraPath = buildCameraPath(fitDistanceForScene(camera, camera.aspect));
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(clientWidth, clientHeight);
    refraction.resize();
    transition.resize();
  }

  window.addEventListener('resize', handleResize);

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(transitionFrame);
      window.removeEventListener('resize', handleResize);
      cards.dispose();
      spine.dispose();
      particles.dispose();
      rings.dispose();
      refraction.dispose();
      transition.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === canvasMount) {
        canvasMount.removeChild(renderer.domElement);
      }
    },
  };
}
