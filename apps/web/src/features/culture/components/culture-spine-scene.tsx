'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
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
 * The real story copy for whichever card is currently resting next to the
 * spine (plan §2.3: the canvas is decorative, this HTML is the actual
 * accessible/SEO content). Rendered as an overlay pinned to the bottom of
 * the 3D stage — not projected onto the card's individual 3D screen
 * position (plan §5, Slice 3 "option 2") — which is far more robust than
 * keeping a per-frame projection in sync with a scroll-driven scene, at the
 * cost of some fidelity to the reference video. Revisit if the user asks
 * for tighter visual coupling.
 */
function CultureSpineCaption({ story }: { story: CultureStory }) {
  return (
    <div className={styles.spineCaption} key={story.id}>
      <p>{story.kicker}</p>
      <h3>{story.title}</h3>
      <p>{story.description}</p>
    </div>
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
  // -1 = past the story cards (Slice 9): scrolling has moved into
  // `children`'s sections, which now sit as foreground content over the
  // column, so there's no active story caption to show anymore.
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setRender3D(canRender3DSpine());
  }, []);

  // Stable identity (setState setters never change) so the effect that
  // mounts the WebGL engine in `CultureSpine3D` doesn't see this as a new
  // prop on every render and remount the whole scene.
  const handleActiveIndexChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const activeStory = activeIndex >= 0 ? (stories[activeIndex] ?? stories[0]) : null;

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
        <SectionErrorBoundary fallback={null} onError={() => setRender3D(false)}>
          <CultureSpine3D
            stories={stories}
            onActiveIndexChange={handleActiveIndexChange}
            header={header}
            foreground={children}
          >
            {activeStory ? (
              <div className={styles.spineCaptionOverlay}>
                <CultureSpineCaption story={activeStory} />
              </div>
            ) : null}
          </CultureSpine3D>
        </SectionErrorBoundary>
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
