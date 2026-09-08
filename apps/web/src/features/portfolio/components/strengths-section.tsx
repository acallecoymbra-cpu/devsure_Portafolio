import type { Strength, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';

interface StrengthsSectionProps {
  strengths: Strength[];
  translations: Translations;
  locale: string;
}

/** "Por qué elegirnos" — maps closely to `sinaloanube-master`'s `diferenciadores`. */
export function StrengthsSection({ strengths, translations, locale }: StrengthsSectionProps) {
  if (strengths.length === 0) return null;

  const heading = translateValue(translations.strengthsHeading, locale) ?? 'Por qué elegirnos';
  const intro = translateValue(translations.strengthsIntro, locale);

  return (
    <section className="section" id="diferenciadores" aria-labelledby="strengths-title">
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Diferenciadores</p>
            <h2 id="strengths-title">{heading}</h2>
          </div>
          {intro ? <p>{intro}</p> : null}
        </div>

        <div className="card-grid">
          {strengths.map((strength) => (
            <article key={strength.id} className="offer-card">
              <span className="offer-card-tag">{translateValue(strength.label, locale)}</span>
              <h3>{translateValue(strength.title, locale)}</h3>
              <p>{translateValue(strength.body, locale)}</p>
              {strength.techStack.length > 0 ? (
                <ul className="tag-row">
                  {strength.techStack.map((tech) => (
                    <li key={tech} className="tag-pill">
                      {tech}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
