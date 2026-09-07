import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RequireAdminPasswordChange1788739200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('admin_users', new TableColumn({
      name: 'must_change_password', type: 'boolean', default: true,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('admin_users', 'must_change_password');
  }
}
