import type { Profile, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { ParallaxBackground } from '@/components/parallax-background';
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
    <section className={styles.hero} aria-labelledby="hero-title" data-testid="home-hero">
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

        <div
          className={styles.signalCard}
          aria-labelledby="certainty-signal-title"
          data-testid="home-hero-signal"
        >
          <div className={styles.signalHeader}>
            <p>Ruta de certeza</p>
            <span>
              <i aria-hidden="true" /> Señal activa
            </span>
          </div>
          <h2 id="certainty-signal-title">Cada entrega deja una base más segura.</h2>

          <div className={styles.pathWrap}>
            <svg
              className={styles.pathSvg}
              viewBox="0 0 2 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path className={styles.pathTrack} d="M1,0 L1,100" pathLength={100} vectorEffect="non-scaling-stroke" />
              <path className={styles.pathDraw} d="M1,0 L1,100" pathLength={100} vectorEffect="non-scaling-stroke" />
            </svg>
            <span className={styles.pathPulse} aria-hidden="true" />

            <ol className={styles.signalSteps}>
              <li>
                <span className={styles.stepNumber}>01</span>
                <div>
                  <h3>Entender</h3>
                  <p>Objetivo, contexto y riesgos antes de construir.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNumber}>02</span>
                <div>
                  <h3>Construir</h3>
                  <p>Una solución proporcional al problema real.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNumber}>03</span>
                <div>
                  <h3>Verificar</h3>
                  <p>Calidad visible antes de seguir avanzando.</p>
                </div>
              </li>
            </ol>
          </div>

          <p className={styles.signalResult}>
            <span aria-hidden="true" />
            Lista para evolucionar
          </p>
        </div>
      </div>
    </section>
  );
}
