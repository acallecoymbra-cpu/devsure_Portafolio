import type { Profile, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { AboutStats } from '@/features/portfolio/components/about-stats';

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
      <ParallaxBackground src="/photos/office-window.webp" />
      <div className="shell about-layout">
        <div className="about-copy">
          <p className="eyebrow">Nosotros</p>
          <h2 id="about-title">{heading}</h2>
          {body ? <p>{body}</p> : null}
        </div>

        {profile.stats.length > 0 ? <AboutStats stats={profile.stats} locale={locale} /> : null}
      </div>
    </section>
  );
}
