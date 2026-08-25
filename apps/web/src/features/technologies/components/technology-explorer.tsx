'use client';

import type { TechnologyCard } from '@devsure/contracts';
import { useId, useMemo, useState } from 'react';
import { getCategoryLabel, TECHNOLOGY_CATEGORIES } from '@/features/technologies/category-registry';
import { TechnologyTile } from './technology-tile';

const ALL_CATEGORIES = 'all';

export function TechnologyExplorer({ technologies }: { technologies: TechnologyCard[] }) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const normalizedQuery = normalize(query.trim());

  const filteredTechnologies = useMemo(
    () =>
      technologies.filter((technology) => {
        const matchesCategory =
          activeCategory === ALL_CATEGORIES || technology.category === activeCategory;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          normalize(`${technology.name} ${technology.summary ?? ''}`).includes(normalizedQuery);

        return matchesCategory && matchesQuery;
      }),
    [activeCategory, normalizedQuery, technologies],
  );

  const categoryOrder = [
    ...TECHNOLOGY_CATEGORIES.map(({ key }) => key),
    ...technologies
      .map(({ category }) => category)
      .filter(
        (category, index, categories) =>
          !TECHNOLOGY_CATEGORIES.some(({ key }) => key === category) &&
          categories.indexOf(category) === index,
      ),
  ];

  const visibleGroups = categoryOrder
    .map((category) => ({
      category,
      technologies: filteredTechnologies.filter((technology) => technology.category === category),
    }))
    .filter(({ technologies: categoryTechnologies }) => categoryTechnologies.length > 0);

  return (
    <div className="technology-explorer">
      <div className="technology-toolbar" aria-label="Explorar tecnologías">
        <div className="technology-search">
          <label htmlFor={searchId}>Buscar por nombre</label>
          <div className="search-control">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. Playwright"
            />
          </div>
        </div>

        <div className="category-filter">
          <span id="category-filter-label">Filtrar por categoría</span>
          <div className="chip-list" role="group" aria-labelledby="category-filter-label">
            <button
              className="filter-chip"
              type="button"
              aria-pressed={activeCategory === ALL_CATEGORIES}
              onClick={() => setActiveCategory(ALL_CATEGORIES)}
            >
              Todas
            </button>
            {TECHNOLOGY_CATEGORIES.map(({ key, label }) => (
              <button
                className="filter-chip"
                type="button"
                aria-pressed={activeCategory === key}
                onClick={() => setActiveCategory(key)}
                key={key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="results-summary" role="status" aria-live="polite">
        {filteredTechnologies.length === technologies.length
          ? `${technologies.length} tecnologías publicadas`
          : `${filteredTechnologies.length} de ${technologies.length} tecnologías`}
      </p>

      {visibleGroups.length > 0 ? (
        <div className="technology-groups">
          {visibleGroups.map(({ category, technologies: categoryTechnologies }) => (
            <section
              className="technology-group"
              aria-labelledby={`technology-category-${category}`}
              key={category}
            >
              <div className="technology-group-heading">
                <h3 id={`technology-category-${category}`}>{getCategoryLabel(category)}</h3>
                <span aria-label={`${categoryTechnologies.length} elementos`}>
                  {categoryTechnologies.length.toString().padStart(2, '0')}
                </span>
              </div>
              <ul className="technology-grid">
                {categoryTechnologies.map((technology) => (
                  <TechnologyTile technology={technology} key={technology.id} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="catalog-empty filtered-empty" role="status">
          <h3>No encontramos coincidencias</h3>
          <p>Prueba otro término o vuelve a mostrar todas las categorías.</p>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              setQuery('');
              setActiveCategory(ALL_CATEGORIES);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}
