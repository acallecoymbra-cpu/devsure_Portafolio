import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);

test('the culture route has local content, accessible carousels, and metadata', async () => {
  const requiredFiles = [
    'src/app/cultura/page.tsx',
    'src/features/culture/culture-content.ts',
    'src/features/culture/components/culture-carousels.tsx',
    'src/features/culture/components/culture-spine.tsx',
    'src/features/culture/components/culture-spine-scene.tsx',
    'src/features/culture/components/culture-spine-3d.tsx',
    'src/features/culture/three/capabilities.ts',
    'src/features/culture/three/spine-engine.ts',
    'src/features/culture/three/glitch-card-material.ts',
    'src/features/culture/culture.module.css',
    'public/culture/collaboration.png',
    'public/culture/quality.png',
    'public/culture/growth.png',
  ];

  await Promise.all(requiredFiles.map((file) => access(new URL(file, root))));

  const page = await readFile(new URL('src/app/cultura/page.tsx', root), 'utf8');
  const content = await readFile(new URL('src/features/culture/culture-content.ts', root), 'utf8');
  const carousels = await readFile(
    new URL('src/features/culture/components/culture-carousels.tsx', root),
    'utf8',
  );
  const spine = await readFile(
    new URL('src/features/culture/components/culture-spine.tsx', root),
    'utf8',
  );
  const scene = await readFile(
    new URL('src/features/culture/components/culture-spine-scene.tsx', root),
    'utf8',
  );
  const spine3d = await readFile(
    new URL('src/features/culture/components/culture-spine-3d.tsx', root),
    'utf8',
  );
  const capabilities = await readFile(
    new URL('src/features/culture/three/capabilities.ts', root),
    'utf8',
  );
  const engine = await readFile(
    new URL('src/features/culture/three/spine-engine.ts', root),
    'utf8',
  );
  const header = await readFile(new URL('src/components/site-header.tsx', root), 'utf8');

  assert.match(page, /canonical: '\/cultura'/);
  assert.match(page, /'@type': 'AboutPage'/);
  assert.match(page, /CultureSpineScene/);
  assert.match(page, /CompanyCarousel/);
  assert.equal((content.match(/id: '(listen|quality|evolve)'/g) ?? []).length, 3);
  assert.doesNotMatch(content, /https?:\/\//);
  assert.match(carousels, /aria-roledescription="carrusel"/);
  assert.match(carousels, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(carousels, /CultureCarousel/);
  assert.match(spine, /useInView/);
  assert.match(spine, /Cómo trabajamos, paso a paso/);

  // Plan §2.4/§2.5 (PLAN-CULTURA-SPINE-3D.md): the fallback renders first and
  // the WebGL layer only ever mounts behind a client-side capability gate,
  // loaded with `next/dynamic({ ssr: false })` so its bundle never reaches
  // anyone who ends up on the fallback path.
  assert.match(scene, /canRender3DSpine/);
  assert.match(scene, /ssr:\s*false/);
  assert.match(scene, /<CultureSpine /);
  assert.match(spine3d, /aria-hidden="true"/);
  assert.match(capabilities, /prefers-reduced-motion: reduce/);
  assert.match(capabilities, /hardwareConcurrency/);

  // Plan §2.2 (revised after a real "camera never moves" report, then again
  // in Slice 9 for "more fluid" motion — see the bitácora): scroll progress
  // is recomputed fresh from `getBoundingClientRect()` every animation
  // frame, not cached in a GSAP ScrollTrigger, not a React state update per
  // tick, and not even a `scroll` event listener anymore — a continuous
  // `requestAnimationFrame` loop (torn down on unmount) reads it fresh each
  // frame instead, which is also what lets progress be damped/eased there.
  assert.match(engine, /getBoundingClientRect/);
  assert.match(engine, /requestAnimationFrame/);
  assert.match(engine, /cancelAnimationFrame/);
  assert.match(engine, /renderer\.dispose\(\)/);

  assert.match(header, /href: '\/cultura', label: 'CULTURA'/);
  assert.match(header, /aria-current/);
});
