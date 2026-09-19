import type { CulturePillarVisual } from '@devsure/contracts';

export type CultureStory = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export type CompanyStory = {
  id: string;
  name: string;
  detail: string;
  location: string;
  logo: {
    src: string;
    width: number;
    height: number;
  };
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  /** Neutral/serious portrait — rendered in grayscale until revealed. */
  neutralImage: string;
  /** Smiling portrait — revealed in color on hover/tap. Same aspect ratio as `neutralImage`. */
  smilingImage: string;
  alt?: string;
};

export const companyStories: readonly CompanyStory[] = [
  {
    id: 'akkikb',
    name: 'AKKIKB',
    detail: 'Presencia digital construida alrededor de una necesidad real de negocio.',
    location: 'México',
    logo: {
      src: '/case-studies/akkikb.jpg',
      width: 800,
      height: 315,
    },
  },
];

/**
 * View-model for one pillar of the "What we value" showcase. The rows
 * themselves are admin-managed (`/admin/cultura`, `CulturePillar` in
 * @devsure/contracts) — the seed script holds the original six.
 */
export type CulturePillar = {
  id: string;
  number: string;
  title: string;
  /** Short keyword line shown under the title in the list. */
  keywords: string;
  description: string;
  visual: CulturePillarVisual;
};
