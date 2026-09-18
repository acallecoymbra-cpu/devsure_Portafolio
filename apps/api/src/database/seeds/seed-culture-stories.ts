import type { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { AdminUser } from '../../auth/entities/admin-user.entity';
import { CultureStory } from '../../culture-stories/entities/culture-story.entity';

export interface CultureStorySeedRecord {
  kicker: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  sortOrder: number;
}

/**
 * The original hardcoded `cultureStories` array (culture-content.ts, before
 * Slice 14 of PLAN-CULTURA-SPINE-3D.md moved this content to
 * `/admin/culture-stories`) — reproduced here once, only so a fresh
 * database gets the same 7 stations the column always had, instead of
 * starting empty. Single-locale (`es`) on purpose: that's all this content
 * ever had before the migration.
 */
export const CULTURE_STORY_SEED_DATA: readonly CultureStorySeedRecord[] = [
  {
    kicker: '01 · Entender',
    title: 'Escuchamos antes de construir',
    description:
      'Entender el contexto, las personas y el objetivo nos permite tomar decisiones proporcionales al problema.',
    imageSrc: '/culture/collaboration.png',
    imageAlt: 'Ilustración editorial de tres personas conversando alrededor de una mesa de trabajo.',
    sortOrder: 0,
  },
  {
    kicker: '02 · Verificar',
    title: 'La calidad se demuestra',
    description:
      'Probamos lo importante, revisamos con intención y dejamos una base clara para mantener y mejorar cada producto.',
    imageSrc: '/culture/quality.png',
    imageAlt: 'Ilustración editorial de dos personas revisando la calidad de un sistema digital.',
    sortOrder: 1,
  },
  {
    kicker: '03 · Evolucionar',
    title: 'Crecemos con cada entrega',
    description:
      'Compartimos la responsabilidad, aprendemos del resultado y convertimos ese aprendizaje en una mejor siguiente decisión.',
    imageSrc: '/culture/growth.png',
    imageAlt: 'Ilustración editorial de un equipo avanzando junto a una estructura modular en crecimiento.',
    sortOrder: 2,
  },
  {
    kicker: '04 · Sostener',
    title: 'Construimos para que dure',
    description:
      'Documentamos decisiones y dejamos el sistema listo para que otra persona pueda continuarlo sin perder contexto.',
    imageSrc: '/photos/tech-world.webp',
    imageAlt: 'Fotografía editorial de un espacio de trabajo tecnológico.',
    sortOrder: 3,
  },
  {
    kicker: '05 · Comunicar',
    title: 'Avisamos antes de que sea un problema',
    description: 'Compartimos avances, riesgos y decisiones a tiempo, para que nunca haya sorpresas de último momento.',
    imageSrc: '/photos/conference-room.webp',
    imageAlt: 'Fotografía editorial de una sala de reuniones donde el equipo conversa sobre un proyecto.',
    sortOrder: 4,
  },
  {
    kicker: '06 · Enfocar',
    title: 'El detalle también es el producto',
    description:
      'Cuidamos cada decisión pequeña porque sabemos que, sumadas, son las que definen la experiencia final.',
    imageSrc: '/photos/portrait-focused.webp',
    imageAlt: 'Retrato editorial de una persona del equipo concentrada en su trabajo.',
    sortOrder: 5,
  },
  {
    kicker: '07 · Acompañar',
    title: 'Seguimos después de la entrega',
    description:
      'Medimos resultados reales y ajustamos el rumbo junto al equipo del cliente, no solo en el lanzamiento.',
    imageSrc: '/photos/trajectory.webp',
    imageAlt: 'Fotografía editorial de una trayectoria de crecimiento profesional.',
    sortOrder: 6,
  },
];

export interface CultureStorySeedResult {
  inserted: number;
  unchanged: number;
  total: number;
}

/** Idempotent by `imageSrc`, the closest thing this content has to a stable natural key. */
export async function seedCultureStories(
  manager: EntityManager,
  ownerId: string,
): Promise<CultureStorySeedResult> {
  const result: CultureStorySeedResult = { inserted: 0, unchanged: 0, total: 0 };

  await manager.transaction(async (transactionManager) => {
    const repository = transactionManager.getRepository(CultureStory);

    for (const seed of CULTURE_STORY_SEED_DATA) {
      const existing = await repository.findOne({ where: { ownerId, imageSrc: seed.imageSrc } });
      if (existing) {
        result.unchanged += 1;
        continue;
      }

      await repository.save(
        repository.create({
          ownerId,
          kicker: { es: seed.kicker },
          title: { es: seed.title },
          description: { es: seed.description },
          imageSrc: seed.imageSrc,
          imageAlt: seed.imageAlt,
          sortOrder: seed.sortOrder,
        }),
      );
      result.inserted += 1;
    }

    result.total = await repository.count({ where: { ownerId } });
  });

  return result;
}

async function run(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.runMigrations();
    const [owner] = await dataSource.manager.getRepository(AdminUser).find({ order: { createdAt: 'ASC' }, take: 1 });
    if (!owner) throw new Error('No admin user found to own the seeded culture stories.');

    const result = await seedCultureStories(dataSource.manager, owner.id);
    console.info(
      `Culture stories seed complete: ${result.inserted} inserted, ${result.unchanged} unchanged, ${result.total} total.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Culture stories seed failed');
    process.exitCode = 1;
  });
}
