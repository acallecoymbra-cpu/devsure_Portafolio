'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { CompanyStory } from '@/features/culture/culture-content';
import styles from '@/features/culture/culture.module.css';

type CompanyCarouselProps = {
  companies: readonly CompanyStory[];
};

function useCarousel(itemCount: number, interval = 7000, autoplay = true) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(itemCount > 1 && autoplay);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reducedMotion.matches) setIsPlaying(false);

    const stopForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setIsPlaying(false);
    };

    reducedMotion.addEventListener('change', stopForReducedMotion);
    return () => reducedMotion.removeEventListener('change', stopForReducedMotion);
  }, []);

  useEffect(() => {
    if (!autoplay || itemCount <= 1 || !isPlaying || isInteractionPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % itemCount);
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoplay, interval, isInteractionPaused, isPlaying, itemCount]);

  return {
    activeIndex,
    isInteractionPaused,
    isPlaying,
    setActiveIndex,
    setIsPlaying,
    setIsInteractionPaused,
    previous: () => setActiveIndex((current) => (current - 1 + itemCount) % itemCount),
    next: () => setActiveIndex((current) => (current + 1) % itemCount),
  };
}

export function CompanyCarousel({ companies }: CompanyCarouselProps) {
  const carousel = useCarousel(companies.length, 6000, false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const company = companies[carousel.activeIndex];

  if (!company) {
    return (
      <p className={styles.emptyState} role="status">
        Publicaremos nuevas colaboraciones cuando su presentación esté autorizada.
      </p>
    );
  }

  return (
    <div
      className={styles.companyCarousel}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Empresas para las que trabajamos"
    >
      <article className={styles.companyCard} key={company.id}>
        <div className={styles.companyLogo}>
          {failedImages[company.id] ? (
            <strong>{company.name}</strong>
          ) : (
            <Image
              src={company.logo.src}
              alt=""
              width={company.logo.width}
              height={company.logo.height}
              sizes="(min-width: 768px) 22rem, 80vw"
              onError={() => {
                setFailedImages((current) => ({ ...current, [company.id]: true }));
              }}
            />
          )}
        </div>
        <div className={styles.companyCopy}>
          <p>{company.location}</p>
          <h3>{company.name}</h3>
          <p>{company.detail}</p>
        </div>
      </article>

      {companies.length > 1 ? (
        <div className={styles.companyControls}>
          <button type="button" onClick={carousel.previous} aria-label="Empresa anterior">
            <span aria-hidden="true">←</span>
          </button>
          <p aria-live="polite">
            {carousel.activeIndex + 1} / {companies.length}
          </p>
          <button type="button" onClick={carousel.next} aria-label="Siguiente empresa">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
