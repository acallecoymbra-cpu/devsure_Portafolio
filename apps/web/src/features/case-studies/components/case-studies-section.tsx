import type { Project, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { getStorageUrl } from '@/lib/config';

interface CaseStudiesSectionProps {
  projects: Project[];
  translations: Translations;
  locale: string;
}

/** "Casos de éxito": featured, published `Project`s (see `GET /api/v1/portfolio`). Each card links to its own page at `/casos-de-exito/[slug]`. Hidden until there's real content. */
export function CaseStudiesSection({ projects, translations, locale }: CaseStudiesSectionProps) {
  if (projects.length === 0) return null;

  const heading = translateValue(translations.portfolioHeading, locale) ?? 'Trabajos realizados';
  const intro =
    translateValue(translations.portfolioIntro, locale) ??
    'Una muestra de proyectos en los que convertimos necesidades concretas en soluciones digitales.';

  return (
    <section
      className="section case-studies-section"
      id="trabajos-realizados"
      aria-labelledby="case-studies-title"
    >
      <div className="shell">
        <div className="section-heading-wide case-studies-heading">
          <div>
            <p className="eyebrow">Portafolio</p>
            <h2 id="case-studies-title">{heading}</h2>
          </div>
          <p>{intro}</p>
        </div>
        <div className="case-study-grid">
          {projects.map((project) => {
            const title = translateValue(project.title, locale) ?? '';
            const image = project.coverImage ?? project.gallery[0];

            return (
              <Reveal
                as={Link}
                key={project.id}
                className="case-study-card"
                href={`/casos-de-exito/${project.slug}`}
              >
                {image ? (
                  <span className="case-study-image-wrap">
                    <img src={getStorageUrl(image)} alt={`Logotipo de ${title}`} loading="lazy" />
                  </span>
                ) : null}
                <span className="case-study-card-content">
                  {project.category ? <span className="case-study-kicker">{project.category}</span> : null}
                  <strong>{title}</strong>
                  <span>
                    Ver el caso <span aria-hidden="true">→</span>
                  </span>
                </span>
              </Reveal>
            );
          })}
        </div>

        <div className="technologies-teaser-footer">
          <Link className="button button-secondary" href="/casos-de-exito">
            Ver todos los casos de éxito <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
