import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAdminAuth1788480000000 implements MigrationInterface {
  name = 'CreateAdminAuth1788480000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'admin_users',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true },
        { name: 'email', type: 'varchar', length: '254', isUnique: true },
        { name: 'password_hash', type: 'varchar', length: '255' },
        { name: 'role', type: 'varchar', length: '16', default: "'ADMIN'" },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
      ],
      checks: [{ name: 'CHK_admin_users_role', expression: `"role" IN ('ADMIN')` }],
    }), true);

    await queryRunner.createTable(new Table({
      name: 'admin_sessions',
      columns: [
        { name: 'selector', type: 'varchar', length: '36', isPrimary: true },
        { name: 'user_id', type: 'varchar', length: '36' },
        { name: 'token_hash', type: 'varchar', length: '64' },
        { name: 'csrf_hash', type: 'varchar', length: '64' },
        { name: 'expires_at', type: 'datetime' },
        { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
      ],
    }), true);
    await queryRunner.createForeignKey('admin_sessions', new TableForeignKey({
      name: 'FK_admin_sessions_user', columnNames: ['user_id'], referencedTableName: 'admin_users',
      referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
    await queryRunner.createIndices('admin_sessions', [
      new TableIndex({ name: 'IDX_admin_sessions_user', columnNames: ['user_id'] }),
      new TableIndex({ name: 'IDX_admin_sessions_expires', columnNames: ['expires_at'] }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('admin_sessions', true);
    await queryRunner.dropTable('admin_users', true);
  }
}
