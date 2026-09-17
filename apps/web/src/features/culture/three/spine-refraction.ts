import * as THREE from 'three';
import { createSpineRefractionMaterial } from '@/features/culture/three/spine-refraction-material';

/**
 * Owns two offscreen buffers and the column's refraction material together
 * so a resize can never leave either stale:
 *
 * - `target` (unchanged since Slice 8.1): the scene with the *column*
 *   hidden — what the column's own refraction material samples to fake
 *   "seeing through" itself.
 * - `cardsBackdropTarget` (new, for the glass card material): the scene
 *   with the *cards* hidden instead — i.e. column + particles + rings,
 *   nothing else. This is what each glass card blurs/tints as its frosted
 *   backdrop. It deliberately does **not** try to exclude just the one card
 *   sampling it (that would need a hidden-pass per card, N+1 renders instead
 *   of 3) — a single shared "column, no cards" plate is what the reference
 *   look actually needs: glass showing the column/particles through it, not
 *   pixel-exact per-card occlusion.
 *
 * Three render passes per frame in total (see `render()`): column-hidden,
 * cards-hidden, then everything visible to the real output. Callers
 * (`spine-engine.ts`) re-read `cardsBackdropTexture` after every `resize()`
 * and push it into each card material's `uSceneBehindCards` uniform, the
 * same way this file already updates its own `uScene` uniform below.
 */
export function createSpineRefraction(renderer: THREE.WebGLRenderer) {
  const drawingBufferSize = new THREE.Vector2();
  function createTarget() {
    renderer.getDrawingBufferSize(drawingBufferSize);
    return new THREE.WebGLRenderTarget(Math.max(1, drawingBufferSize.x), Math.max(1, drawingBufferSize.y), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    });
  }
  let target = createTarget();
  let cardsTarget = createTarget();
  const material = createSpineRefractionMaterial(target.texture);
  material.uniforms.uResolution.value.set(target.width, target.height);

  return {
    material,
    get cardsBackdropTexture() {
      return cardsTarget.texture;
    },
    resize: () => {
      const previousTarget = target;
      const previousCardsTarget = cardsTarget;
      target = createTarget();
      cardsTarget = createTarget();
      material.uniforms.uScene.value = target.texture;
      material.uniforms.uResolution.value.set(target.width, target.height);
      previousTarget.dispose();
      previousCardsTarget.dispose();
    },
    get cardsResolution() {
      return { width: cardsTarget.width, height: cardsTarget.height };
    },
    // `outputTarget` defaults to the canvas (`null`); Slice 8.3 passes the
    // transition composite's intermediate target instead, so the full
    // scene lands there first and gets blitted through that effect after.
    render: (
      scene: THREE.Scene,
      camera: THREE.Camera,
      spine: THREE.Object3D,
      cards: THREE.Object3D,
      outputTarget: THREE.WebGLRenderTarget | null = null,
    ) => {
      const previousTarget = renderer.getRenderTarget();
      const spineWasVisible = spine.visible;
      const cardsWereVisible = cards.visible;
      try {
        spine.visible = false;
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);

        spine.visible = spineWasVisible;
        cards.visible = false;
        renderer.setRenderTarget(cardsTarget);
        renderer.render(scene, camera);
      } finally {
        spine.visible = spineWasVisible;
        cards.visible = cardsWereVisible;
        renderer.setRenderTarget(previousTarget);
      }
      renderer.setRenderTarget(outputTarget);
      renderer.render(scene, camera);
    },
    dispose: () => {
      target.dispose();
      cardsTarget.dispose();
      material.dispose();
    },
  };
}
