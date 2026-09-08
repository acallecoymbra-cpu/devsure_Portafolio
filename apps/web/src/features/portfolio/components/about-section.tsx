import type { Profile, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';

interface AboutSectionProps {
  profile: Profile;
  translations: Translations;
  locale: string;
}

/** "Nosotros": identity copy plus the optional metrics strip (`Profile.stats`). */
export function AboutSection({ profile, translations, locale }: AboutSectionProps) {
  const heading = translateValue(translations.aboutHeading, locale) ?? 'Quiénes somos';
  const body = translateValue(translations.aboutBody, locale);

  return (
    <section className="section about-section" id="nosotros" aria-labelledby="about-title">
      <div className="shell about-layout">
        <div className="about-copy">
          <p className="eyebrow">Nosotros</p>
          <h2 id="about-title">{heading}</h2>
          {body ? <p>{body}</p> : null}
        </div>

        {profile.stats.length > 0 ? (
          <ul className="about-stats">
            {profile.stats.map((stat, index) => (
              <li key={index} className="about-stat">
                <strong>
                  {stat.value}
                  {stat.suffix ?? ''}
                </strong>
                <span>{translateValue(stat.label, locale)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
