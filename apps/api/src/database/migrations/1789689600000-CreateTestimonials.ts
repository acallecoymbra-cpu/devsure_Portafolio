import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTestimonials1789689600000 implements MigrationInterface {
  name = 'CreateTestimonials1789689600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'testimonials',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'author', type: 'varchar', length: '150' },
          { name: 'role', type: 'varchar', length: '150', isNullable: true },
          { name: 'company', type: 'varchar', length: '150', isNullable: true },
          { name: 'quote', type: 'text' },
          { name: 'avatar', type: 'varchar', length: '255', isNullable: true },
          { name: 'source', type: 'varchar', length: '20', isNullable: true },
          { name: 'source_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_testimonials_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'testimonials',
      new TableForeignKey({
        name: 'FK_testimonials_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'testimonials',
      new TableIndex({ name: 'IDX_testimonials_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('testimonials', true);
  }
}
