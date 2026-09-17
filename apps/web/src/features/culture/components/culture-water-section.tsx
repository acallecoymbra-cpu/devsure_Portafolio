import type { ReactNode } from 'react';
import Image from 'next/image';
import styles from './culture-water-section.module.css';

interface CultureWaterSectionProps {
  children?: ReactNode;
}

/**
 * Hero block for `/cultura`: "Culture" and `"DevSure"` straight over a
 * large, full-width photo (iridescent chalcopyrite next to a blue goldstone
 * cabochon) — the photo is the dominant visual, not a small contained image
 * with dead space around it. `.frame`'s height tracks the photo's own ratio
 * (1536x1024, 1.5:1) closely, so `object-fit: cover` only trims a little off
 * the extremes instead of zooming in — same scale between the two stones as
 * the source file, never stretched. No scrim/parallax drift layered on top
 * (kept simple: one absolute image, the heading on top of it) — the
 * wordmarks read fine directly on the photo.
 *
 * `{children}` (the hero copy — eyebrow/h1/lead) renders in `.section`
 * *after* `.frame`, not inside it: `.frame`'s height is pinned to the
 * photo's own aspect ratio, so copy of any length never stretches the image
 * taller than its source composition (which would force `cover` to crop in
 * hard and lose one of the stones — that's what "reference" means below).
 *
 * Both wordmarks are static PNGs now (user request — supplied final
 * artwork, `culture-wordmark.webp` / `devsure-wordmark.webp`), not the
 * earlier live-text per-letter kinetic effect. That effect (blur entrance +
 * ambient pulse + metallic gradient fill) still exists, parked and
 * untouched, in `culture-kinetic-wordmark.tsx` — swap `<CultureKineticWordmark
 * />` back in here in place of the two `<img>`s below to bring it back.
 */
export function CultureWaterSection({ children }: CultureWaterSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="culture-water-title">
      <div className={styles.frame}>
        <Image
          src="/culture/culture-heading-bg.webp"
          alt=""
          fill
          sizes="100vw"
          priority
          className={styles.backgroundImage}
        />

        <div className={styles.headingWrap}>
          <h2 id="culture-water-title" className={styles.headingTitle}>
            <img
              src="/culture/culture-wordmark.webp"
              alt="Culture"
              width={2172}
              height={724}
              className={styles.wordmarkImage}
            />
          </h2>

          <p className={styles.subtitle}>
            <img
              src="/culture/devsure-wordmark.webp"
              alt="“DevSure”"
              width={2172}
              height={724}
              className={styles.wordmarkImage}
            />
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}
