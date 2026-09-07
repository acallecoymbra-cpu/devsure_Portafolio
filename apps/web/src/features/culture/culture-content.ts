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

export const cultureStories: readonly CultureStory[] = [
  {
    id: 'listen',
    kicker: '01 · Entender',
    title: 'Escuchamos antes de construir',
    description:
      'Entender el contexto, las personas y el objetivo nos permite tomar decisiones proporcionales al problema.',
    image: {
      src: '/culture/collaboration.png',
      alt: 'Ilustración editorial de tres personas conversando alrededor de una mesa de trabajo.',
      width: 1672,
      height: 941,
    },
  },
  {
    id: 'quality',
    kicker: '02 · Verificar',
    title: 'La calidad se demuestra',
    description:
      'Probamos lo importante, revisamos con intención y dejamos una base clara para mantener y mejorar cada producto.',
    image: {
      src: '/culture/quality.png',
      alt: 'Ilustración editorial de dos personas revisando la calidad de un sistema digital.',
      width: 1672,
      height: 941,
    },
  },
  {
    id: 'evolve',
    kicker: '03 · Evolucionar',
    title: 'Crecemos con cada entrega',
    description:
      'Compartimos la responsabilidad, aprendemos del resultado y convertimos ese aprendizaje en una mejor siguiente decisión.',
    image: {
      src: '/culture/growth.png',
      alt: 'Ilustración editorial de un equipo avanzando junto a una estructura modular en crecimiento.',
      width: 1672,
      height: 941,
    },
  },
];

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
