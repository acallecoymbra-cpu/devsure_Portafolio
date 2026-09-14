import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfileLogoWordmark1790294400000 implements MigrationInterface {
  name = 'AddProfileLogoWordmark1790294400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'logo_wordmark', type: 'varchar', length: '255', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'logo_wordmark');
  }
}
