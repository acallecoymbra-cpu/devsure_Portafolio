import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateExperiences1789084800000 implements MigrationInterface {
  name = 'CreateExperiences1789084800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'experiences',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'company', type: 'varchar', length: '150' },
          { name: 'slug', type: 'varchar', length: '160', isUnique: true },
          { name: 'logo', type: 'varchar', length: '255', isNullable: true },
          { name: 'summary', type: 'text', isNullable: true },
          { name: 'tech_stack', type: 'text', isNullable: true },
          { name: 'levels', type: 'text' },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_experiences_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'experiences',
      new TableForeignKey({
        name: 'FK_experiences_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'experiences',
      new TableIndex({
        name: 'IDX_experiences_owner',
        columnNames: ['owner_id', 'sort_order', 'company', 'id'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('experiences', true);
  }
}
