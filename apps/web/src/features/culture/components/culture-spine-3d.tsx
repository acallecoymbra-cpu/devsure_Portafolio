'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CultureStory } from '@/features/culture/culture-content';
import { mountSpineEngine } from '@/features/culture/three/spine-engine';
import styles from '@/features/culture/culture.module.css';

type CultureSpine3DProps = {
  stories: readonly CultureStory[];
  /**
   * Slice 9.6: the hero and "Quiénes somos" heading — rendered *before* the
   * story cards' scroll room (`storySpacerRef`), so the column shows as a
   * backdrop from the very top of the page, not just once the cards begin.
   */
  header?: ReactNode;
  /**
   * Slice 9: the sections that scroll *over* the pinned column once the
   * story cards finish ("Lo que cuidamos"/"Nuestra medida"/"Confianza
   * compartida") — rendered in `.spineForegroundLayer`, which overlaps
   * `.spineStickyLayer` in the same grid cell (see `culture.module.css`).
   */
  foreground?: ReactNode;
};

/**
 * The WebGL layer for the culture spine: a rotating column with a card per
 * story orbiting around it, always billboarded to face the camera so it's
 * never edge-on, one taking the front-facing turn at a time as the viewer
 * scrolls (the glitch shader plays as each card leaves that position). Only
 * ever mounted by `CultureSpineScene` after it has confirmed WebGL is
 * available, the viewer doesn't prefer reduced motion, and the device isn't
 * flagged as low-end (see three/capabilities.ts). Purely decorative — no
 * on-screen text of its own; the real story copy lives as a separate
 * `sr-only` HTML list `CultureSpineScene` renders alongside this canvas
 * (see `SpineAccessibleStories`).
 *
 * Four elements matter here (see `culture.module.css`'s
 * `spineBackgroundRegion` comment for why): `wrapperRef` is the combined
 * background region the engine measures for scroll progress (spanning the
 * story cards *and* `foreground`'s sections), `canvasMountRef` is the
 * `position: sticky` element the actual `<canvas>` gets sized to and
 * appended into, `storySpacerRef` marks how much of that combined range
 * belongs to the story cards specifically (Slice 9) — see
 * `spine-engine.ts::computeStoryProgress` — and `scrimRef` is the overlay
 * the engine fades in once scrolling moves past the story cards, dimming
 * the column so it doesn't fight with the foreground sections' text.
 *
 * `stories` is expected to be referentially stable for the component's
 * lifetime (a module-level content array) — the mount effect intentionally
 * runs once, not on every render.
 */
export function CultureSpine3D({ stories, header, foreground }: CultureSpine3DProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const storySpacerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollTrigger = wrapperRef.current;
    const canvasMount = canvasMountRef.current;
    const storySpacer = storySpacerRef.current;
    const scrim = scrimRef.current;
    if (!scrollTrigger || !canvasMount || !storySpacer || !scrim) return;

    const handle = mountSpineEngine(
      { scrollTrigger, canvasMount, storySpacer, scrim },
      stories.map((story) => ({ id: story.id, imageSrc: story.image.src })),
    );
    return () => handle.dispose();
  }, [stories]);

  return (
    <div ref={wrapperRef} className={styles.spineBackgroundRegion}>
      <div className={styles.spineStickyLayer}>
        <div ref={canvasMountRef} className={styles.spineCanvasMount} aria-hidden="true" />
        <div ref={scrimRef} className={styles.spineScrim} aria-hidden="true" />
      </div>
      <div className={styles.spineForegroundLayer}>
        {header}
        {/* Scroll room scales with story count (~60vh each) so adding/removing
            stories keeps roughly the same pace per card instead of rushing or
            dragging as the list grows. */}
        <div
          ref={storySpacerRef}
          className={styles.spineStorySpacer}
          style={{ height: `${stories.length * 60}vh` }}
          aria-hidden="true"
        />
        {foreground}
      </div>
    </div>
  );
}
