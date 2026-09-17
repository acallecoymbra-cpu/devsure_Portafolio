import * as THREE from 'three';
import {
  createFallbackTexture,
  createSpineCardMaterial,
  type SpineCardMaterial,
} from '@/features/culture/three/spine-card-material';

export interface SpineCardInput {
  id: string;
  imageSrc: string;
}

// Narrative-column redesign, third pass: a real circular orbit (previous
// pass, billboard-corrected so no card ever goes edge-on) fixed the
// visibility problem, but every card still lived at roughly the same height
// — the *only* thing scroll drove was rotation around a fixed point, so
// scrolling read as "cards spinning in place", never as descending past
// them. The user asked explicitly for that vertical sense of travel, like
// the reference: cards already feel positioned top-to-bottom along the
// column, and scrolling reveals each one roughly in front in turn. Fix:
// each card now lives at its own fixed height ("station") spread across
// `STATION_TRAVEL_HALF_HEIGHT` (top to bottom), and it's the *camera* that
// travels down through that same range as the user scrolls (see
// `spine-camera.ts`) — a station comes "into focus" when the camera's own
// height passes near it. Each card also slowly orbits its own station on a
// small ring — the circular motion the user asked to keep — but (a real
// bug caught by the user: it kept spinning on its own even at rest) that
// spin is driven by `storyProgress`, not elapsed time, so it only advances
// while actually scrolling and freezes the instant scrolling stops. The
// only thing still driven by wall-clock time is the small vertical float
// bob — a card "floating on its own axis" in place, not translating.
const CARD_WIDTH = 2.4;
const CARD_ASPECT = 1672 / 941; // apps/web/src/features/culture/culture-content.ts image dimensions
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT;
// Interior vertices so the idle wave (glass material's vertex shader) reads
// as a surface ripple instead of the whole plane rocking rigidly around its
// 4 corners.
const CARD_SEGMENTS_X = 12;
const CARD_SEGMENTS_Y = 18;
const CARD_FALLBACK_COLOR = 0x172236; // --surface-raised, shown until a texture loads or if it fails

// Small local ring each card spins around its own station — driven by
// `storyProgress` (see `place()`), never by elapsed time: the user
// explicitly asked that a card never move on its own — only while actually
// scrolling. `LOCAL_ORBIT_TURNS` is how many full laps a card completes
// across the *entire* story range (not tied to its own station) — small
// enough to read as gentle motion accumulated over a lot of scrolling, not
// a fast spin.
const ORBIT_RADIUS = 1.7;
const LOCAL_ORBIT_TURNS = 0.6;
// How far (in camera-height units) a card is still considered "in focus"
// around its own station — half of the typical spacing between consecutive
// stations, so at most one card is ever strongly in focus at a time.
const STATION_FOCUS_RANGE = 1.4;

// Real edge case the user caught: card 0's own focus point IS
// `storyProgress = 0` — the very instant the story section starts — so it
// has no "before focus" runway at all; without this, it's born dead-center
// (`angle = 0`) and immediately starts receding to the right the moment
// any scrolling happens, never actually visiting the left side the other
// cards start from. A small constant head-start added to every card's
// angle fixes this uniformly (not just as a special case for index 0):
// every card, including the first, now starts measurably left-of-center,
// and reaches its own geometric front slightly *after* its height-focus
// moment (`cos(LOCAL_ORBIT_PHASE_BIAS) ≈ 0.94`, nowhere near the `cos < 0`
// "behind the column" danger zone) instead of exactly at it.
const LOCAL_ORBIT_PHASE_BIAS = 0.35;
// How far (world units) a card's local orbit dips vertically as it swings
// from its left/approach side to its right/recede side — the user asked
// for that left-to-right sweep to read as *descending*, not as a flat,
// purely horizontal circle (which is all `ORBIT_RADIUS` alone produces).
const VERTICAL_ARC_DROP = 0.4;

// Real bug the user caught (screenshot showing the full-screen transition
// glitch stuck at maximum intensity instead of a brief flash): right at the
// halfway point between two stations, `focus` for both cards is nearly
// identical, so which one wins `Math.max` can flip every single frame from
// sub-pixel camera movement (or the user just lingering/scrolling slowly
// through that zone) — and `transition-composite.ts`'s `trigger()` resets
// its decay timer on *every* index change, so a flickering front index kept
// re-triggering the glitch before it ever finished decaying, pinning it
// visually "frozen" at full intensity. Fix: the reported front index only
// switches once a challenger clearly beats the current one (`SWITCH_MARGIN`)
// and enough wall-clock time has passed since the last switch
// (`MIN_SWITCH_INTERVAL`, matched to the composite's own decay duration) —
// see the `stableIndex` bookkeeping in `place()`.
const SWITCH_MARGIN = 0.12;
const MIN_SWITCH_INTERVAL = 0.6; // seconds

