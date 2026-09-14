import Link from 'next/link';
import { ParallaxBackground } from '@/components/parallax-background';
import { getAllTechnologies } from '@/features/technologies/api/get-technologies';
import { Reveal } from '@/components/reveal';
import { TechnologiesErrorState } from './technologies-error-boundary';
import { TechnologyImage } from './technology-image';

// The teaser is a single icon-only row (see `.technologies-teaser-row` in
// globals.css) — deliberately not the `.technology-grid` cards the full
// `/tecnologias` catalog uses, so this limit is just "how many comfortably
// fit one line on a wide screen" rather than a row/column multiple.
const TEASER_LIMIT = 10;

/**
 * Home teaser only (spec follow-up): showing all 41+ technologies at once
 * read as overwhelming. This shows `featured` technologies (curated from
 * `/admin/technologies`), falling back to the first N by `sortOrder` when
 * none are marked featured yet, with a link to the full catalog at
 * `/tecnologias` (the former in-page explorer, moved there wholesale).
 */
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
      <ParallaxBackground src="/photos/tech-world.webp" />
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
          <>
            <ul className="technologies-teaser-row">
              {teaserOf(technologies).map((technology) => (
                <Reveal
                  as="li"
                  key={technology.id}
                  className="technologies-teaser-item"
                  title={technology.name}
                  data-testid="technology-card"
                  data-technology-id={technology.id}
                >
                  <TechnologyImage technology={technology} />
                  <span className="sr-only">{technology.name}</span>
                </Reveal>
              ))}
            </ul>
            <div className="technologies-teaser-footer">
              <Link className="button button-secondary" href="/tecnologias">
                Ver catálogo completo ({technologies.length}) <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
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

function teaserOf(technologies: Awaited<ReturnType<typeof getAllTechnologies>>) {
  const featured = technologies.filter((technology) => technology.featured);
  return (featured.length > 0 ? featured : technologies).slice(0, TEASER_LIMIT);
}
