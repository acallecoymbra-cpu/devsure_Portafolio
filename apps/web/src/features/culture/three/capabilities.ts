const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** True when the browser can create a WebGL context at all. */
export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Cheap device-capability heuristic (Slice 5 will tune the thresholds). Kept
 * separate from `hasWebGL`/`prefersReducedMotion` so those two hard
 * requirements stay easy to unit-test on their own.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === 'number' && cores > 0 && cores < 4;
}

/** Whether the 3D culture spine should mount at all, per plan §2.4. */
export function canRender3DSpine(): boolean {
  return hasWebGL() && !prefersReducedMotion() && !isLowEndDevice();
}
