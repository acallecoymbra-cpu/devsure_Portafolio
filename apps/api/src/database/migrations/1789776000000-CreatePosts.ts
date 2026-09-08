import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePosts1789776000000 implements MigrationInterface {
  name = 'CreatePosts1789776000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'title', type: 'text' },
          { name: 'slug', type: 'varchar', length: '160', isUnique: true },
          { name: 'excerpt', type: 'text', isNullable: true },
          { name: 'content', type: 'text' },
          { name: 'category', type: 'varchar', length: '30', isNullable: true },
          { name: 'cover_image', type: 'varchar', length: '255', isNullable: true },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'published_at', type: 'datetime', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_posts_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'posts',
      new TableForeignKey({
        name: 'FK_posts_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'posts',
      new TableIndex({ name: 'IDX_posts_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('posts', true);
  }
}
