'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Testimonial, TestimonialHighlightIcon, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { Reveal } from '@/components/reveal';
import { getStorageUrl } from '@/lib/config';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  translations: Translations;
  locale: string;
}

export function TestimonialsSection({ testimonials, translations, locale }: TestimonialsSectionProps) {
  const cardsPerView = useCardsPerView();
  const pages = useMemo(() => chunk(testimonials, cardsPerView), [testimonials, cardsPerView]);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    setActivePage((current) => Math.min(current, Math.max(pages.length - 1, 0)));
  }, [pages.length]);

  if (testimonials.length === 0) return null;

  const heading = translateValue(translations.testimonialsHeading, locale) ?? 'Lo que dicen nuestros clientes';
  const { lead, accent } = splitHeadingAccent(heading);
  const showControls = pages.length > 1;
  const current = pages[Math.min(activePage, pages.length - 1)] ?? [];

  const goTo = (index: number) => setActivePage((index + pages.length) % pages.length);

  return (
    <section className="section testimonials-section" id="testimonios" aria-labelledby="testimonials-title">
      <ParallaxBackground src="/photos/testimonials.webp" />
      <div className="shell">
        <div className="section-heading testimonials-heading">
          <p className="eyebrow">Testimonios</p>
          <h2 id="testimonials-title">
            {lead ? `${lead} ` : null}
            <span className="accent-text">{accent}</span>
          </h2>
          <p className="testimonials-intro">Historias reales de empresas que confiaron en DevSure.</p>
        </div>

        <div className="testimonials-carousel" role="region" aria-roledescription="carrusel" aria-label="Testimonios de clientes">
          {showControls ? (
            <button
              type="button"
              className="testimonials-nav testimonials-nav--prev"
              onClick={() => goTo(activePage - 1)}
              aria-label="Testimonios anteriores"
            >
              <span aria-hidden="true">‹</span>
            </button>
          ) : null}

          <ul className="testimonial-grid" aria-live="polite">
            {current.map((testimonial) => (
              <Reveal as="li" key={testimonial.id} className="testimonial-card">
                <div className="testimonial-card-header">
                  {testimonial.avatar ? (
                    <img
                      className="testimonial-avatar"
                      src={getStorageUrl(testimonial.avatar)}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="testimonial-avatar testimonial-avatar--placeholder" aria-hidden="true">
                      {initials(testimonial.author)}
                    </span>
                  )}
                  <div>
                    <span className="testimonial-author-name">{testimonial.author}</span>
                    {testimonial.role || testimonial.company ? (
                      <span className="testimonial-author-role">
                        {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <span className="testimonial-quote-icon" aria-hidden="true">
                  &ldquo;
                </span>
                <p className="testimonial-quote">{testimonial.quote}</p>

                <div className="testimonial-rating" aria-label={`Calificación ${testimonial.rating.toFixed(1)} de 5`}>
                  <span className="testimonial-stars" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, index) => (
                      <StarIcon key={index} filled={index < Math.round(testimonial.rating)} />
                    ))}
                  </span>
                  <span className="testimonial-rating-value">{testimonial.rating.toFixed(1)}</span>
                </div>

                {testimonial.highlightText ? (
                  <span className={`testimonial-tag testimonial-tag--${testimonial.highlightIcon ?? 'delivery'}`}>
                    <HighlightIcon variant={testimonial.highlightIcon ?? 'delivery'} />
                    {testimonial.highlightText}
                  </span>
                ) : null}
              </Reveal>
            ))}
          </ul>

          {showControls ? (
            <button
              type="button"
              className="testimonials-nav testimonials-nav--next"
              onClick={() => goTo(activePage + 1)}
              aria-label="Siguientes testimonios"
            >
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>

        {showControls ? (
          <div className="testimonials-dots" role="tablist" aria-label="Seleccionar página de testimonios">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === activePage}
                aria-label={`Ver página ${index + 1} de testimonios`}
                className={`testimonials-dot${index === activePage ? ' is-active' : ''}`}
                onClick={() => setActivePage(index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** 1 card per row on mobile, 2 from `48rem`, 3 from `64rem` — matches `.testimonial-grid`'s existing breakpoints. */
function useCardsPerView(): number {
  const [cardsPerView, setCardsPerView] = useState(1);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 64rem)');
    const tablet = window.matchMedia('(min-width: 48rem)');

    const update = () => setCardsPerView(desktop.matches ? 3 : tablet.matches ? 2 : 1);
    update();

    desktop.addEventListener('change', update);
    tablet.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      tablet.removeEventListener('change', update);
    };
  }, []);

  return cardsPerView;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Splits the last 2 words (or the last word, for short strings) off the heading so they can be rendered in accent color, matching the reference design's "…nuestros clientes" treatment. */
function splitHeadingAccent(heading: string): { lead: string; accent: string } {
  const words = heading.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { lead: '', accent: heading };
  const splitAt = words.length > 3 ? words.length - 2 : words.length - 1;
  return { lead: words.slice(0, splitAt).join(' '), accent: words.slice(splitAt).join(' ') };
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`testimonial-star${filled ? ' is-filled' : ''}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 1.5l2.6 5.44 5.9.74-4.3 4.2 1.1 5.99L10 14.98l-5.3 2.9 1.1-5.99-4.3-4.2 5.9-.74L10 1.5z" />
    </svg>
  );
}

function HighlightIcon({ variant }: { variant: TestimonialHighlightIcon }) {
  switch (variant) {
    case 'quality':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M4 15.5V9m5.5 6.5V4.5M15 15.5v-4" />
        </svg>
      );
    case 'infrastructure':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M10 2c2.4 2 3.6 4.6 3.6 7.6 0 1.7-.5 3.1-1.2 4.3l1.6 3.6-3.4-1.6a6.9 6.9 0 01-1.2.1c-.4 0-.8 0-1.2-.1l-3.4 1.6 1.6-3.6A8.6 8.6 0 016.4 9.6C6.4 6.6 7.6 4 10 2z" />
          <circle cx="10" cy="9" r="1.5" />
        </svg>
      );
    case 'support':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M2 10l3.2-3.2a2 2 0 012.8 0L10 8.8l2-2a2 2 0 012.8 0L18 10M6 11l2.6 2.6a2 2 0 002.8 0L14 11" />
        </svg>
      );
    case 'delivery':
    default:
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="3" y="7" width="14" height="9" rx="1.4" />
          <path d="M7 7V5.6A1.6 1.6 0 018.6 4h2.8A1.6 1.6 0 0113 5.6V7" />
        </svg>
      );
  }
}
