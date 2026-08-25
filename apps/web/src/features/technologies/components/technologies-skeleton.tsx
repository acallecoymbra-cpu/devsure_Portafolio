export function TechnologiesSkeleton() {
  return (
    <section
      className="section technologies-section"
      aria-labelledby="technologies-loading-title"
      aria-busy="true"
    >
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Capacidad técnica</p>
            <h2 id="technologies-loading-title">Tecnologías que manejamos</h2>
          </div>
          <p>Cargando el catálogo publicado…</p>
        </div>
        <div className="skeleton-toolbar skeleton-shimmer" />
        <div className="skeleton-grid" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span className="skeleton-tile skeleton-shimmer" key={index} />
          ))}
        </div>
        <span className="sr-only" role="status">
          Cargando tecnologías
        </span>
      </div>
    </section>
  );
}