// Slow, small, independent-per-card bobbing so the cards read as floating in
// zero-gravity rather than rigidly locked to their station — driven by the
// idle clock (elapsed wall-clock time), not scroll progress.
const CARD_FLOAT_AMPLITUDE = 0.16;
const CARD_FLOAT_SPEED = 0.35;

/** Half-width of the whole scene the local orbit rings need — used by the camera rig's auto-fit. */
export const CARDS_SCENE_HALF_WIDTH = ORBIT_RADIUS + CARD_WIDTH / 2;
export { CARD_HEIGHT };

export interface SpineCards {
  group: THREE.Group;
  materials: SpineCardMaterial[];
  meshes: THREE.Mesh[];
  /** Advances every card's station/local-orbit position for this frame and billboards each to face `camera`; returns the current in-focus card's index. */
  place: (cameraY: number, storyProgress: number, globalFadeOut: number, elapsed: number, camera: THREE.Camera) => number;
  dispose: () => void;
}

/**
 * One glass card per story (see spine-card-material.ts), each parked at its
 * own fixed-height "station" along the column (spread across
 * `stationTravelHalfHeight`, top to bottom) and slowly orbiting that station
 * on a small ring, always billboarded to face the camera (see `place()`).
 * Textures load asynchronously; each card shows `CARD_FALLBACK_COLOR` until
 * its image resolves (or forever, if it fails — the real story copy stays
 * accessible as a static, visually-hidden list elsewhere on the page, see
 * `CultureSpineScene`; this canvas is purely decorative and never needs to
 * render text itself).
 */
