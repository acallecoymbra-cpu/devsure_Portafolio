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

export const culturePrinciples = [
  {
    number: '01',
    title: 'Claridad desde el inicio',
    description: 'Nombramos objetivos, riesgos y decisiones para que el trabajo conserve contexto.',
  },
  {
    number: '02',
    title: 'Responsabilidad compartida',
    description: 'Cada persona aporta criterio, pregunta a tiempo y cuida el resultado completo.',
  },
  {
    number: '03',
    title: 'Mejora con evidencia',
    description: 'Aprendemos de pruebas, resultados y conversaciones, no de suposiciones.',
  },
] as const;
