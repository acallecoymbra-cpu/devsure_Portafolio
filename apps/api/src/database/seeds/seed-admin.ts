import 'dotenv/config';
import * as argon2 from 'argon2';
import type { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { AdminUser } from '../../auth/entities/admin-user.entity';

export interface AdminSeedInput {
  username: string;
  email: string;
  password: string;
}

export interface AdminSeedResult {
  action: 'created' | 'updated';
  id: string;
}

export async function seedAdmin(manager: EntityManager, input: AdminSeedInput): Promise<AdminSeedResult> {
  if (input.password.length < 12) {
    throw new Error('Admin password must be at least 12 characters long.');
  }

  const repository = manager.getRepository(AdminUser);
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
  const existing = await repository.findOne({ where: { username: input.username } });

  if (existing) {
    await repository.update(existing.id, { email: input.email, passwordHash });
    return { action: 'updated', id: existing.id };
  }

  const created = await repository.save(
    repository.create({
      username: input.username,
      email: input.email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: true,
    }),
  );
  return { action: 'created', id: created.id };
}

async function run(): Promise<void> {
  const username = process.env.ADMIN_SEED_USERNAME;
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!username || !email || !password) {
    throw new Error(
      'ADMIN_SEED_USERNAME, ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set to seed the admin user.',
    );
  }

  await dataSource.initialize();

  try {
    await dataSource.runMigrations();
    const result = await seedAdmin(dataSource.manager, { username, email, password });
    console.info(`Admin seed complete: ${result.action} user "${username}" (${result.id}).`);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Admin seed failed');
    process.exitCode = 1;
  });
}
