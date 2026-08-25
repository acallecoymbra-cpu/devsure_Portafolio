import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTechnologies1787616000000 implements MigrationInterface {
  name = 'CreateTechnologies1787616000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'technologies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'summary',
            type: 'varchar',
            length: '300',
            isNullable: true,
          },
          {
            name: 'icon_key',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'featured',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'publication_status',
            type: 'varchar',
            length: '16',
            default: "'draft'",
          },
          {
            name: 'published_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            name: 'UQ_technologies_slug',
            columnNames: ['slug'],
          },
        ],
        checks: [
          {
            name: 'CHK_technologies_slug_lowercase',
            expression: '"slug" = LOWER("slug")',
          },
          {
            name: 'CHK_technologies_publication_status',
            expression: "\"publication_status\" IN ('draft', 'published')",
          },
          {
            name: 'CHK_technologies_sort_order',
            expression: '"sort_order" >= 0',
          },
          {
            name: 'CHK_technologies_published_at',
            expression: '"publication_status" <> \'published\' OR "published_at" IS NOT NULL',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('technologies', [
      new TableIndex({
        name: 'IDX_technologies_public_order',
        columnNames: ['publication_status', 'sort_order', 'name', 'id'],
      }),
      new TableIndex({
        name: 'IDX_technologies_public_featured',
        columnNames: ['publication_status', 'featured'],
      }),
      new TableIndex({
        name: 'IDX_technologies_public_category',
        columnNames: ['publication_status', 'category'],
      }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('technologies', true);
  }
}
