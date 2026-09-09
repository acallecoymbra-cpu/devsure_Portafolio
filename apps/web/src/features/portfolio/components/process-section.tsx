import type { Translations, WorkStyleItem } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { Reveal } from '@/components/reveal';

interface ProcessSectionProps {
  workStyleItems: WorkStyleItem[];
  translations: Translations;
  locale: string;
}

/** "Cómo trabajamos" — step numbers come from position, not a stored field (spec §5.9). */
export function ProcessSection({ workStyleItems, translations, locale }: ProcessSectionProps) {
  if (workStyleItems.length === 0) return null;

  const heading = translateValue(translations.workstyleHeading, locale) ?? 'Cómo trabajamos';
  const intro = translateValue(translations.workstyleIntro, locale);

  return (
    <section className="section process-section" id="proceso" aria-labelledby="process-title">
      <ParallaxBackground src="/photos/conference-room.webp" />
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Proceso</p>
            <h2 id="process-title">{heading}</h2>
          </div>
          {intro ? <p>{intro}</p> : null}
        </div>

        <ol className="process-list">
          {workStyleItems.map((item) => (
            <Reveal as="li" key={item.id} className="process-item">
              <p>{translateValue(item.text, locale)}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
