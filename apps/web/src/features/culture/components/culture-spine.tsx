'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { CultureStory } from '@/features/culture/culture-content';
import { useInView } from '@/lib/use-in-view';
import styles from '@/features/culture/culture.module.css';

type CultureSpineProps = {
  stories: readonly CultureStory[];
};

type SpineItemProps = {
  story: CultureStory;
  align: 'left' | 'right';
};

function SpineItem({ story, align }: SpineItemProps) {
  const { ref, inView } = useInView<HTMLLIElement>({ threshold: 0.35 });
  const [failedImage, setFailedImage] = useState(false);

  return (
    <li
      ref={ref}
      className={`${styles.spineItem}${inView ? ` ${styles.spineItemRevealed}` : ''}`}
      data-align={align}
    >
      <span className={styles.spineDot} aria-hidden="true" />
      <article className={styles.spineCard} aria-labelledby={`spine-${story.id}`}>
        <div className={styles.spineMedia}>
          {failedImage ? (
            <div className={styles.mediaFallback} role="img" aria-label={story.image.alt}>
              <span>Imagen editorial no disponible</span>
            </div>
          ) : (
            <Image
              src={story.image.src}
              alt={story.image.alt}
              fill
              sizes="(min-width: 64rem) 32vw, 90vw"
              onError={() => setFailedImage(true)}
            />
          )}
        </div>
        <div className={styles.spineCopy}>
          <p>{story.kicker}</p>
          <h3 id={`spine-${story.id}`}>{story.title}</h3>
          <p>{story.description}</p>
        </div>
      </article>
    </li>
  );
}

/**
 * Vertical "spine" timeline: a center line runs the length of the list and
 * each story lights up its dot and settles into place (with a brief glitch
 * flicker) as it scrolls into view, alternating sides of the line.
 */
export function CultureSpine({ stories }: CultureSpineProps) {
  if (stories.length === 0) {
    return (
      <p className={styles.emptyState} role="status">
        Estamos preparando nuevas historias sobre nuestra forma de trabajar.
      </p>
    );
  }

  return (
    <ol className={styles.spineTrack} aria-label="Cómo trabajamos, paso a paso">
      {stories.map((story, index) => (
        <SpineItem key={story.id} story={story} align={index % 2 === 0 ? 'left' : 'right'} />
      ))}
    </ol>
  );
}
