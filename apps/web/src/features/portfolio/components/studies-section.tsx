import type { Study, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { getStorageUrl } from '@/lib/config';
import { formatDateRange } from '../lib/format-date-range';

interface StudiesSectionProps {
  studies: Study[];
  translations: Translations;
  locale: string;
}

/**
 * Reframed at the user's request from personal "Education" (spec §5.5) to
 * the team's formal training: degrees, certifications, diplomas. The data
 * model (institution/title/field/dates) already fits this without changes —
 * only the section's own copy/heading changes; `Study.institution` and
 * `Study.field` map naturally to "certifying body" and "specialization".
 */
export function StudiesSection({ studies, translations, locale }: StudiesSectionProps) {
  if (studies.length === 0) return null;

  const heading = translateValue(translations.educationHeading, locale) ?? 'Formación y certificaciones del equipo';

  return (
    <section className="section studies-section" id="formacion" aria-labelledby="studies-title">
      <ParallaxBackground src="/photos/certifications.webp" />
      <div className="shell">
        <div className="section-heading">
          <p className="eyebrow">Formación</p>
          <h2 id="studies-title">{heading}</h2>
        </div>

        <ul className="studies-list">
          {studies.map((study) => {
            const title = translateValue(study.title, locale);
            const description = translateValue(study.description, locale);

            return (
              <li key={study.id} className="study-card">
                {study.logo ? (
                  <img className="study-logo" src={getStorageUrl(study.logo)} alt="" loading="lazy" />
                ) : null}
                <div>
                  <span className="study-period">
                    {formatDateRange(study.startDate, study.endDate, study.inProgress)}
                  </span>
                  <h3>{title}</h3>
                  <p className="study-institution">
                    {study.institution}
                    {study.field ? ` · ${study.field}` : ''}
                  </p>
                  {description ? <p>{description}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
