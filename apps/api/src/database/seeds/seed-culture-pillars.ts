import type { CulturePillarVisual } from '@devsure/contracts';
import type { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { AdminUser } from '../../auth/entities/admin-user.entity';
import { CulturePillar } from '../../culture-pillars/entities/culture-pillar.entity';

export interface CulturePillarSeedRecord {
  title: string;
  keywords: string;
  description: string;
  visual: CulturePillarVisual;
  sortOrder: number;
}

/**
 * The six DevSure values that shipped hardcoded in `culture-content.ts`
 * (`culturePillars`) with the "What we value" showcase — reproduced here
 * once so a fresh database starts with them, and from then on they are
 * edited from `/admin/cultura`.
 */
export const CULTURE_PILLAR_SEED_DATA: readonly CulturePillarSeedRecord[] = [
  {
    title: 'Integridad',
    keywords: 'Coherencia · Responsabilidad',
    description:
      'Hacemos lo correcto, incluso cuando nadie está mirando. Actuamos con coherencia y asumimos la responsabilidad de nuestras decisiones.',
    visual: 'integrity',
    sortOrder: 0,
  },
  {
    title: 'Honestidad',
    keywords: 'Transparencia · Confianza',
    description:
      'Comunicamos las cosas como son. Decimos lo que funciona, lo que no funciona y lo que podemos mejorar. La transparencia construye confianza.',
    visual: 'honesty',
    sortOrder: 1,
  },
  {
    title: 'Respeto',
    keywords: 'Perspectivas · Diversidad',
    description:
      'Valoramos las ideas, experiencias y perspectivas de cada persona. Creemos que las diferencias nos ayudan a encontrar mejores soluciones.',
    visual: 'respect',
    sortOrder: 2,
  },
  {
    title: 'Trabajo en equipo',
    keywords: 'Colaboración · Un solo equipo',
    description:
      'El mejor software no se construye de manera aislada. Developers, QA, líderes y clientes colaboramos y resolvemos como un solo equipo.',
    visual: 'teamwork',
    sortOrder: 3,
  },
  {
    title: 'Humildad',
    keywords: 'Aprendizaje · Feedback',
    description:
      'Sabemos que siempre podemos aprender algo nuevo. Escuchamos, aceptamos feedback y reconocemos que una buena idea viene de cualquiera.',
    visual: 'humility',
    sortOrder: 4,
  },
  {
    title: 'Compromiso',
    keywords: 'Orgullo · Entrega',
    description:
      'Nos hacemos responsables de lo que construimos. No se trata únicamente de entregar, sino de entregar algo de lo que estemos orgullosos.',
    visual: 'commitment',
    sortOrder: 5,
  },
];

export interface CulturePillarSeedResult {
  inserted: number;
  unchanged: number;
  total: number;
}

/** Idempotent by `visual` (each of the six scenes belongs to exactly one seeded pillar). */
export async function seedCulturePillars(
  manager: EntityManager,
  ownerId: string,
): Promise<CulturePillarSeedResult> {
  const result: CulturePillarSeedResult = { inserted: 0, unchanged: 0, total: 0 };

  await manager.transaction(async (transactionManager) => {
    const repository = transactionManager.getRepository(CulturePillar);

    for (const seed of CULTURE_PILLAR_SEED_DATA) {
      const existing = await repository.findOne({ where: { ownerId, visual: seed.visual } });
      if (existing) {
        result.unchanged += 1;
        continue;
      }

      await repository.save(repository.create({ ownerId, ...seed }));
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
    if (!owner) throw new Error('No admin user found to own the seeded culture pillars.');

    const result = await seedCulturePillars(dataSource.manager, owner.id);
    console.info(
      `Culture pillars seed complete: ${result.inserted} inserted, ${result.unchanged} unchanged, ${result.total} total.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Culture pillars seed failed');
    process.exitCode = 1;
  });
}
