'use client';

import type { Project, Translations } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import { useEffect, useRef, useState } from 'react';
import { getStorageUrl } from '@/lib/config';

interface CaseStudiesSectionProps {
  projects: Project[];
  translations: Translations;
  locale: string;
}

/** "Casos de éxito": featured, published `Project`s (see `GET /api/v1/portfolio`). Hidden until there's real content. */
export function CaseStudiesSection({ projects, translations, locale }: CaseStudiesSectionProps) {
  const [openId, setOpenId] = useState<string>();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const active = projects.find((project) => project.id === openId);

  useEffect(() => {
    if (!active) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(undefined);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active]);

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
              <button
                key={project.id}
                className="case-study-card"
                type="button"
                onClick={() => setOpenId(project.id)}
              >
                {image ? (
                  <span className="case-study-image-wrap">
                    <img src={getStorageUrl(image)} alt={`Logotipo de ${title}`} loading="lazy" />
                  </span>
                ) : null}
                <span className="case-study-card-content">
                  <span className="case-study-kicker">Caso de éxito</span>
                  <strong>{title}</strong>
                  <span>
                    Ver detalle del trabajo realizado <span aria-hidden="true">↗</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {active ? (
        <div
          className="case-study-modal-backdrop"
          role="presentation"
          onMouseDown={() => setOpenId(undefined)}
        >
          <div
            className="case-study-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-study-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setOpenId(undefined)}
              ref={closeButtonRef}
            >
              <span aria-hidden="true">×</span> Cerrar
            </button>
            {active.coverImage ? (
              <div className="case-study-modal-image">
                <img
                  src={getStorageUrl(active.coverImage)}
                  alt={`Logotipo de ${translateValue(active.title, locale)}`}
                />
              </div>
            ) : null}
            <div className="case-study-modal-body">
              <p className="eyebrow">Caso de éxito</p>
              <h2 id="case-study-modal-title">{translateValue(active.title, locale)}</h2>
              <p className="case-study-description">{translateValue(active.description, locale)}</p>

              {active.techStack.length > 0 ? (
                <ul className="tag-row">
                  {active.techStack.map((tech) => (
                    <li key={tech} className="tag-pill">
                      {tech}
                    </li>
                  ))}
                </ul>
              ) : null}

              {active.url || active.repoUrl ? (
                <dl className="case-study-facts">
                  {active.url ? (
                    <div>
                      <dt>Sitio</dt>
                      <dd>
                        <a href={active.url} target="_blank" rel="noreferrer">
                          Ver en vivo ↗
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {active.repoUrl ? (
                    <div>
                      <dt>Código</dt>
                      <dd>
                        <a href={active.repoUrl} target="_blank" rel="noreferrer">
                          Repositorio ↗
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
