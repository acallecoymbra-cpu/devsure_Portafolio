import type { Testimonial, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { getStorageUrl } from '@/lib/config';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  translations: Translations;
  locale: string;
}

export function TestimonialsSection({ testimonials, translations, locale }: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null;

  const heading = translateValue(translations.testimonialsHeading, locale) ?? 'Lo que dicen nuestros clientes';

  return (
    <section className="section testimonials-section" id="testimonios" aria-labelledby="testimonials-title">
      <ParallaxBackground src="/photos/testimonials.webp" />
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">Testimonios</p>
          <h2 id="testimonials-title">{heading}</h2>
        </div>

        <ul className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <li key={testimonial.id} className="testimonial-card">
              <p className="testimonial-quote">{testimonial.quote}</p>
              <div className="testimonial-author">
                {testimonial.avatar ? (
                  <img
                    className="testimonial-avatar"
                    src={getStorageUrl(testimonial.avatar)}
                    alt=""
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <span className="testimonial-author-name">{testimonial.author}</span>
                  {testimonial.role || testimonial.company ? (
                    <span className="testimonial-author-role">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
