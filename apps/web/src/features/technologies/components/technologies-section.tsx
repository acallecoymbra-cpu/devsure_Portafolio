import { getAllTechnologies } from '@/features/technologies/api/get-technologies';
import { TechnologiesErrorState } from './technologies-error-boundary';
import { TechnologyExplorer } from './technology-explorer';

export async function TechnologiesSection() {
  let technologies: Awaited<ReturnType<typeof getAllTechnologies>>;

  try {
    technologies = await getAllTechnologies();
  } catch {
    return <TechnologiesErrorState />;
  }

  return (
    <section
      className="section technologies-section"
      id="tecnologias"
      aria-labelledby="technologies-title"
    >
      <div className="shell">
        <div className="section-heading section-heading-wide">
          <div>
            <p className="eyebrow">Capacidad técnica</p>
            <h2 id="technologies-title">Tecnologías que manejamos</h2>
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
