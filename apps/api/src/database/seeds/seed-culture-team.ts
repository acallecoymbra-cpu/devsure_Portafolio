import type { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { AdminUser } from '../../auth/entities/admin-user.entity';
import { CultureTeamMember } from '../../culture-team/entities/culture-team-member.entity';

export interface CultureTeamMemberSeedRecord {
  name: string;
  role: string;
  neutralImage: string;
  smilingImage: string;
  sortOrder: number;
}

/**
 * The original hardcoded `teamMembers` placeholder roster
 * (culture-content.ts, before this migration moved this content to
 * `/admin/cultura`'s team manager) — reproduced here once, so a fresh
 * database gets the same 11 seats instead of starting empty. Same
 * "reuse an existing site photo per person" criterion the original array
 * documented, until real portraits are uploaded through the admin.
 */
export const CULTURE_TEAM_SEED_DATA: readonly CultureTeamMemberSeedRecord[] = [
  { name: 'Persona 01', role: 'Dirección general', neutralImage: '/photos/professional-office.webp', smilingImage: '/photos/professional-office.webp', sortOrder: 0 },
  { name: 'Persona 02', role: 'Tecnología', neutralImage: '/photos/tech-world.webp', smilingImage: '/photos/tech-world.webp', sortOrder: 1 },
  { name: 'Persona 03', role: 'Aseguramiento de calidad', neutralImage: '/photos/certifications.webp', smilingImage: '/photos/certifications.webp', sortOrder: 2 },
  { name: 'Persona 04', role: 'Automatización', neutralImage: '/photos/night-code.webp', smilingImage: '/photos/night-code.webp', sortOrder: 3 },
  { name: 'Persona 05', role: 'DevOps', neutralImage: '/photos/conference-room.webp', smilingImage: '/photos/conference-room.webp', sortOrder: 4 },
  { name: 'Persona 06', role: 'Frontend', neutralImage: '/photos/professional-tablet.webp', smilingImage: '/photos/professional-tablet.webp', sortOrder: 5 },
  { name: 'Persona 07', role: 'Backend', neutralImage: '/photos/office-window.webp', smilingImage: '/photos/office-window.webp', sortOrder: 6 },
  { name: 'Persona 08', role: 'Producto', neutralImage: '/photos/faq-support.webp', smilingImage: '/photos/faq-support.webp', sortOrder: 7 },
  { name: 'Persona 09', role: 'UX / UI', neutralImage: '/photos/portrait-focused.webp', smilingImage: '/photos/portrait-focused.webp', sortOrder: 8 },
  { name: 'Persona 10', role: 'Operaciones', neutralImage: '/photos/trajectory.webp', smilingImage: '/photos/trajectory.webp', sortOrder: 9 },
  { name: 'Persona 11', role: 'Negocio', neutralImage: '/photos/testimonials.webp', smilingImage: '/photos/testimonials.webp', sortOrder: 10 },
];

export interface CultureTeamSeedResult {
  inserted: number;
  unchanged: number;
  total: number;
}

/** Idempotent by `name`, the closest thing this placeholder content has to a stable natural key. */
export async function seedCultureTeam(
  manager: EntityManager,
  ownerId: string,
): Promise<CultureTeamSeedResult> {
  const result: CultureTeamSeedResult = { inserted: 0, unchanged: 0, total: 0 };

  await manager.transaction(async (transactionManager) => {
    const repository = transactionManager.getRepository(CultureTeamMember);

    for (const seed of CULTURE_TEAM_SEED_DATA) {
      const existing = await repository.findOne({ where: { ownerId, name: seed.name } });
      if (existing) {
        result.unchanged += 1;
        continue;
      }

      await repository.save(
        repository.create({
          ownerId,
          name: seed.name,
          role: seed.role,
          neutralImage: seed.neutralImage,
          smilingImage: seed.smilingImage,
          alt: null,
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
    if (!owner) throw new Error('No admin user found to own the seeded culture team.');

    const result = await seedCultureTeam(dataSource.manager, owner.id);
    console.info(
      `Culture team seed complete: ${result.inserted} inserted, ${result.unchanged} unchanged, ${result.total} total.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Culture team seed failed');
    process.exitCode = 1;
  });
}
