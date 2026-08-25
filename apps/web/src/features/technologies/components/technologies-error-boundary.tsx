'use client';

import { useRouter } from 'next/navigation';

export function TechnologiesErrorState() {
  const router = useRouter();

  return (
    <section
      className="section technologies-section"
      id="tecnologias"
      aria-labelledby="technologies-error-title"
    >
      <div className="shell catalog-error" role="alert">
        <p className="eyebrow">Catálogo no disponible</p>
        <h2 id="technologies-error-title">No pudimos cargar las tecnologías.</h2>
        <p>La portada sigue disponible. Puedes volver a intentar esta sección.</p>
        <button className="button button-primary" type="button" onClick={() => router.refresh()}>
          Reintentar
        </button>
      </div>
    </section>
  );
}
