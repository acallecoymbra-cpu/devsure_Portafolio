import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const requireFromApi = createRequire(new URL('../../api/package.json', import.meta.url));
const BetterSqlite3 = requireFromApi('better-sqlite3');
const databasePath = fileURLToPath(new URL('../../api/.data/playwright.sqlite', import.meta.url));
const database = new BetterSqlite3(databasePath);
const action = process.argv[2];

try {
  switch (action) {
    case 'insert-extra':
      insertExtraTechnologies();
      break;
    case 'delete-extra':
      database.prepare("DELETE FROM technologies WHERE slug LIKE 'qa-fixture-%'").run();
      break;
    case 'draft-all':
      database.prepare("UPDATE technologies SET publication_status = 'draft'").run();
      break;
    case 'publish-all':
      database.prepare("UPDATE technologies SET publication_status = 'published'").run();
      break;
    case 'unknown-icon':
      database
        .prepare(
          "UPDATE technologies SET slug = 'qa-unknown-image', icon_key = 'unknown-key' WHERE id = '00000000-0000-4000-8000-000000000041'",
        )
        .run();
      break;
    case 'restore-icon':
      database
        .prepare(
          "UPDATE technologies SET slug = 'postman', icon_key = 'collaboration' WHERE id = '00000000-0000-4000-8000-000000000041'",
        )
        .run();
      break;
    case 'hide-table':
      database.exec('ALTER TABLE technologies RENAME TO technologies_unavailable');
      break;
    case 'restore-table':
      database.exec('ALTER TABLE technologies_unavailable RENAME TO technologies');
      break;
    default:
      throw new Error(`Unknown technology database fixture: ${action ?? '<missing>'}`);
  }
} finally {
  database.close();
}

function insertExtraTechnologies() {
  const insert = database.prepare(`
    INSERT INTO technologies (
      id, name, slug, category, summary, icon_key, featured, sort_order,
      publication_status, published_at
    ) VALUES (?, ?, ?, ?, NULL, ?, 0, ?, 'published', ?)
  `);
  const transaction = database.transaction(() => {
    for (let index = 1; index <= 12; index += 1) {
      const suffix = index.toString().padStart(2, '0');
      insert.run(
        `20000000-0000-4000-8000-${index.toString().padStart(12, '0')}`,
        `QA Fixture ${suffix}`,
        `qa-fixture-${suffix}`,
        'metodologias-herramientas',
        'collaboration',
        100 + index,
        '2026-08-25T00:00:00.000Z',
      );
    }
  });

  transaction();
}
