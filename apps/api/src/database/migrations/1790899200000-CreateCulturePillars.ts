import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCulturePillars1790899200000 implements MigrationInterface {
  name = 'CreateCulturePillars1790899200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'culture_pillars',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'title', type: 'varchar', length: '100' },
          { name: 'keywords', type: 'varchar', length: '150', default: "''" },
          { name: 'description', type: 'varchar', length: '600' },
          { name: 'visual', type: 'varchar', length: '20' },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_culture_pillars_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'culture_pillars',
      new TableForeignKey({
        name: 'FK_culture_pillars_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'culture_pillars',
      new TableIndex({ name: 'IDX_culture_pillars_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('culture_pillars', true);
  }
}
