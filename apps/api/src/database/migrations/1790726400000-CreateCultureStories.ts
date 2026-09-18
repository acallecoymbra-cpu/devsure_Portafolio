import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCultureStories1790726400000 implements MigrationInterface {
  name = 'CreateCultureStories1790726400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'culture_stories',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'kicker', type: 'text' },
          { name: 'title', type: 'text' },
          { name: 'description', type: 'text' },
          { name: 'image_src', type: 'varchar', length: '500' },
          { name: 'image_alt', type: 'varchar', length: '300' },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_culture_stories_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'culture_stories',
      new TableForeignKey({
        name: 'FK_culture_stories_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'culture_stories',
      new TableIndex({ name: 'IDX_culture_stories_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('culture_stories', true);
  }
}
