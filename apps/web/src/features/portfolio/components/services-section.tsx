import type { Service, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';

interface ServicesSectionProps {
  services: Service[];
  translations: Translations;
  locale: string;
}

/**
 * `Translations` has no dedicated `servicesHeading` field — its column names
 * follow the original personal-portfolio spec (Hero/About/Strengths/
 * Experience/Education/Portfolio/Skills/Workstyle/...), and `Services`
 * is DevSure's company-level replacement for that `Skills` section (see
 * CONTINUACION-DEVSURE-ADMIN.md, sesión 13). Reusing `skillsHeading`/
 * `skillsIntro` here keeps this heading admin-editable without a new
 * migration for a column that would just duplicate it.
 */
export function ServicesSection({ services, translations, locale }: ServicesSectionProps) {
  if (services.length === 0) return null;

  const heading = translateValue(translations.skillsHeading, locale) ?? 'Servicios';
  const intro = translateValue(translations.skillsIntro, locale);

  return (
    <section className="section" id="servicios" aria-labelledby="services-title">
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Lo que hacemos</p>
            <h2 id="services-title">{heading}</h2>
          </div>
          {intro ? <p>{intro}</p> : null}
        </div>

        <div className="card-grid">
          {services.map((service, index) => (
            <article key={service.id} className="offer-card">
              <span className="offer-card-badge" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{translateValue(service.title, locale)}</h3>
              <p>{translateValue(service.description, locale)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
