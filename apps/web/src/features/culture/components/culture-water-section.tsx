import type { ReactNode } from 'react';
import Image from 'next/image';
import styles from './culture-water-section.module.css';

interface CultureWaterSectionProps {
  children?: ReactNode;
}

/**
 * Hero block for `/cultura`: the word CULTURE straight over a large,
 * full-width photo (iridescent chalcopyrite next to a blue goldstone
 * cabochon) — the photo is the dominant visual, not a small contained image
 * with dead space around it. `.section`'s height tracks the photo's own
 * ratio (1600x1066, ~1.5:1) closely, so `object-fit: cover` only trims a
 * little off the extremes instead of zooming in — same scale between the
 * two stones as the source file, never stretched. No scrim/parallax drift
 * layered on top (kept simple: one absolute image, the heading on top of
 * it) — the bold white wordmark reads fine directly on the photo.
 */
export function CultureWaterSection({ children }: CultureWaterSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="culture-water-title">
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
          {/* Stylized logotype, not a font on the system — real alt text
              keeps this an actual heading for accessibility/SEO. */}
          <img
            src="/culture/culture-heading.png"
            alt="Culture"
            width={1692}
            height={410}
            className={styles.heading}
          />
        </h2>
      </div>

      {children}
    </section>
  );
}
