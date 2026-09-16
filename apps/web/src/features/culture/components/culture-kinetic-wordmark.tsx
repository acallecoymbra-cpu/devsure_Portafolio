'use client';

import { useEffect, useRef, useState } from 'react';
import { Bodoni_Moda } from 'next/font/google';
import { useInView } from '@/lib/use-in-view';
import styles from './culture-kinetic-wordmark.module.css';

/**
 * PARKED (user request, 2026-09-16): built and refined across several
 * rounds — live-text wordmark, per-letter blur entrance + ambient pulse,
 * metallic gradient fill — but the user got tired of iterating on it and
 * switched `/cultura`'s hero to static PNG wordmarks instead (see
 * `culture-water-section.tsx`). Explicitly asked to keep this working, not
 * delete it, for reuse later. Not imported anywhere right now — that's
 * expected; wire `<CultureKineticWordmark />` back into
 * `culture-water-section.tsx`'s `.headingWrap` (in place of the two `<img>`
 * tags) to bring it back.
 */

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  style: ['italic', 'normal'],
  // 400 (not 500/600): a refinement pass asked for finer, crisper letters —
  // the lighter cut keeps this didone's hairline strokes actually thin,
  // which reads as "editorial" instead of "bold and opaque".
  weight: ['400'],
  display: 'swap',
});

const CULTURE_LETTERS = 'Culture'.split('');
const SUBTITLE_LETTERS = '“DevSure”'.split('');
const TOTAL_LETTERS = CULTURE_LETTERS.length + SUBTITLE_LETTERS.length;
const LETTER_STAGGER_MS = 45;

const PULSE_DURATION_MS = 800;
// Randomized around a ~2s average per letter (user request), not a fixed
// beat — a synchronized interval would read as mechanical, not organic.
const PULSE_MIN_GAP_MS = 1200;
const PULSE_RANDOM_SPREAD_MS = 1600;

/**
 * After the one-time entrance settles, each letter independently blurs out
 * and back in on its own loose ~2s-ish timer (randomized per cycle, per
 * letter) — an ambient "kinetic" flicker, not a single group animation.
 * Each letter schedules its own next pulse only after its current one
 * finishes, so they drift in and out of sync with each other rather than
 * ever lining up. Stops entirely under reduced motion or once the word
 * scrolls out of view (`enabled=false`), instead of animating unseen.
 */
function useLetterPulses(count: number, enabled: boolean) {
  const [pulsing, setPulsing] = useState<boolean[]>(() => Array(count).fill(false));
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;

    const scheduleNext = (index: number) => {
      const delay = PULSE_MIN_GAP_MS + Math.random() * PULSE_RANDOM_SPREAD_MS;
      timeoutsRef.current[index] = window.setTimeout(() => {
        if (cancelled) return;
        setPulsing((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        timeoutsRef.current[index] = window.setTimeout(() => {
          if (cancelled) return;
          setPulsing((prev) => {
            const next = [...prev];
            next[index] = false;
            return next;
          });
          scheduleNext(index);
        }, PULSE_DURATION_MS);
      }, delay);
    };

    for (let i = 0; i < count; i += 1) scheduleNext(i);

    return () => {
      cancelled = true;
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, [count, enabled]);

  return pulsing;
}

interface KineticLettersProps {
  letters: string[];
  startIndex: number;
  inView: boolean;
  pulsing: boolean[];
}

/** Renders `letters` as one `<span>` per character, each wired into the
 * shared entrance (reveal-init/is-revealed, staggered by its position in
 * the combined Culture + "DevSure" sequence) and ambient pulse. Shared by
 * both lines so they read as one continuous effect, not two separate ones. */
function KineticLetters({ letters, startIndex, inView, pulsing }: KineticLettersProps) {
  return (
    <>
      {letters.map((letter, i) => {
        const index = startIndex + i;
        return (
          <span
            key={`${letter}-${index}`}
            className={`${styles.letter} reveal-init${inView ? ' is-revealed' : ''}${
              pulsing[index] ? ` ${styles.letterPulsing}` : ''
            }`}
            style={{ transitionDelay: `${index * LETTER_STAGGER_MS}ms` }}
          >
            {letter}
          </span>
        );
      })}
    </>
  );
}

/**
 * Live-text "Culture" / `"DevSure"` wordmark with a one-time per-letter
 * blur-in entrance, an ambient random re-blur pulse per letter, and a
 * brushed-metal gradient fill (champagne-gold / platinum). Drop-in
 * replacement for the two `<img>` tags in `culture-water-section.tsx`'s
 * `.headingWrap` — same ids/aria wiring, so it can go straight back in.
 */
export function CultureKineticWordmark() {
  const { ref, inView } = useInView<HTMLHeadingElement>({ threshold: 0.4 });
  const pulsing = useLetterPulses(TOTAL_LETTERS, inView);

  return (
    <>
      <h2 ref={ref} id="culture-water-title" className={`${styles.headingTitle} ${bodoniModa.className}`}>
        <KineticLetters letters={CULTURE_LETTERS} startIndex={0} inView={inView} pulsing={pulsing} />
      </h2>

      <p className={`${styles.subtitle} ${bodoniModa.className}`}>
        <KineticLetters
          letters={SUBTITLE_LETTERS}
          startIndex={CULTURE_LETTERS.length}
          inView={inView}
          pulsing={pulsing}
        />
      </p>
    </>
  );
}
