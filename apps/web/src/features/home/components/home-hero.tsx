import type { Profile, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
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
      <div className={styles.environment} aria-hidden="true">
        <span className={styles.environmentGrid} />
        <span className={styles.environmentGlow} data-testid="home-hero-glow" />
      </div>

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

          <p className={styles.signalResult}>
            <span aria-hidden="true" />
            Lista para evolucionar
          </p>
        </div>
      </div>
    </section>
  );
}
