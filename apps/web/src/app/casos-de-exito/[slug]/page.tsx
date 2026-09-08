import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { translateValue } from '@devsure/contracts';
import { getPortfolio } from '@/features/portfolio/api/get-portfolio';
import { getPublishedProjectBySlug } from '@/features/projects/api/get-projects';
import { getStorageUrl } from '@/lib/config';

interface CaseStudyDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CaseStudyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [project, portfolio] = await Promise.all([getPublishedProjectBySlug(slug), getPortfolio()]);
  if (!project) return { title: 'Caso no encontrado' };

  const locale = portfolio.profile.defaultLocale || 'es';
  const title = translateValue(project.title, locale) ?? project.slug;
  const description = translateValue(project.excerpt, locale);

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/casos-de-exito/${project.slug}` },
  };
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailPageProps) {
  const { slug } = await params;
  const [project, portfolio] = await Promise.all([getPublishedProjectBySlug(slug), getPortfolio()]);
  if (!project) notFound();

  const locale = portfolio.profile.defaultLocale || 'es';
  const title = translateValue(project.title, locale) ?? '';
  const description = translateValue(project.description, locale);

  return (
    <section className="section case-detail" aria-labelledby="case-detail-title">
      <div className="shell case-detail-layout">
        <Link className="back-link" href="/casos-de-exito">
          <span aria-hidden="true">←</span> Casos de éxito
        </Link>

        {project.coverImage ? (
          <div className="case-detail-cover">
            <img src={getStorageUrl(project.coverImage)} alt={`Logotipo de ${title}`} />
          </div>
        ) : null}

        <div className="case-detail-header">
          {project.category ? <p className="eyebrow">{project.category}</p> : null}
          <h1 id="case-detail-title">{title}</h1>
        </div>

        {description ? <p className="case-detail-description">{description}</p> : null}

        {project.techStack.length > 0 ? (
          <ul className="tag-row">
            {project.techStack.map((tech) => (
              <li key={tech} className="tag-pill">
                {tech}
              </li>
            ))}
          </ul>
        ) : null}

        {project.apps.length > 0 ? (
          <div className="case-detail-apps">
            {project.apps.map((app, index) => {
              const appDescription = translateValue(app.description, locale);
              const links = app.links ? Object.entries(app.links) : [];

              return (
                <article key={index} className="case-detail-app">
                  <h2>
                    {app.name}
                    {app.platform ? ` · ${app.platform}` : ''}
                  </h2>
                  {appDescription ? <p>{appDescription}</p> : null}
                  {app.techStack && app.techStack.length > 0 ? (
                    <ul className="tag-row">
                      {app.techStack.map((tech) => (
                        <li key={tech} className="tag-pill">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {links.length > 0 ? (
                    <ul className="case-detail-app-links">
                      {links.map(([label, href]) => (
                        <li key={label}>
                          <a href={href} target="_blank" rel="noreferrer">
                            {label} <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        {project.gallery.length > 0 ? (
          <div className="case-detail-gallery">
            {project.gallery.map((image) => (
              <img key={image} src={getStorageUrl(image)} alt="" loading="lazy" />
            ))}
          </div>
        ) : null}

        {project.url || project.repoUrl ? (
          <dl className="case-study-facts">
            {project.url ? (
              <div>
                <dt>Sitio</dt>
                <dd>
                  <a href={project.url} target="_blank" rel="noreferrer">
                    Ver en vivo ↗
                  </a>
                </dd>
              </div>
            ) : null}
            {project.repoUrl ? (
              <div>
                <dt>Código</dt>
                <dd>
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    Repositorio ↗
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="cta-banner">
          <h2>¿Tienes un reto parecido?</h2>
          <Link className="button button-primary" href="/#contacto">
            Cuéntanos tu proyecto <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
