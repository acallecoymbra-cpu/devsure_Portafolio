import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { AdminSession } from '../auth/entities/admin-session.entity';
import { seedAdmin } from '../database/seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../database/migrations/1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../database/migrations/1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../database/migrations/1788825600000-AddAdminUsername';
import { CreateTestimonials1789689600000 } from '../database/migrations/1789689600000-CreateTestimonials';
import { AddTestimonialHighlights1790121600000 } from '../database/migrations/1790121600000-AddTestimonialHighlights';
import { Testimonial } from './entities/testimonial.entity';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/testimonial.dto';

describe('TestimonialsService', () => {
  let dataSource: DataSource;
  let service: TestimonialsService;
  let ownerId: string;
  let otherOwnerId: string;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      synchronize: false,
      entities: [AdminUser, AdminSession, Testimonial],
      migrations: [
        CreateAdminAuth1788480000000,
        RequireAdminPasswordChange1788739200000,
        AddAdminUsername1788825600000,
        CreateTestimonials1789689600000,
        AddTestimonialHighlights1790121600000,
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

    service = new TestimonialsService(dataSource.getRepository(Testimonial));
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  function minimalInput(overrides: Partial<CreateTestimonialDto> = {}): CreateTestimonialDto {
    return Object.assign(new CreateTestimonialDto(), { author: 'Jane Doe', quote: 'Great work.', ...overrides });
  }

  it('creates a testimonial with the owner injected and defaults applied', async () => {
    const created = await service.create(ownerId, minimalInput());
    expect(created).toMatchObject({ author: 'Jane Doe', quote: 'Great work.', sortOrder: 0, rating: 5 });
    expect(created).not.toHaveProperty('role');
    expect(created).not.toHaveProperty('company');
    expect(created).not.toHaveProperty('avatar');
    expect(created).not.toHaveProperty('highlightText');
    expect(created).not.toHaveProperty('highlightIcon');
    expect(created).not.toHaveProperty('source');
    expect(created).not.toHaveProperty('sourceUrl');
  });

  it('creates a testimonial with all optional fields', async () => {
    const created = await service.create(
      ownerId,
      minimalInput({
        role: 'CTO',
        company: 'Acme Inc.',
        avatar: 'testimonials/jane.png',
        rating: 4.8,
        highlightText: 'Proyecto completado con éxito',
        highlightIcon: 'delivery',
        source: 'linkedin',
        sourceUrl: 'https://linkedin.com/in/jane',
        sortOrder: 3,
      }),
    );
    expect(created).toMatchObject({
      role: 'CTO',
      company: 'Acme Inc.',
      avatar: 'testimonials/jane.png',
      rating: 4.8,
      highlightText: 'Proyecto completado con éxito',
      highlightIcon: 'delivery',
      source: 'linkedin',
      sourceUrl: 'https://linkedin.com/in/jane',
      sortOrder: 3,
    });
  });

  it('scopes list/get/update/delete to the owner', async () => {
    const mine = await service.create(ownerId, minimalInput());
    await service.create(otherOwnerId, minimalInput({ author: 'Theirs' }));

    const list = await service.list(ownerId, { page: 1, limit: 50 });
    expect(list.meta.total).toBe(1);

    await expect(service.get(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(otherOwnerId, mine.id, { author: 'Hijacked' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(otherOwnerId, mine.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the provided fields', async () => {
    const created = await service.create(ownerId, minimalInput({ role: 'Engineer' }));
    const updated = await service.update(ownerId, created.id, { sortOrder: 7 });

    expect(updated.sortOrder).toBe(7);
    expect(updated.author).toBe('Jane Doe');
    expect(updated.role).toBe('Engineer');
  });

  it('deletes a testimonial for its owner', async () => {
    const created = await service.create(ownerId, minimalInput());
    await service.remove(ownerId, created.id);
    await expect(service.get(ownerId, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
