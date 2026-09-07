import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProfiles1788912000000 implements MigrationInterface {
  name = 'CreateProfiles1788912000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'owner_id', type: 'varchar', length: '36', isUnique: true },
          { name: 'name', type: 'varchar', length: '150' },
          { name: 'full_name', type: 'varchar', length: '150', isNullable: true },
          { name: 'headline', type: 'text', isNullable: true },
          { name: 'bio', type: 'text', isNullable: true },
          { name: 'avatar', type: 'varchar', length: '255', isNullable: true },
          { name: 'resume', type: 'text', isNullable: true },
          { name: 'active_locales', type: 'text', default: "'en'" },
          { name: 'default_locale', type: 'varchar', length: '8', default: "'en'" },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'profiles',
      new TableForeignKey({
        name: 'FK_profiles_owner',
        columnNames: ['owner_id'],
        referencedTableName: 'admin_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('profiles', true);
  }
}
