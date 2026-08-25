import type { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { Technology } from '../../technologies/entities/technology.entity';
import { TECHNOLOGY_SEED_DATA, type TechnologySeedRecord } from './technology.seed-data';

export interface TechnologySeedResult {
  inserted: number;
  updated: number;
  unchanged: number;
  total: number;
}

export async function seedTechnologies(manager: EntityManager): Promise<TechnologySeedResult> {
  const result: TechnologySeedResult = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    total: 0,
  };

  await manager.transaction(async (transactionManager) => {
    const repository = transactionManager.getRepository(Technology);

    for (const seed of TECHNOLOGY_SEED_DATA) {
      const existing = await repository.findOne({ where: { slug: seed.slug } });

      if (existing === null) {
        await repository.save(repository.create(seed));
        result.inserted += 1;
        continue;
      }

      if (matchesSeed(existing, seed)) {
        result.unchanged += 1;
        continue;
      }

      await repository.update(existing.id, seedValues(seed));
      result.updated += 1;
    }

    result.total = await repository.count();
  });

  return result;
}

function matchesSeed(technology: Technology, seed: TechnologySeedRecord): boolean {
  return (
    technology.name === seed.name &&
    technology.category === seed.category &&
    technology.summary === seed.summary &&
    technology.iconKey === seed.iconKey &&
    technology.featured === seed.featured &&
    technology.sortOrder === seed.sortOrder &&
    technology.publicationStatus === seed.publicationStatus &&
    technology.publishedAt?.toISOString() === seed.publishedAt.toISOString()
  );
}

function seedValues(seed: TechnologySeedRecord): Omit<TechnologySeedRecord, 'id'> {
  return {
    name: seed.name,
    slug: seed.slug,
    category: seed.category,
    summary: seed.summary,
    iconKey: seed.iconKey,
    featured: seed.featured,
    sortOrder: seed.sortOrder,
    publicationStatus: seed.publicationStatus,
    publishedAt: seed.publishedAt,
  };
}

async function run(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.runMigrations();
    const result = await seedTechnologies(dataSource.manager);
    console.info(
      `Technology seed complete: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged, ${result.total} total.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Technology seed failed');
    process.exitCode = 1;
  });
}
