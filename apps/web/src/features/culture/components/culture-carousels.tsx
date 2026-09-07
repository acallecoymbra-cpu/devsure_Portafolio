'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { CompanyStory, CultureStory } from '@/features/culture/culture-content';
import styles from '@/features/culture/culture.module.css';

type CultureCarouselProps = {
  stories: readonly CultureStory[];
};

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

export function CultureCarousel({ stories }: CultureCarouselProps) {
  const carousel = useCarousel(stories.length);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const story = stories[carousel.activeIndex];

  if (!story) {
    return (
      <p className={styles.emptyState} role="status">
        Estamos preparando nuevas historias sobre nuestra forma de trabajar.
      </p>
    );
  }

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Historias de nuestra cultura"
      onMouseEnter={() => carousel.setIsInteractionPaused(true)}
      onMouseLeave={() => carousel.setIsInteractionPaused(false)}
      onFocusCapture={() => carousel.setIsInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          carousel.setIsInteractionPaused(false);
        }
      }}
    >
      <article className={styles.storySlide} key={story.id} aria-labelledby={`story-${story.id}`}>
        <div className={styles.storyMedia}>
          {failedImages[story.id] ? (
            <div className={styles.mediaFallback} role="img" aria-label={story.image.alt}>
              <span>Imagen editorial no disponible</span>
            </div>
          ) : (
            <Image
              src={story.image.src}
              alt={story.image.alt}
              fill
              priority={carousel.activeIndex === 0}
              sizes="(min-width: 1024px) 65vw, 100vw"
              onError={() => {
                setFailedImages((current) => ({ ...current, [story.id]: true }));
              }}
            />
          )}
          <span className={styles.imageLabel}>Ilustración editorial</span>
        </div>
        <div className={styles.storyCopy}>
          <p>{story.kicker}</p>
          <h3 id={`story-${story.id}`}>{story.title}</h3>
          <p>{story.description}</p>
          <span className={styles.storyCount} aria-hidden="true">
            {String(carousel.activeIndex + 1).padStart(2, '0')} /{' '}
            {String(stories.length).padStart(2, '0')}
          </span>
        </div>
      </article>

      <div className={styles.carouselToolbar}>
        <div className={styles.arrowControls}>
          <button type="button" onClick={carousel.previous} aria-label="Historia anterior">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" onClick={carousel.next} aria-label="Siguiente historia">
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className={styles.indicators} role="group" aria-label="Seleccionar historia">
          {stories.map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-label={`Ir a la historia ${index + 1}: ${item.title}`}
              aria-current={index === carousel.activeIndex ? 'true' : undefined}
              onClick={() => carousel.setActiveIndex(index)}
            />
          ))}
        </div>

        <button
          className={styles.playControl}
          type="button"
          aria-label={carousel.isPlaying ? 'Pausar carrusel' : 'Reproducir carrusel'}
          onClick={() => carousel.setIsPlaying((current) => !current)}
        >
          <span aria-hidden="true">{carousel.isPlaying ? 'Ⅱ' : '▶'}</span>
          {carousel.isPlaying ? 'Pausar' : 'Reproducir'}
        </button>
      </div>

      <p
        className="sr-only"
        aria-live={carousel.isPlaying && !carousel.isInteractionPaused ? 'off' : 'polite'}
      >
        Historia {carousel.activeIndex + 1} de {stories.length}: {story.title}
      </p>
    </div>
  );
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
