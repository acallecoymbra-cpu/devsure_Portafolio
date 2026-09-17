import type { ReactNode } from 'react';
import Image from 'next/image';
import { CultureFlowPath } from './culture-flow-path';
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

        <CultureFlowPath
          anchor="top"
          desktopViewBox="0 0 1600 1000"
          mobileViewBox="0 0 500 900"
          desktopPath="M -120 40 C 220 120, 420 260, 560 420 C 700 580, 560 680, 640 780 C 700 860, 950 820, 1120 840"
          mobilePath="M -30 40 C 120 140, 220 320, 200 480 C 180 620, 320 680, 380 820"
          stops={[
            { offset: '0%', color: '#061A40' },
            { offset: '55%', color: '#0A2F8F' },
            { offset: '100%', color: '#123EB7' },
          ]}
          className={styles.flowLine}
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
