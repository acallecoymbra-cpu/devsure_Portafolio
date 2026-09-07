import styles from '@/features/home/home-hero.module.css';

export function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title" data-testid="home-hero">
      <div className={styles.environment} aria-hidden="true">
        <span className={styles.environmentGrid} />
        <span className={styles.environmentGlow} data-testid="home-hero-glow" />
      </div>

      <div className={`shell ${styles.layout}`}>
        <div className={styles.copy}>
          <p className="eyebrow">Software con criterio técnico</p>
          <h1 id="hero-title">Construimos software claro desde la primera decisión.</h1>
          <p className={styles.description}>
            Convertimos necesidades de negocio en productos mantenibles, verificables y preparados
            para evolucionar junto a tu operación.
          </p>
          <div className={styles.actions}>
            <a className="button button-primary" href="#tecnologias">
              Explorar tecnologías
            </a>
            <a className={styles.secondaryLink} href="#enfoque">
              Conocer el enfoque <span aria-hidden="true">↓</span>
            </a>
          </div>
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
