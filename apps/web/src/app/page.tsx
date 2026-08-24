const principles = [
  {
    number: '01',
    title: 'Claridad antes que ruido',
    text: 'Cada decisión visible debe ayudar a orientarse, entender y avanzar.',
  },
  {
    number: '02',
    title: 'Accesible desde el inicio',
    text: 'Contraste, teclado, foco y movimiento reducido forman parte de la base.',
  },
  {
    number: '03',
    title: 'Preparado para crecer',
    text: 'La estructura inicial deja espacio para conectar contenido real sin rehacer la experiencia.',
  },
];

const route = ['Explorar el contexto', 'Definir una dirección', 'Construir con cuidado'];

export default function HomePage() {
  return (
    <>
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Fase 0 · fundaciones</p>
          <h1 id="hero-title">
            Lo esencial para empezar
            <span className="accent-text"> bien.</span>
          </h1>
          <p className="hero-description">
            DevSure nace con una interfaz pequeña, honesta y lista para acompañar decisiones
            digitales con menos fricción.
          </p>
          <a className="button button-primary" href="#principios">
            Conocer la base <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-visual" aria-label="Resumen visual del estado inicial">
          <div className="orbit orbit-large" />
          <div className="orbit orbit-small" />
          <div className="hero-card">
            <div className="card-label">estado del sistema</div>
            <div className="signal-row">
              <span className="signal-icon" aria-hidden="true">
                ✓
              </span>
              <strong>Base lista</strong>
            </div>
            <p>Una pantalla que puede crecer sin perder su centro.</p>
            <div className="progress-track" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </section>

      <section className="section shell" id="principios" aria-labelledby="principles-title">
        <div className="section-heading">
          <p className="eyebrow">Una forma de hacer</p>
          <h2 id="principles-title">Pequeñas decisiones, mejor experiencia.</h2>
        </div>
        <div className="principles-grid">
          {principles.map((principle) => (
            <article className="principle-card" key={principle.number}>
              <span className="principle-number">{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section route-section" id="ruta" aria-labelledby="route-title">
        <div className="shell route-layout">
          <div className="section-heading">
            <p className="eyebrow">La ruta</p>
            <h2 id="route-title">Un recorrido simple para una primera versión.</h2>
          </div>
          <ol className="route-list">
            {route.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section shell status-section" id="estado" aria-labelledby="status-title">
        <div className="status-panel">
          <div>
            <p className="eyebrow">Ahora mismo</p>
            <h2 id="status-title">La interfaz está lista para el siguiente paso.</h2>
          </div>
          <p>
            Esta Fase 0 no adelanta catálogo ni autenticación: prepara el espacio, la navegación y
            las decisiones de accesibilidad que sostendrán lo que venga después.
          </p>
        </div>
      </section>
    </>
  );
}
