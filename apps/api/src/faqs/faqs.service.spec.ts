import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateFaqs1789603200000 } from '../database/migrations/1789603200000-CreateFaqs';
import { Faq } from './entities/faq.entity';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/faq.dto';

describe('FaqsService', () => {
  let dataSource: DataSource;
  let service: FaqsService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Faq],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateFaqs1789603200000,
      ],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    ownerId = (
      await seedAdmin(dataSource.manager, { username: 'eduardo', email: 'eduardo@example.com', password: 'correct-horse-battery' })
    ).id;
    otherOwnerId = (
      await seedAdmin(dataSource.manager, { username: 'other', email: 'other@example.com', password: 'correct-horse-battery' })
    ).id;

    service = new FaqsService(dataSource.getRepository(Faq));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateFaqDto> = {}): CreateFaqDto {
    return Object.assign(new CreateFaqDto(), {
      question: { en: 'Do you work remotely?' },
      answer: { en: 'Yes, fully remote.' },
      ...overrides,
    });
  }

  it('creates a faq with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ question: { en: 'Do you work remotely?' }, sortOrder: 0 });
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ question: { en: 'Not mine' } }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { sortOrder: 4 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ sortOrder: 1 }));
    const updated = await service.update(ownerId, created.id, { answer: { en: 'Updated answer.' } });

    expect(updated.answer).toEqual({ en: 'Updated answer.' });
    expect(updated.sortOrder).toBe(1);
    expect(updated.question).toEqual({ en: 'Do you work remotely?' });
  });

  it('deletes a faq for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
