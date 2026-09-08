'use client';

import type { Project } from '@devsure/contracts';
import { translateValue } from '@devsure/contracts';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getStorageUrl } from '@/lib/config';

const ALL_CATEGORIES = 'all';

interface ProjectsExplorerProps {
  projects: Project[];
  locale: string;
}

/** Filter-by-category grid for `/casos-de-exito` (spec follow-up, mirrors the shape of `sinaloanube-master`'s case-studies page — never its copy, logos or exact composition). */
export function ProjectsExplorer({ projects, locale }: ProjectsExplorerProps) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const project of projects) if (project.category) found.add(project.category);
    return [...found].sort((a, b) => a.localeCompare(b, 'es'));
  }, [projects]);

  const filtered =
    activeCategory === ALL_CATEGORIES ? projects : projects.filter((project) => project.category === activeCategory);

  return (
    <div className="projects-explorer">
      {categories.length > 0 ? (
        <div className="chip-list" role="group" aria-label="Filtrar por categoría">
          <button
            className="filter-chip"
            type="button"
            aria-pressed={activeCategory === ALL_CATEGORIES}
            onClick={() => setActiveCategory(ALL_CATEGORIES)}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className="filter-chip"
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="case-grid">
          {filtered.map((project) => {
            const title = translateValue(project.title, locale) ?? '';
            const excerpt = translateValue(project.excerpt, locale);
            const image = project.coverImage ?? project.gallery[0];

            return (
              <li key={project.id} className="case-card">
                <Link href={`/casos-de-exito/${project.slug}`}>
                  {image ? (
                    <span className="case-card-image">
                      <img src={getStorageUrl(image)} alt="" loading="lazy" />
                    </span>
                  ) : null}
                  <span className="case-card-content">
                    {project.category ? <span className="case-card-tag">{project.category}</span> : null}
                    <strong>{title}</strong>
                    {excerpt ? <span className="case-card-excerpt">{excerpt}</span> : null}
                    <span className="case-card-cta">
                      Ver el caso <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="catalog-empty filtered-empty" role="status">
          <h3>No hay casos en esta categoría</h3>
          <p>Prueba con otra categoría o vuelve a &ldquo;Todos&rdquo;.</p>
        </div>
      )}
    </div>
  );
}
