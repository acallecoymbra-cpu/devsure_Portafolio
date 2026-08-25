import { getTechnologyIcon } from '@/features/technologies/icon-registry';

export function TechnologyIcon({ iconKey, slug }: { iconKey: string; slug?: string }) {
  return (
    <span className="technology-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        focusable="false"
      >
        {getTechnologyIcon(iconKey, slug)}
      </svg>
    </span>
  );
}
