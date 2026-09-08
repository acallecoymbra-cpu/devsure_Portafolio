import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * `profiles.stats` backs the "Nosotros" metrics strip (e.g. 8 years / 40+
 * projects), stored as JSON like `levels`/`techStack` elsewhere in the CMS
 * (see `ProfileStat` in `@devsure/contracts`).
 */
export class AddProfileStats1789948800000 implements MigrationInterface {
  name = 'AddProfileStats1789948800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'stats', type: 'text', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'stats');
  }
}