export function createSpineCards(
  stories: readonly SpineCardInput[],
  sceneBehindCardsTexture: THREE.Texture,
  cardsResolution: { width: number; height: number },
  stationTravelHalfHeight: number,
  onTextureLoaded: () => void,
): SpineCards {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_SEGMENTS_X, CARD_SEGMENTS_Y);
  const loader = new THREE.TextureLoader();
  const fallbackTexture = createFallbackTexture(CARD_FALLBACK_COLOR);
  const textures: THREE.Texture[] = [];
  const materials: SpineCardMaterial[] = [];
  const meshes: THREE.Mesh[] = [];
  // A texture load can resolve after `dispose()` already ran (fast
  // navigation away). Guard against assigning it to an about-to-be-freed
  // material and instead dispose it immediately on arrival.
  let disposed = false;

  // See `SWITCH_MARGIN`/`MIN_SWITCH_INTERVAL` above — the front index
  // `place()` reports is debounced through this, not the raw per-frame max.
  let stableIndex = 0;
  let lastSwitchElapsed = -Infinity;

  stories.forEach((story, index) => {
    const material = createSpineCardMaterial(
      fallbackTexture,
      sceneBehindCardsTexture,
      cardsResolution,
      CARD_ASPECT,
      index * 13.37,
    );
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

  const stationCount = Math.max(1, stories.length - 1);
  function stationY(index: number): number {
    return THREE.MathUtils.lerp(stationTravelHalfHeight, -stationTravelHalfHeight, index / stationCount);
  }

  function place(
    cameraY: number,
    storyProgress: number,
    globalFadeOut: number,
    elapsed: number,
    camera: THREE.Camera,
  ): number {
    let heroIndex = 0;
    let heroBestFocus = -Infinity;
    const focuses: number[] = [];

    meshes.forEach((mesh, index) => {
      const y = stationY(index);
      // 1 when the camera's current height is right at this card's station,
      // fading to 0 within `STATION_FOCUS_RANGE` either side — this is what
      // makes "scrolling down past a station" read as that card coming into
      // focus, instead of a fixed angle sweeping past a static camera.
      const focus = 1 - THREE.MathUtils.smoothstep(Math.abs(cameraY - y), 0, STATION_FOCUS_RANGE);
      focuses.push(focus);
      if (focus > heroBestFocus) {
        heroBestFocus = focus;
        heroIndex = index;
      }

      // Local spin around this card's own station, driven by `storyProgress`
      // — advances only while the user is actually scrolling, frozen
      // otherwise. The small vertical bob below is the *only* motion left
      // that runs on its own (wall-clock elapsed time) — a card idly
      // "floating on its own axis" in place, never translating around the
      // ring, by itself.
      //
      // Real bug the user caught: with a plain `storyProgress`-only angle
      // (every card starting from the *same* angle 0 and spinning at the
      // *same* rate), whichever angle a card happened to be at once the
      // camera reached its own station was pure coincidence — some cards
      // ended up swinging in *behind* the column (z < 0, `cos(angle)` below
      // 0) exactly when they were supposed to be the one in focus, instead
      // of staying out front over it. Fix: measured relative to *this
      // card's own* focus point (`index / stationCount`, the exact
      // `storyProgress` at which the camera reaches its station) — `angle`
      // is 0 (front, `cos(angle) = 1`) precisely when this card is in
      // focus, for every card, regardless of index. Before/after that
      // moment it's still free to swing around as part of the same ambient
      // circular motion, just anchored so "in focus" always means "out in
      // front", never "swung around behind."
      //
      // Second real bug, caught right after: that fix (relative to
      // `index / stationCount`) accidentally undid the left-start mirror
      // below it — with a *positive* sign here, a card's approach phase
      // (`storyProgress` still short of its own focus point, so the
      // difference is negative) landed on the *right* (`-Math.sin` of a
      // negative angle is positive), exactly backwards from what the user
      // confirmed. The sign is negated here — `index / stationCount -
      // storyProgress` instead of the other way round — so the approach
      // phase gives a *positive* angle and lands on the left again, while
      // `cos(angle)` (even in the sign of `angle`) is completely
      // unaffected, so the front-facing-at-focus guarantee above holds
      // exactly as before: this only mirrors *when* a card is on which
      // side, never whether it's in front of or behind the column.
      // `LOCAL_ORBIT_PHASE_BIAS`: see its own comment above — guarantees
      // every card (including index 0, which has no real "before focus"
      // runway otherwise) starts measurably left-of-center rather than
      // dead-center.
      const angle = (index / stationCount - storyProgress) * Math.PI * 2 * LOCAL_ORBIT_TURNS + LOCAL_ORBIT_PHASE_BIAS;
      const floatY = Math.sin(elapsed * CARD_FLOAT_SPEED + index * 2.1) * CARD_FLOAT_AMPLITUDE;
      // Descends as the card sweeps from its left/approach side (`angle`
      // positive) to its right/recede side (`angle` negative) — clamped to
      // a quarter turn either way so cards far from their own focus (large
      // |angle|) settle at the full drop instead of swinging back up past
      // it. See `VERTICAL_ARC_DROP`'s comment above: the user asked for
      // this left-to-right turn to read as descending, not flat/rising.
      const verticalArc = THREE.MathUtils.clamp(angle / (Math.PI * 0.5), -1, 1) * VERTICAL_ARC_DROP;

      // `-Math.sin(angle)`: the user asked for the cards to start ordered
      // on the *left* side first, not the right (Slice 13.3) — combined
      // with the negated angle above, a card's approach phase now lands on
      // the left and its exit phase on the right, consistently for every
      // card regardless of index.
      mesh.position.set(-Math.sin(angle) * ORBIT_RADIUS, y + floatY + verticalArc, Math.cos(angle) * ORBIT_RADIUS);
      // Billboard: always face the camera exactly, regardless of where this
      // card currently sits on its local orbit — never edge-on, at any
      // station, at any point in its ambient spin.
      mesh.quaternion.copy(camera.quaternion);
      mesh.scale.setScalar(globalFadeOut);
      mesh.visible = globalFadeOut > 0.01;

      const material = materials[index];
      material.uniforms.uFocus.value = focus;
      material.uniforms.uIntensity.value = 1 - focus;
    });

    // Debounced front index (see `SWITCH_MARGIN`/`MIN_SWITCH_INTERVAL`
    // above): only adopt a new winner once it clearly beats the current one
    // and enough time has passed since the last switch — otherwise report
    // the same stable index, even if the raw per-frame max just flickered.
    if (
      heroIndex !== stableIndex &&
      heroBestFocus - focuses[stableIndex] > SWITCH_MARGIN &&
      elapsed - lastSwitchElapsed > MIN_SWITCH_INTERVAL
    ) {
      stableIndex = heroIndex;
      lastSwitchElapsed = elapsed;
    }

    return stableIndex;
  }

  return {
    group,
    materials,
    meshes,
    place,
    dispose: () => {
      disposed = true;
      geometry.dispose();
      fallbackTexture.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
