'use client';

import type { TechnologyCard } from '@devsure/contracts';
import { useState } from 'react';
import { TechnologyImage } from './technology-image';

export function TechnologyTile({ technology }: { technology: TechnologyCard }) {
  const summary = technology.summary?.trim();

  if (!summary) {
    return (
      <li className="technology-tile" data-testid="technology-card" data-technology-id={technology.id}>
        <TechnologyImage technology={technology} />
        <span>{technology.name}</span>
      </li>
    );
  }

  return <FlippableTechnologyTile technology={technology} summary={summary} />;
}

/** Click the image to flip the tile and reveal `Technology.summary` (the "Resumen" field from `/admin/technologies`). Tiles without a summary stay static — nothing to show on the back. */
function FlippableTechnologyTile({ technology, summary }: { technology: TechnologyCard; summary: string }) {
  const [flipped, setFlipped] = useState(false);
  const summaryId = `technology-summary-${technology.id}`;

  return (
    <li
      className="technology-tile technology-tile-flip"
      data-testid="technology-card"
      data-technology-id={technology.id}
    >
      <button
        type="button"
        className="technology-flip-card"
        data-flipped={flipped}
        aria-pressed={flipped}
        aria-describedby={summaryId}
        aria-label={flipped ? `Ocultar resumen de ${technology.name}` : `Ver resumen de ${technology.name}`}
        onClick={() => setFlipped((current) => !current)}
      >
        <span className="technology-flip-face technology-flip-front">
          <TechnologyImage technology={technology} />
          <span>{technology.name}</span>
        </span>
        <span className="technology-flip-face technology-flip-back">
          <span className="technology-flip-back-name">{technology.name}</span>
          <p id={summaryId}>{summary}</p>
        </span>
      </button>
    </li>
  );
}
