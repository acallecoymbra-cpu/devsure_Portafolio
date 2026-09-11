import * as THREE from 'three';
import { createSpineRefractionMaterial } from '@/features/culture/three/spine-refraction-material';

/** Owns the offscreen buffer and material together so resize cannot leave a stale sampler. */
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
  const material = createSpineRefractionMaterial(target.texture);
  material.uniforms.uResolution.value.set(target.width, target.height);

  return {
    material,
    resize: () => {
      const previous = target;
      target = createTarget();
      material.uniforms.uScene.value = target.texture;
      material.uniforms.uResolution.value.set(target.width, target.height);
      previous.dispose();
    },
    // `outputTarget` defaults to the canvas (`null`); Slice 8.3 passes the
    // transition composite's intermediate target instead, so the full
    // scene lands there first and gets blitted through that effect after.
    render: (
      scene: THREE.Scene,
      camera: THREE.Camera,
      spine: THREE.Object3D,
      outputTarget: THREE.WebGLRenderTarget | null = null,
    ) => {
      const previousTarget = renderer.getRenderTarget();
      const wasVisible = spine.visible;
      try {
        spine.visible = false;
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
      } finally {
        spine.visible = wasVisible;
        renderer.setRenderTarget(previousTarget);
      }
      renderer.setRenderTarget(outputTarget);
      renderer.render(scene, camera);
    },
    dispose: () => {
      target.dispose();
      material.dispose();
    },
  };
}
