import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * `projects.category` (free text, e.g. "Aplicaciones web") backs the filter
 * chips on the public `/casos-de-exito` page. Kept free text rather than a
 * fixed enum — unlike `Post.category` — since the set of case-study
 * categories is expected to grow with DevSure's own project mix, not a
 * small closed list.
 */
export class AddProjectCategory1790035200000 implements MigrationInterface {
  name = 'AddProjectCategory1790035200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'projects',
      new TableColumn({ name: 'category', type: 'varchar', length: '60', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'category');
  }
}
