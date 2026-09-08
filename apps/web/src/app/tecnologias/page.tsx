import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllTechnologies } from '@/features/technologies/api/get-technologies';
import { TechnologiesErrorState } from '@/features/technologies/components/technologies-error-boundary';
import { TechnologiesSkeleton } from '@/features/technologies/components/technologies-skeleton';
import { TechnologyExplorer } from '@/features/technologies/components/technology-explorer';

export const metadata: Metadata = {
  title: 'Tecnologías',
  description: 'Catálogo completo de lenguajes, plataformas y prácticas que DevSure utiliza en sus proyectos.',
  alternates: { canonical: '/tecnologias' },
};

export default function TecnologiasPage() {
  return (
    <Suspense fallback={<TechnologiesSkeleton />}>
      <TechnologiesCatalog />
    </Suspense>
  );
}

async function TechnologiesCatalog() {
  let technologies: Awaited<ReturnType<typeof getAllTechnologies>>;

  try {
    technologies = await getAllTechnologies();
  } catch {
    return <TechnologiesErrorState />;
  }

  return (
    <section className="section technologies-page" aria-labelledby="technologies-page-title">
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Capacidad técnica</p>
            <h1 id="technologies-page-title">Tecnologías que manejamos</h1>
          </div>
          <p>
            Un catálogo transparente de lenguajes, plataformas y prácticas que forman parte de
            nuestro trabajo.
          </p>
        </div>

        {technologies.length > 0 ? (
          <TechnologyExplorer technologies={technologies} />
        ) : (
          <div className="catalog-empty" role="status">
            <h3>Aún no hay tecnologías publicadas</h3>
            <p>El catálogo estará disponible cuando exista contenido aprobado.</p>
          </div>
        )}
      </div>
    </section>
  );
}
