import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdminUsername1788825600000 implements MigrationInterface {
  name = 'AddAdminUsername1788825600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'admin_users',
      new TableColumn({ name: 'username', type: 'varchar', length: '32', isUnique: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('admin_users', 'username');
  }
}
