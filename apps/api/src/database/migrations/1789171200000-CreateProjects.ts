import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProjects1789171200000 implements MigrationInterface {
  name = 'CreateProjects1789171200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'experience_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'title', type: 'text' },
          { name: 'slug', type: 'varchar', length: '160', isUnique: true },
          { name: 'excerpt', type: 'text', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'cover_image', type: 'varchar', length: '255', isNullable: true },
          { name: 'gallery', type: 'text', isNullable: true },
          { name: 'tech_stack', type: 'text', isNullable: true },
          { name: 'apps', type: 'text', isNullable: true },
          { name: 'url', type: 'varchar', length: '500', isNullable: true },
          { name: 'repo_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'featured', type: 'boolean', default: false },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'published_at', type: 'datetime', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_projects_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        name: 'FK_projects_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        name: 'FK_projects_experience',
        columnNames: ['experience_id'],
        referencedTableName: 'experiences',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createIndex(
      'projects',
      new TableIndex({ name: 'IDX_projects_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('projects', true);
  }
}
