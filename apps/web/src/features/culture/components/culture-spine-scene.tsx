'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CultureStory } from '@/features/culture/culture-content';
import { CultureSpine } from '@/features/culture/components/culture-spine';
import { canRender3DSpine } from '@/features/culture/three/capabilities';
import { SectionErrorBoundary } from '@/components/section-error-boundary';
import styles from '@/features/culture/culture.module.css';

const CultureSpine3D = dynamic(
  () => import('@/features/culture/components/culture-spine-3d').then((mod) => mod.CultureSpine3D),
  { ssr: false },
);

type CultureSpineSceneProps = {
  stories: readonly CultureStory[];
  /**
   * Slice 9.6: the hero ("Cultura DevSure") and the "Quiénes somos" heading
   * — rendered *before* the story cards' scroll room (see
   * `CultureSpine3D`'s `header` prop), so the column shows as a backdrop
   * starting from the very top of the page, not just once the cards begin.
   * In the CSS fallback below, rendered plainly before `CultureSpine`, no
   * overlap trick.
   */
  header?: ReactNode;
  /**
   * Slice 9: "Lo que cuidamos" / "Nuestra medida" / "Confianza compartida" —
   * passed through so the 3D path can render them as foreground content
   * scrolling over the pinned column (see `CultureSpine3D`'s `foreground`
   * prop), while the CSS fallback below just renders them normally, right
   * after the fallback spine, with no overlap trick at all.
   */
  children?: ReactNode;
};

/**
 * User request: the 3D scene's visible glass caption panel is gone — it sat
 * exactly where the front-facing card orbits to (plan §5, Slice 3 "option
 * 2"), so the card "winning" the front position ended up the *least*
 * visible thing on screen instead of the most. The canvas is purely
 * decorative now, no on-screen text at all — but the real story copy (plan
 * §2.3, still in force) still needs to exist as real HTML for screen
 * readers and search crawlers, so it renders here, `sr-only`, as a static
 * list next to the canvas. Static rather than tied to whichever card is
 * currently front-facing: simpler, and correct regardless of
 * animation/JS state — a crawler that never runs the WebGL loop still sees
 * every story, not just whichever one happened to be "active" at request
 * time.
 */
function SpineAccessibleStories({ stories }: { stories: readonly CultureStory[] }) {
  return (
    <ul className="sr-only" aria-label="Cómo trabajamos, paso a paso">
      {stories.map((story) => (
        <li key={story.id}>
          <p>{story.kicker}</p>
          <h3>{story.title}</h3>
          <p>{story.description}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Last-resort fallback if even `CultureSpine` (the CSS/JS path) fails to
 * render — deliberately has zero refs, effects, or `IntersectionObserver`
 * calls, just the story copy as plain markup, so there's nothing left in
 * it that could throw the way both richer paths above it did.
 */
function StaticStoriesFallback({ stories }: { stories: readonly CultureStory[] }) {
  return (
    <ol className={styles.spineTrack} aria-label="Cómo trabajamos, paso a paso">
      {stories.map((story) => (
        <li key={story.id} className={styles.spineItem}>
          <article className={styles.spineCard}>
            <div className={styles.spineCopy}>
              <p>{story.kicker}</p>
              <h3>{story.title}</h3>
              <p>{story.description}</p>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

/**
 * Gate between the WebGL spine (see PLAN-CULTURA-SPINE-3D.md) and its
 * required CSS/JS fallback, `CultureSpine`. Always renders the fallback
 * first — deterministic on the server, real accessible content, zero
 * three.js bytes — and only swaps in the 3D layer once client-side
 * capability checks pass (plan §2.4), so the three.js bundle never reaches
 * anyone who ends up on the fallback path.
 */
export function CultureSpineScene({ stories, header, children }: CultureSpineSceneProps) {
  const [render3D, setRender3D] = useState(false);

  useEffect(() => {
    setRender3D(canRender3DSpine());
  }, []);

  return (
    // Two layers: the inner boundary catches a WebGL-specific failure (e.g.
    // a browser extension's DOM patching conflicting with the canvas
    // mounted imperatively in spine-engine.ts) and downgrades to the
    // CSS/JS path — `onError` flips `render3D` so the *next* render takes
    // that branch for good. The outer boundary is the true last resort, in
    // case even swapping to that fallback fails mid-transition; it drops
    // all the way to `StaticStoriesFallback`, which has nothing left in it
    // that could throw.
    <SectionErrorBoundary
      fallback={
        <>
          {header}
          <StaticStoriesFallback stories={stories} />
          {children}
        </>
      }
    >
      {render3D ? (
        <>
          <SectionErrorBoundary fallback={null} onError={() => setRender3D(false)}>
            <CultureSpine3D stories={stories} header={header} foreground={children} />
          </SectionErrorBoundary>
          <SpineAccessibleStories stories={stories} />
        </>
      ) : (
        <>
          {header}
          <CultureSpine stories={stories} />
          {children}
        </>
      )}
    </SectionErrorBoundary>
  );
}
