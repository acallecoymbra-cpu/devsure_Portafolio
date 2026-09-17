import * as THREE from 'three';
import { createCameraRig } from '@/features/culture/three/spine-camera';
import {
  CARD_HEIGHT,
  CARDS_SCENE_HALF_WIDTH,
  createSpineCards,
  type SpineCardInput,
} from '@/features/culture/three/spine-cards';
import { createSpineColumn, SPINE_HEIGHT, SPINE_HALF_WIDTH } from '@/features/culture/three/spine-geometry';
import { createSpineParticles } from '@/features/culture/three/spine-particles';
import { createSpineRefraction } from '@/features/culture/three/spine-refraction';
import { createSpineRings } from '@/features/culture/three/spine-rings';
import { createTransitionComposite } from '@/features/culture/three/transition-composite';

export type { SpineCardInput };

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

// The column now keeps rotating across a much longer combined scroll range
// (stories + the sections that scroll over it as background, see
// `computeStoryState`), so a single 2π turn across the whole thing would
// read as barely moving during that extra distance.
const SPINE_ROTATION_CYCLES = 2.5;

// How quickly the rendered progress catches up to the raw scroll-derived
// value — see `THREE.MathUtils.damp`. Lower = softer/laggier, higher =
// snappier/closer to 1:1 with scroll.
const PROGRESS_DAMPING = 4.5;

// How far up/down the camera travels (see spine-camera.ts's `buildCameraPath`)
// and how far apart the cards' stations are spread (spine-cards.ts) — a
// fraction of the column's own height, not the full height, so the path
// stays inset from the very top/bottom of the geometry.
const STATION_TRAVEL_HALF_HEIGHT = SPINE_HEIGHT * 0.42;

