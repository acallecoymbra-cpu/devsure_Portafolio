import type { Faq, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { Reveal } from '@/components/reveal';

interface FaqSectionProps {
  faqs: Faq[];
  translations: Translations;
  locale: string;
}

export function FaqSection({ faqs, translations, locale }: FaqSectionProps) {
  if (faqs.length === 0) return null;

  const heading = translateValue(translations.faqHeading, locale) ?? 'Preguntas frecuentes';

  return (
    <section className="section faq-section" id="preguntas" aria-labelledby="faq-title">
      <ParallaxBackground src="/photos/faq-support.webp" />
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 id="faq-title">{heading}</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <Reveal as="details" key={faq.id} className="faq-item">
              <summary>{translateValue(faq.question, locale)}</summary>
              <p>{translateValue(faq.answer, locale)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
