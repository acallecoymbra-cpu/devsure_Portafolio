import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Backs the redesigned public testimonial card: a 1-5 star `rating` and an
 * optional colored result badge (`highlight_text` + `highlight_icon`, one of
 * `TESTIMONIAL_HIGHLIGHT_ICONS` in @devsure/contracts).
 */
export class AddTestimonialHighlights1790121600000 implements MigrationInterface {
  name = 'AddTestimonialHighlights1790121600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({ name: 'rating', type: 'float', default: 5 }),
    );
    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({ name: 'highlight_text', type: 'varchar', length: '120', isNullable: true }),
    );
    await queryRunner.addColumn(
      'testimonials',
      new TableColumn({ name: 'highlight_icon', type: 'varchar', length: '20', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('testimonials', 'highlight_icon');
    await queryRunner.dropColumn('testimonials', 'highlight_text');
    await queryRunner.dropColumn('testimonials', 'rating');
  }
}
