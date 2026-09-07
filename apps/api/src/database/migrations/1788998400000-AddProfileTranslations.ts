import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const JSON_COLUMNS = [
  'hero_title',
  'hero_copy',
  'hero_note',
  'about_heading',
  'about_body',
  'strengths_heading',
  'strengths_intro',
  'experience_heading',
  'experience_intro',
  'education_heading',
  'portfolio_heading',
  'portfolio_intro',
  'skills_heading',
  'skills_intro',
  'workstyle_heading',
  'workstyle_intro',
  'testimonials_heading',
  'faq_heading',
  'blog_heading',
  'contact_heading',
  'contact_intro',
] as const;

export class AddProfileTranslations1788998400000 implements MigrationInterface {
  name = 'AddProfileTranslations1788998400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({ name: 'hero_tag', type: 'varchar', length: '60', isNullable: true }),
    );
    for (const name of JSON_COLUMNS) {
      await queryRunner.addColumn(
        'profiles',
        new TableColumn({ name, type: 'text', isNullable: true }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [...JSON_COLUMNS].reverse()) {
      await queryRunner.dropColumn('profiles', name);
    }
    await queryRunner.dropColumn('profiles', 'hero_tag');
  }
}