/**
 * Scrolling rotates the real vertebral geometry around its vertical axis,
 * moves the camera along its path (see `spine-camera.ts`), and slides each
 * story card's position along the coverflow (see `spine-cards.ts`).
 * `rawProgress` is a *damped* value, not the raw scroll-derived one (see
 * `PROGRESS_DAMPING` in the render loop below) — that's what makes the
 * motion read as fluid/eased rather than snapping directly to scroll
 * position.
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
  // Both dimensions clamped to at least 1: `canvasMount` can still be 0×0
  // the instant this runs (e.g. this mounts inside a CSS grid/sticky layout
  // that hasn't settled yet, or right after `next/dynamic`'s client-only
  // swap). An aspect of exactly 0 makes the camera rig's auto-fit divide by
  // a zero horizontal FOV — the resulting Infinity distance builds a
  // degenerate camera path whose `getPointAt` returns undefined, crashing
  // `applyProgress` the moment it runs below. `handleResize`'s observer
  // (see bottom of this function) corrects the real aspect once layout
  // actually reports a size.
  const cameraRig = createCameraRig(
    Math.max(canvasMount.clientWidth, 1) / Math.max(canvasMount.clientHeight, 1),
    CARD_HEIGHT / 2,
    CARDS_SCENE_HALF_WIDTH,
    STATION_TRAVEL_HALF_HEIGHT,
  );
  const camera = cameraRig.camera;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // `alpha: true` above only makes the canvas's alpha channel usable — the
  // renderer still clears to opaque black by default unless told otherwise,
  // which would hide the CSS `.pageBackdrop` behind it. Force a fully
  // transparent clear so that shows through everywhere the scene doesn't
  // draw (also needs the transition composite shader to pass alpha through
  // instead of hardcoding 1.0 — see transition-composite-material.ts).
  renderer.setClearAlpha(0);
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

  const cards = createSpineCards(
    stories,
    refraction.cardsBackdropTexture,
    refraction.cardsResolution,
    STATION_TRAVEL_HALF_HEIGHT,
    () => {
      /* texture arriving mid-frame just shows up on the next scheduled render — no extra render() call needed now that the loop below always runs. */
    },
  );
  scene.add(cards.group);

  let activeIndex = 0;

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
    // The column keeps rotating for the *entire* combined range, story cards
    // or not — this is what makes it read as a continuous animated backdrop
    // while "Lo que cuidamos"/"Nuestra medida"/"Confianza compartida" scroll
    // past. The camera, below, is different: it only travels down through
    // the cards' stations (`storyProgress`), then parks at the bottom once
    // that saturates at 1 — there's nothing further down to descend toward
    // once the story cards are behind.
    spine.group.rotation.y = rawProgress * Math.PI * 2 * SPINE_ROTATION_CYCLES + 0.3;

    // The story cards only exist for the *first* sub-range of the combined
    // scroll distance (there's no card content for the sections beyond
    // them) — 0..1 over just that sub-range, reaching 1 exactly when the
    // foreground's real content is about to appear on screen, and holding
    // there for the rest of the scroll.
    const { progress: storyProgress, headerClearAmount } = computeStoryState();

    // Drives the camera's vertical descent through the cards' stations (see
    // spine-camera.ts) — using `storyProgress`, not `rawProgress`, is what
    // makes "scrolling down" and "the camera travelling down past each
    // card's station" the same motion, instead of two independent clocks.
    cameraRig.applyAt(storyProgress);

    // Slice 9: dim the column once we're past the story cards, so the busy
    // particle/ring surface doesn't compete with the foreground sections'
    // text — a scrim faded in over the last stretch of the story range
    // (see `scrim` in culture-spine-3d.tsx / .spineScrim in
    // culture.module.css), not a hard cut.
    const dimAmount = THREE.MathUtils.smoothstep(storyProgress, 0.82, 1);
    scrim.style.opacity = String(dimAmount * 0.72);

    // Fade out (via scale, not opacity alone — see spine-cards.ts) over the
    // last stretch of the story range so nothing lingers, visible at a
    // screen edge, once scrolling moves into the foreground content — a real
    // bug found by scrolling past this point and screenshotting it. Also
    // faded in only once `headerClearAmount` ramps up: while the hero/
    // heading are still on screen, there's no reason for a card to be
    // floating over them either.
    const fadeOut = headerClearAmount * (1 - THREE.MathUtils.smoothstep(storyProgress, 0.92, 1));
    cards.group.visible = fadeOut > 0.001;

    // `spine-cards.ts` owns each card's station/local-orbit placement
    // (position/rotation/scale/visibility/glass-material uniforms) and
    // reports back which station is currently in focus — driven by the
    // camera's own height, now that it's the camera doing the travelling.
    const frontIndex = cards.place(camera.position.y, storyProgress, fadeOut, elapsed, camera);

    const nextActiveIndex = headerClearAmount >= 1 && storyProgress < 1 ? frontIndex : -1;
    if (nextActiveIndex !== activeIndex) {
      activeIndex = nextActiveIndex;
      onActiveIndexChange?.(activeIndex);
      transition.trigger();
      runTransitionFrames();
    }
  }

  function render() {
    refraction.render(scene, camera, spine.group, cards.group, transition.sceneTarget());
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
    cameraRig.refit(CARD_HEIGHT / 2, CARDS_SCENE_HALF_WIDTH, STATION_TRAVEL_HALF_HEIGHT);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(clientWidth, clientHeight);
    refraction.resize();
    transition.resize();
    // `refraction.resize()` just recreated the cards-backdrop render target
    // (a new texture object + new dimensions) — every card material holds
    // its own reference to the old one and needs it refreshed, the same way
    // `spine-refraction.ts` already refreshes its own column material above.
    cards.materials.forEach((material) => {
      material.uniforms.uSceneBehindCards.value = refraction.cardsBackdropTexture;
      material.uniforms.uResolution.value.set(refraction.cardsResolution.width, refraction.cardsResolution.height);
    });
  }

  window.addEventListener('resize', handleResize);
  // `window`'s own `resize` event only fires when the *viewport* changes —
  // it never catches `canvasMount` going from the degenerate 0×0 above to
  // its real size purely from layout settling (grid/sticky positioning,
  // the client-only spine mounting in). A `ResizeObserver` on the element
  // itself catches that too, so a bad initial aspect/camera path gets
  // corrected as soon as real dimensions are known, not just on an actual
  // window resize.
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(canvasMount);

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(transitionFrame);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
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
