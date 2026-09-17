import * as THREE from 'three';
import { createTransitionCompositeMaterial } from '@/features/culture/three/transition-composite-material';

const DURATION_MS = 550;

/**
 * Owns an intermediate render target plus a full-screen quad that samples
 * it through `TransitionCompositeMaterial`. `mountSpineEngine` renders the
 * real scene into `sceneTarget` (via `spine-refraction.ts`'s `render`,
 * which now takes an output target instead of always writing straight to
 * the canvas) and then calls `blit()` to draw that through this composite
 * onto the real canvas — a full-screen effect layered on top of everything
 * else, matching the reference's screen-wide transition (plan §4.1, Slice
 * 8.3) instead of only the per-card glitch from Slice 4.
 *
 * `uProgress` decays linearly over `DURATION_MS` after each `trigger()` —
 * driven by wall-clock time, not scroll, so a transition that starts mid
 * scroll still finishes even if the viewer stops scrolling. `isActive()`
 * tells the caller whether it's worth scheduling extra render frames for
 * that decay (see `spine-engine.ts`'s `runTransitionFrames`) — outside an
 * active transition this is a plain, cheap pass-through blit.
 *
 * Double-buffered targets (`targets[0]`/`targets[1]`, swapped every `blit()`
 * instead of a single `sceneTarget`): the ghosting term in the shader needs
 * last frame's fully-rendered image (`uPrevScene`), not just the current
 * one, so `spine-refraction.ts` always renders into whichever target isn't
 * being sampled as "previous" this frame — the other one still holds
 * exactly what was on screen a frame ago, safe to read from.
 */
export function createTransitionComposite(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera(); // unused by the shader (see transition-composite-material.ts), required by renderer.render's signature
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = createTransitionCompositeMaterial();
  scene.add(new THREE.Mesh(geometry, material));

  function createTarget() {
    const size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    return new THREE.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    });
  }

  let targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] = [createTarget(), createTarget()];
  let writeIndex = 0;
  material.uniforms.uScene.value = targets[writeIndex].texture;
  material.uniforms.uPrevScene.value = targets[1 - writeIndex].texture;
  let triggeredAt = -Infinity;

  return {
    // The target `spine-refraction.ts` renders the current frame into.
    sceneTarget: () => targets[writeIndex],
    trigger: () => {
      triggeredAt = performance.now();
    },
    isActive: () => performance.now() - triggeredAt < DURATION_MS,
    resize: () => {
      const previous = targets;
      targets = [createTarget(), createTarget()];
      writeIndex = 0;
      material.uniforms.uScene.value = targets[writeIndex].texture;
      material.uniforms.uPrevScene.value = targets[1 - writeIndex].texture;
      previous.forEach((target) => target.dispose());
    },
    blit: () => {
      const elapsed = performance.now() - triggeredAt;
      material.uniforms.uProgress.value = Math.max(0, 1 - elapsed / DURATION_MS);
      material.uniforms.uScene.value = targets[writeIndex].texture;
      material.uniforms.uPrevScene.value = targets[1 - writeIndex].texture;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      // Next frame renders into the target that just served as "previous",
      // since this frame's just-drawn target now becomes next frame's
      // ghost source.
      writeIndex = 1 - writeIndex;
    },
    dispose: () => {
      targets.forEach((target) => target.dispose());
      geometry.dispose();
      material.dispose();
    },
  };
}
