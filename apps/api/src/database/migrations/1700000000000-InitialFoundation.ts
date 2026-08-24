import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialFoundation1700000000000 implements MigrationInterface {
  name = 'InitialFoundation1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'app_metadata',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'key',
            type: 'varchar',
            isUnique: true
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: "(datetime('now'))"
          }
        ]
      }),
      true
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('app_metadata', true);
  }
}
