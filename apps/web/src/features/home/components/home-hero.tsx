import type { Profile, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
import { getStorageUrl } from '@/lib/config';
import HeroOrb from './hero-orb';
import styles from '@/features/home/home-hero.module.css';

interface HomeHeroProps {
  profile: Profile;
  translations: Translations;
  locale: string;
}

export function HomeHero({ profile, translations, locale }: HomeHeroProps) {
  const eyebrow = translations.heroTag ?? 'Software con criterio técnico';
  const title =
    translateValue(translations.heroTitle, locale) ?? 'Construimos software claro desde la primera decisión.';
  const description =
    translateValue(translations.heroCopy, locale) ??
    'Convertimos necesidades de negocio en productos mantenibles, verificables y preparados para evolucionar junto a tu operación.';
  const note = translateValue(translations.heroNote, locale) ?? translateValue(profile.headline, locale);

  return (
    <section
      className={`${styles.hero} home-hero-section`}
      aria-labelledby="hero-title"
      data-testid="home-hero"
    >
      <ParallaxBackground src="/photos/night-code.webp" priority />
      <span className={styles.environmentGlow} aria-hidden="true" data-testid="home-hero-glow" />

      <div className={`shell ${styles.layout}`}>
        <div className={styles.copy}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="hero-title">{title}</h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.actions}>
            <a className="button button-primary" href="#servicios">
              Ver servicios
            </a>
            <a className={styles.secondaryLink} href="#contacto">
              Hablar con {profile.name} <span aria-hidden="true">↓</span>
            </a>
          </div>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>

        {profile.heroVisual ? null : (
          <div className={styles.orbCard} data-testid="home-hero-signal">
            <HeroOrb className={styles.orbCanvas} />
          </div>
        )}
      </div>

      {/* Rendered after `.copy` so on narrow screens (normal flow, no
          absolute positioning below `64rem`) it lands below the hero text
          instead of above it. On wide screens `position: absolute` pulls it
          out of flow and its own explicit `z-index` — not DOM order —
          decides the stacking against `.layout`, so moving it here doesn't
          change the desktop look. */}
      {profile.heroVisual ? (
        <img
          className={styles.heroVisual}
          src={getStorageUrl(profile.heroVisual)}
          alt=""
          data-testid="home-hero-signal"
        />
      ) : null}
    </section>
  );
}
