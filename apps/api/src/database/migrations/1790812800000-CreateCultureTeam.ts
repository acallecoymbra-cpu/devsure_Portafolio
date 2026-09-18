import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCultureTeam1790812800000 implements MigrationInterface {
  name = 'CreateCultureTeam1790812800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'culture_team_members',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36' },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'role', type: 'varchar', length: '150' },
          { name: 'neutral_image', type: 'varchar', length: '500' },
          { name: 'smiling_image', type: 'varchar', length: '500' },
          { name: 'alt', type: 'varchar', length: '300', isNullable: true },
          { name: 'sort_order', type: 'integer', default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        checks: [{ name: 'CHK_culture_team_members_sort_order', expression: '"sort_order" >= 0' }],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'culture_team_members',
      new TableForeignKey({
        name: 'FK_culture_team_members_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'culture_team_members',
      new TableIndex({ name: 'IDX_culture_team_members_owner', columnNames: ['owner_id', 'sort_order', 'id'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('culture_team_members', true);
  }
}
