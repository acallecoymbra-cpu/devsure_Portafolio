import { DataSource } from 'typeorm';
import { AdminUser } from '../../../auth/entities/admin-user.entity';
import { AdminSession } from '../../../auth/entities/admin-session.entity';
import { Testimonial } from '../../../testimonials/entities/testimonial.entity';
import { seedAdmin } from '../../seeds/seed-admin';
import { CreateAdminAuth1788480000000 } from '../1788480000000-CreateAdminAuth';
import { RequireAdminPasswordChange1788739200000 } from '../1788739200000-RequireAdminPasswordChange';
import { AddAdminUsername1788825600000 } from '../1788825600000-AddAdminUsername';
import { CreateTestimonials1789689600000 } from '../1789689600000-CreateTestimonials';
import { AddTestimonialHighlights1790121600000 } from '../1790121600000-AddTestimonialHighlights';

describe('testimonial highlights migration', () => {
  let dataSource: DataSource;

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
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('adds and removes the highlight columns up/down/up', async () => {
    await dataSource.runMigrations();
    const columns = async () =>
      (await dataSource.createQueryRunner().getTable('testimonials'))?.columns.map((c) => c.name) ?? [];

    expect(await columns()).toEqual(expect.arrayContaining(['rating', 'highlight_text', 'highlight_icon']));

    await dataSource.undoLastMigration();
    expect(await columns()).not.toEqual(expect.arrayContaining(['rating', 'highlight_text', 'highlight_icon']));

    await dataSource.runMigrations();
    expect(await columns()).toEqual(expect.arrayContaining(['rating', 'highlight_text', 'highlight_icon']));
  });

  it('persists and reloads the rating and highlight badge through the Testimonial entity', async () => {
    await dataSource.runMigrations();
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    const testimonials = dataSource.getRepository(Testimonial);
    const saved = await testimonials.save(
      testimonials.create({
        ownerId,
        author: 'Jane Doe',
        quote: 'Great work.',
        rating: 4.8,
        highlightText: 'Proyecto completado con éxito',
        highlightIcon: 'delivery',
      }),
    );

    const reloaded = await testimonials.findOneByOrFail({ id: saved.id });
    expect(reloaded.rating).toBe(4.8);
    expect(reloaded.highlightText).toBe('Proyecto completado con éxito');
    expect(reloaded.highlightIcon).toBe('delivery');
  });

  it('defaults rating to 5 for rows created before this migration', async () => {
    await dataSource.runMigrations();
    const { id: ownerId } = await seedAdmin(dataSource.manager, {
      username: 'eduardo',
      email: 'eduardo@example.com',
      password: 'correct-horse-battery',
    });

    await dataSource.query(
      'INSERT INTO testimonials (id, owner_id, author, quote, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['legacy-1', ownerId, 'Legacy Author', 'Legacy quote.', 0, new Date().toISOString(), new Date().toISOString()],
    );

    const reloaded = await dataSource.getRepository(Testimonial).findOneByOrFail({ id: 'legacy-1' });
    expect(reloaded.rating).toBe(5);
  });
});
