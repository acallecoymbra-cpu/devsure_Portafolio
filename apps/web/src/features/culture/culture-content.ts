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
  {
    id: 'sustain',
    kicker: '04 · Sostener',
    title: 'Construimos para que dure',
    description:
      'Documentamos decisiones y dejamos el sistema listo para que otra persona pueda continuarlo sin perder contexto.',
    image: {
      src: '/photos/tech-world.webp',
      alt: 'Fotografía editorial de un espacio de trabajo tecnológico.',
      width: 1600,
      height: 800,
    },
  },
  {
    id: 'communicate',
    kicker: '05 · Comunicar',
    title: 'Avisamos antes de que sea un problema',
    description:
      'Compartimos avances, riesgos y decisiones a tiempo, para que nunca haya sorpresas de último momento.',
    image: {
      src: '/photos/conference-room.webp',
      alt: 'Fotografía editorial de una sala de reuniones donde el equipo conversa sobre un proyecto.',
      width: 1600,
      height: 900,
    },
  },
  {
    id: 'focus',
    kicker: '06 · Enfocar',
    title: 'El detalle también es el producto',
    description:
      'Cuidamos cada decisión pequeña porque sabemos que, sumadas, son las que definen la experiencia final.',
    image: {
      src: '/photos/portrait-focused.webp',
      alt: 'Retrato editorial de una persona del equipo concentrada en su trabajo.',
      width: 1600,
      height: 900,
    },
  },
  {
    id: 'follow-through',
    kicker: '07 · Acompañar',
    title: 'Seguimos después de la entrega',
    description:
      'Medimos resultados reales y ajustamos el rumbo junto al equipo del cliente, no solo en el lanzamiento.',
    image: {
      src: '/photos/trajectory.webp',
      alt: 'Fotografía editorial de una trayectoria de crecimiento profesional.',
      width: 1600,
      height: 900,
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

/**
 * Placeholder roster (11 seats, matching the team's current size) — swap
 * each `neutralImage`/`smilingImage` pair for real portraits (same person,
 * serious vs. smiling, same framing/aspect ratio) whenever they're ready.
 * Reusing one existing site photo per person for both fields for now, so
 * the reveal still shows a real grayscale→color transition instead of a
 * broken image.
 */
export const teamMembers: readonly TeamMember[] = [
  { id: '01', name: 'Persona 01', role: 'Dirección general', neutralImage: '/photos/professional-office.webp', smilingImage: '/photos/professional-office.webp' },
  { id: '02', name: 'Persona 02', role: 'Tecnología', neutralImage: '/photos/tech-world.webp', smilingImage: '/photos/tech-world.webp' },
  { id: '03', name: 'Persona 03', role: 'Aseguramiento de calidad', neutralImage: '/photos/certifications.webp', smilingImage: '/photos/certifications.webp' },
  { id: '04', name: 'Persona 04', role: 'Automatización', neutralImage: '/photos/night-code.webp', smilingImage: '/photos/night-code.webp' },
  { id: '05', name: 'Persona 05', role: 'DevOps', neutralImage: '/photos/conference-room.webp', smilingImage: '/photos/conference-room.webp' },
  { id: '06', name: 'Persona 06', role: 'Frontend', neutralImage: '/photos/professional-tablet.webp', smilingImage: '/photos/professional-tablet.webp' },
  { id: '07', name: 'Persona 07', role: 'Backend', neutralImage: '/photos/office-window.webp', smilingImage: '/photos/office-window.webp' },
  { id: '08', name: 'Persona 08', role: 'Producto', neutralImage: '/photos/faq-support.webp', smilingImage: '/photos/faq-support.webp' },
  { id: '09', name: 'Persona 09', role: 'UX / UI', neutralImage: '/photos/portrait-focused.webp', smilingImage: '/photos/portrait-focused.webp' },
  { id: '10', name: 'Persona 10', role: 'Operaciones', neutralImage: '/photos/trajectory.webp', smilingImage: '/photos/trajectory.webp' },
  { id: '11', name: 'Persona 11', role: 'Negocio', neutralImage: '/photos/testimonials.webp', smilingImage: '/photos/testimonials.webp' },
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
