import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateFaqs1789603200000 implements MigrationInterface {
  name = 'CreateFaqs1789603200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'faqs',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'question', type: 'text' },
          { name: 'answer', type: 'text' },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_faqs_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'faqs',
      new TableForeignKey({
        name: 'FK_faqs_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'faqs',
      new TableIndex({ name: 'IDX_faqs_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('faqs', true);
  }
}
