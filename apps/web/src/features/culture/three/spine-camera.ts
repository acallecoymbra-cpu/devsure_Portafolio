import * as THREE from 'three';

/**
 * Distance along +z needed for a *local* neighborhood of the scene (one card
 * plus some of the column around it, not the whole column height) to fit, at
 * any aspect ratio. The camera now travels down through the column as the
 * user scrolls (see `buildCameraPath`) instead of sitting still and trying
 * to frame the entire height from one spot — so it only ever needs to frame
 * whatever's nearby, which lets it sit much closer (cards read bigger) than
 * a fixed camera fitting the full column ever could.
 */
export function fitDistanceForScene(
  camera: THREE.PerspectiveCamera,
  aspect: number,
  cardHalfHeight: number,
  sceneHalfWidth: number,
): number {
  const margin = 1.35;

  const verticalFov = (camera.fov * Math.PI) / 180;
  // A bit more than just the card's own height, so some column context is
  // still visible above/below it, not a tight crop on the photo alone.
  const distanceForHeight = (cardHalfHeight * 2.4) / Math.tan(verticalFov / 2);

  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const distanceForWidth = sceneHalfWidth / Math.tan(horizontalFov / 2);

  return Math.max(distanceForHeight, distanceForWidth) * margin;
}

/**
 * The camera's *path*, not just a static point — descends from
 * `+travelHalfHeight` to `-travelHalfHeight` (top to bottom of the cards'
 * station range, see `spine-cards.ts`) as `t` goes 0→1, banking gently side
 * to side and in/out along the way like a slow spiral stairwell, instead of
 * a closed loop orbiting one fixed height. This is what turns scrolling into
 * a felt sense of *descending past* each card's station, not just cards
 * spinning in place while the camera stays put.
 */
export function buildCameraPath(distance: number, travelHalfHeight: number): THREE.CatmullRomCurve3 {
  const lateral = distance * 0.16;
  const depth = distance * 0.1;
  const turns = 1.1;
  const POINTS = 9;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i < POINTS; i += 1) {
    const t = i / (POINTS - 1);
    const y = THREE.MathUtils.lerp(travelHalfHeight, -travelHalfHeight, t);
    const angle = t * Math.PI * 2 * turns;
    points.push(new THREE.Vector3(Math.sin(angle) * lateral, y, distance + Math.cos(angle) * depth));
  }

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  /** Rebuilds the internal path for the camera's current aspect — call after changing `camera.aspect`. */
  refit: (cardHalfHeight: number, sceneHalfWidth: number, travelHalfHeight: number) => void;
  /** Moves `camera` to `t` (0..1, top to bottom) along the path and points it level, so descending reads as steering, not just sliding down. */
  applyAt: (t: number) => void;
}

/** Owns the camera + its scroll-driven path together so a resize can never leave one stale relative to the other. */
export function createCameraRig(
  aspect: number,
  cardHalfHeight: number,
  sceneHalfWidth: number,
  travelHalfHeight: number,
): CameraRig {
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
  let path = buildCameraPath(fitDistanceForScene(camera, camera.aspect, cardHalfHeight, sceneHalfWidth), travelHalfHeight);

  return {
    camera,
    refit: (cardHalfHeightNext, sceneHalfWidthNext, travelHalfHeightNext) => {
      path = buildCameraPath(
        fitDistanceForScene(camera, camera.aspect, cardHalfHeightNext, sceneHalfWidthNext),
        travelHalfHeightNext,
      );
    },
    applyAt: (t) => {
      const here = path.getPointAt(t);
      const ahead = path.getPointAt(Math.min(1, t + 0.02));
      // Belt-and-suspenders: `getPointAt` can return undefined for a
      // degenerate curve (e.g. an Infinite/NaN distance slipping through).
      // Skip this frame's camera move rather than crash on a `.x` read.
      if (!here || !ahead) return;
      camera.position.copy(here);
      // Look level at the column, at the camera's *own* current height (so
      // it keeps panning down the column as it descends, not fixed on the
      // origin), biased slightly toward where the path heads next so turns
      // read as steering rather than just sliding sideways.
      camera.lookAt(2 * (ahead.x - here.x), here.y + (ahead.y - here.y), 0);
    },
  };
}
