import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProfileHeroVisual1790380800000 implements MigrationInterface {
  name = 'AddProfileHeroVisual1790380800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'hero_visual', type: 'varchar', length: '255', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'hero_visual');
  }
}
