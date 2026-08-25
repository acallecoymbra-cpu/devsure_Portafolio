import type { TechnologyCard } from '@devsure/contracts';
import { TechnologyImage } from './technology-image';

export function TechnologyTile({ technology }: { technology: TechnologyCard }) {
  return (
    <li
      className="technology-tile"
      data-testid="technology-card"
      data-technology-id={technology.id}
    >
      <TechnologyImage technology={technology} />
      <span>{technology.name}</span>
    </li>
  );
}
